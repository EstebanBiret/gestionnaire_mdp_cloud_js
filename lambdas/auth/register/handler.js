const AWS = require('aws-sdk');
const crypto = require('crypto');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || 'users';

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

exports.handler = async (event) => {
    try {
        console.log("EVENT:", event);

        const body = event.body ? JSON.parse(event.body) : {};
        const { email, password } = body;

        // Validation des champs
        if (!email || !password) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({
                    message: 'Missing required fields: username, email, password'
                })
            };
        }

        // Vérifier si l'email existe déjà
        const existingUser = await dynamodb.query({
            TableName: USERS_TABLE,
            IndexName: 'email-index',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email
            }
        }).promise();

        if (existingUser.Items.length > 0) {
            return {
                statusCode: 409,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({
                    message: 'Email already registered'
                })
            };
        }

        // Créer l'utilisateur
        const userId = crypto.randomUUID();
        const hashedPassword = hashPassword(password);
        const now = Math.floor(Date.now() / 1000);

        const user = {
            userId,
            email,
            password: hashedPassword,
            createdAt: now,
            updatedAt: now
        };

        await dynamodb.put({
            TableName: USERS_TABLE,
            Item: user,
            ConditionExpression: 'attribute_not_exists(userId)'
        }).promise();

        console.log('User registered successfully:', userId);

        return {
            statusCode: 201,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({
                message: 'User registered successfully',
                userId,
                username,
                email
            })
        };

    } catch (error) {
        console.error('Error in register:', error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
