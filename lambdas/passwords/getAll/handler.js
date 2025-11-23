const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { successResponse, errorResponse, extractSessionId, validateSession } = require('./utils');

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
        console.log('EVENT getAll:', JSON.stringify(event));

        const sessionId = extractSessionId(event);
        if (!sessionId) return errorResponse('Unauthorized', 401);

        const session = await validateSession(sessionId, docClient);
        if (!session) return errorResponse('Invalid or expired session', 401);

        const command = new QueryCommand({
            TableName: process.env.TABLE_NAME || 'passwords',
            IndexName: 'userId-index',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': session.userId,
            },
        });

        const result = await docClient.send(command);

        return successResponse(result.Items || []);
    } catch (error) {
        console.error('Error in getAll passwords:', error);
        return errorResponse(`Internal server error: ${error.message}`, 500);
    }
};