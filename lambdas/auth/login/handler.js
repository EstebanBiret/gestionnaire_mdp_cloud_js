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

        const body = JSON.parse(event.body || '{}');
        const { login, password } = body;

        if (!login || !password) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: 'Login et mot de passe requis' }),
            };
        }

        const user = await findUserByEmail(login);

        if (!user) {
            return {
                statusCode: 401,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: 'Ce compte n\'existe pas' }),
            };
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return {
                statusCode: 401,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: 'Mot de passe incorrect' }),
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

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                sessionToken,
                userId: user.userId,
                email: user.email,
                /*firstname: user.firstname,
                lastname: user.lastname, TODO voir comment récup ces infos car on a pas ces champs dans le form de login, API pour avoir les infos du currentUser ?*/
                expiresAt: sessionExpiry
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