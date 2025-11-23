// handler.js (refacto AWS SDK v3)
const crypto = require('crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
    DynamoDBDocumentClient,
    QueryCommand,
    PutCommand,
} = require('@aws-sdk/lib-dynamodb');

const USERS_TABLE = process.env.USERS_TABLE || 'users';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

exports.handler = async (event) => {
    try {
        console.log('EVENT:', event);

        const body = event.body ? JSON.parse(event.body) : {};
        const { email, password } = body;

        if (!email || !password) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    message: 'Missing required fields: email, password',
                }),
            };
        }

        // Vérifier si l\'email existe déjà
        const existingUser = await ddb.send(
            new QueryCommand({
                TableName: USERS_TABLE,
                IndexName: 'email-index',
                KeyConditionExpression: 'email = :email',
                ExpressionAttributeValues: {
                    ':email': email,
                },
            })
        );

        if (existingUser.Items && existingUser.Items.length > 0) {
            return {
                statusCode: 409,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    message: 'Email already registered',
                }),
            };
        }

        const userId = crypto.randomUUID();
        const hashedPassword = hashPassword(password);
        const now = Math.floor(Date.now() / 1000);

        const user = {
            userId,
            email,
            password: hashedPassword,
            createdAt: now,
            updatedAt: now,
        };

        await ddb.send(
            new PutCommand({
                TableName: USERS_TABLE,
                Item: user,
                ConditionExpression: 'attribute_not_exists(userId)',
            })
        );

        console.log('User registered successfully:', userId);

        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                message: 'User registered successfully',
                userId,
                email,
            }),
        };
    } catch (error) {
        console.error('Error in register:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
