const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

const successResponse = (body, statusCode = 200) => {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(body),
    };
};

const errorResponse = (message, statusCode = 500) => {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message }),
    };
};

const extractSessionId = (event) => {
    const headers = event.headers || {};
    const authHeader = headers.Authorization || headers.authorization;

    if (!authHeader) return null;

    // Format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        return parts[1];
    }
    return authHeader;
};

const validateSession = async (sessionId, docClient) => {
    const { GetCommand } = require('@aws-sdk/lib-dynamodb');

    if (!sessionId) return null;

    const USERS_TABLE = process.env.USERS_TABLE || 'users';

    try {
        const { ScanCommand } = require('@aws-sdk/lib-dynamodb');

        const command = new ScanCommand({
            TableName: USERS_TABLE,
            FilterExpression: 'sessionToken = :token',
            ExpressionAttributeValues: {
                ':token': sessionId
            }
        });

        const result = await docClient.send(command);

        if (result.Items && result.Items.length > 0) {
            const user = result.Items[0];
            const now = Math.floor(Date.now() / 1000);

            if (user.sessionExpiry && user.sessionExpiry > now) {
                return user;
            }
        }
        return null;
    } catch (error) {
        console.error("Session validation error:", error);
        return null;
    }
};

module.exports = {
    successResponse,
    errorResponse,
    extractSessionId,
    validateSession
};