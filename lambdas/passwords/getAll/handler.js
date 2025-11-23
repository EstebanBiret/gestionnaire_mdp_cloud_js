const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { successResponse, errorResponse, extractSessionId, validateSession } = require('../../shared/utils');

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    ...(process.env.DYNAMODB_ENDPOINT && { endpoint: process.env.DYNAMODB_ENDPOINT }),
});

const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    try {
        const sessionId = extractSessionId(event);

        if (!sessionId) {
            return errorResponse('Unauthorized', 401);
        }

        const session = await validateSession(sessionId, docClient);
        if (!session) {
            return errorResponse('Invalid or expired session', 401);
        }

        const result = await docClient.send(
            new QueryCommand({
                TableName: process.env.TABLE_NAME || 'passwords',
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': session.userId,
                },
            })
        );

        return successResponse(result.Items || []);
    } catch (error) {
        console.error('Error in getAll passwords:', error);
        return errorResponse('Internal server error', 500);
    }
};
