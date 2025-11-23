const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
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
        console.log('EVENT register:', event);
        const body = event.body ? JSON.parse(event.body) : {};

        let { email, login, password } = body;
        if (!email && login) email = login;

        if (!email || !password) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: 'Email and password are required' }),
            };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = crypto.randomUUID();

        const sessionToken = crypto.randomBytes(32).toString('hex');
        const sessionExpiry = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24h

        const newUser = {
            userId,
            email,
            passwordHash: hashedPassword,
            createdAt: new Date().toISOString(),
            sessionToken,
            sessionExpiry
        };

        await docClient.send(new PutCommand({
            TableName: USERS_TABLE,
            Item: newUser
        }));

        console.log(`User registered successfully: ${userId}`);

        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },

            body: JSON.stringify({
                message: 'User created and logged in',
                userId: userId,
                login: email,
                sessionToken: sessionToken
            }),
        };

    } catch (error) {
        console.error('Error in register:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};