const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

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
        console.log('EVENT login:', JSON.stringify(event));

        let body = event.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                console.error("Erreur parsing body:", e);
                body = {};
            }
        } else if (!body) {
            body = {};
        }

        const { login, password } = body;
        console.log("Login reçu:", login, "Password reçu:", password ? "***" : "null"); // Debug

        if (!login || !password) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': 'http://localhost:4566',
                    'Access-Control-Allow-Credentials': true
                },
                body: JSON.stringify({ message: 'Email et mot de passe requis' }),
            };
        }

        const user = await findUserByEmail(login);

        if (!user) {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': 'http://localhost:4566',
                    'Access-Control-Allow-Credentials': true
                },
                body: JSON.stringify({ message: 'Identifiants incorrects' }),
            };
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': 'http://localhost:4566',
                    'Access-Control-Allow-Credentials': true
                },
                body: JSON.stringify({ message: 'Identifiants incorrects' }),
            };
        }

        const sessionToken = crypto.randomBytes(32).toString('hex');
        const sessionExpiry = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24h
        const now = new Date().toISOString();

        await docClient.send(new UpdateCommand({
            TableName: USERS_TABLE,
            Key: { userId: user.userId },
            UpdateExpression: 'SET sessionToken = :token, sessionExpiry = :expiry, lastLogin = :lastLogin',
            ExpressionAttributeValues: {
                ':token': sessionToken,
                ':expiry': sessionExpiry,
                ':lastLogin': now
            }
        }));

        console.log(`User ${user.email} logged in successfully`);

        // 4. Création du cookie sécurisé
        const cookieString = `sessionToken=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://localhost:4566',
                'Access-Control-Allow-Credentials': true,
                'Set-Cookie': cookieString
            },
            body: JSON.stringify({
                message: 'Connexion réussie',
                userId: user.userId,
                user: {
                    email: user.email,
                    firstname: user.firstname,
                    lastname: user.lastname
                }
            }),
        };
    } catch (error) {
        console.error('Error in login:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://localhost:4566',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({ message: 'Erreur interne du serveur' }),
        };
    }
};

async function findUserByEmail(email) {
    const command = new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
            ':email': email
        }
    });

    const result = await docClient.send(command);
    return result.Items.length > 0 ? result.Items[0] : null;
}