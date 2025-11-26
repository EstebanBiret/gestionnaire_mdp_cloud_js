const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const USERS_TABLE = process.env.USERS_TABLE || 'users';

const endpoint = process.env.LOCALSTACK_HOSTNAME
    ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566`
    : process.env.DYNAMODB_ENDPOINT;

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'eu-west-3',
    endpoint: endpoint
});

const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const { email, firstname, lastname, password } = body;

        if (!email || !password || !firstname || !lastname) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: 'Le mail, le mot de passe, le prénom et le nom sont requis' })
            };
        }

        const existingUser = await docClient.send(new QueryCommand({
            TableName: USERS_TABLE,
            IndexName: 'email-index',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': email }
        }));

        if (existingUser.Items.length > 0) {
            return {
                statusCode: 409,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: 'Cet email est déjà utilisé' })
            };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = crypto.randomUUID();
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const sessionExpiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

        const newUser = {
            userId,
            email,
            firstname: firstname || "",
            lastname: lastname || "",
            passwordHash: hashedPassword,
            createdAt: new Date().toISOString(),
            sessionToken,
            sessionExpiry
        };

        await docClient.send(new PutCommand({
            TableName: USERS_TABLE,
            Item: newUser
        }));

        const cookieString = `sessionToken=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`;

        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://localhost:4566',
                'Access-Control-Allow-Credentials': true,
                'Set-Cookie': cookieString
            },
            body: JSON.stringify({
                message: 'Inscription réussie',
                userId: userId,
                user: { email, firstname, lastname }
            }),
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Erreur interne du serveur' }),
        };
    }
};