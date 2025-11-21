const AWS = require('aws-sdk');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || 'users';

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const { login, password } = body;

        if (!login || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Login and password are required' }),
            };
        }

        const user = await findUserByLogin(login);

        if (!user) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Invalid credentials' }),
            };
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Invalid credentials' }),
            };
        }

        if (!user.isActive) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Account is disabled' }),
            };
        }

        const sessionToken = crypto.randomBytes(32).toString('hex');
        const sessionExpiry = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24h
        const now = new Date().toISOString();

        await dynamodb.update({
            TableName: USERS_TABLE,
            Key: { userId: user.userId },
            UpdateExpression: 'SET sessionToken = :token, sessionExpiry = :expiry, lastLogin = :lastLogin',
            ExpressionAttributeValues: {
                ':token': sessionToken,
                ':expiry': sessionExpiry,
                ':lastLogin': now
            }
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                sessionToken,
                userId: user.userId,
                email: user.email,
                expiresAt: sessionExpiry
            }),
        };
    } catch (error) {
        console.error('Error in login:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};

async function findUserByLogin(login) {
    let result = await dynamodb.query({
        TableName: USERS_TABLE,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :login',
        ExpressionAttributeValues: {
            ':login': login
        }
    }).promise();

    if (result.Items.length > 0) {
        return result.Items[0];
    }

    result = await dynamodb.query({
        TableName: USERS_TABLE,
        IndexName: 'username-index',
        KeyConditionExpression: 'username = :login',
        ExpressionAttributeValues: {
            ':login': login
        }
    }).promise();

    return result.Items.length > 0 ? result.Items[0] : null;
}
