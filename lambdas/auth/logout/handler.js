const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

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
        console.log('EVENT logout:', JSON.stringify(event));

        const authHeader = event.headers?.Authorization || event.headers?.authorization;
        const token = authHeader?.replace(/^Bearer\s+/i, '');

        if (!token) {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'Authorization token is required' })
            };
        }

        const queryCommand = new QueryCommand({
            TableName: USERS_TABLE,
            IndexName: 'sessionToken-index',
            KeyConditionExpression: 'sessionToken = :token',
            ExpressionAttributeValues: {
                ':token': token
            }
        });

        const result = await docClient.send(queryCommand);

        if (!result.Items || result.Items.length === 0) {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'Invalid or expired token' })
            };
        }

        const user = result.Items[0];

        const updateCommand = new UpdateCommand({
            TableName: USERS_TABLE,
            Key: { userId: user.userId },
            UpdateExpression: 'REMOVE sessionToken, sessionExpiry',
            ConditionExpression: 'attribute_exists(userId)'
        });

        await docClient.send(updateCommand);

        console.log('User logged out successfully:', user.userId);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'Logged out successfully' })
        };

    } catch (error) {
        console.error('Error in logout:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};