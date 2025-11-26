const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const endpoint = process.env.LOCALSTACK_HOSTNAME
    ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566`
    : process.env.DYNAMODB_ENDPOINT;

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'eu-west-3',
    endpoint: endpoint
});

const docClient = DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.USERS_TABLE || 'users';

const ALLOWED_ORIGIN = 'http://localhost:4566';

const successResponse = (body, statusCode = 200) => {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
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
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message }),
    };
};

const getAuthenticatedUser = async (event) => {
    try {
        const cookies = event.headers?.Cookie || event.headers?.cookie;
        if (!cookies) return null;

        const match = cookies.match(/sessionToken=([^;]+)/);
        const token = match ? match[1] : null;

        if (!token) return null;

        const command = new QueryCommand({
            TableName: USERS_TABLE,
            IndexName: 'sessionToken-index',
            KeyConditionExpression: 'sessionToken = :token',
            ExpressionAttributeValues: { ':token': token }
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
    } catch (e) {
        console.error("Auth Error:", e);
        return null;
    }
};

module.exports = {
    successResponse,
    errorResponse,
    getAuthenticatedUser
};