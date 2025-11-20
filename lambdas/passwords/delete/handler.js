const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { successResponse, errorResponse, sendLog, extractSessionId, validateSession } = require('../../shared/utils');

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "eu-west-3",
    endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:4566"
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

        const passwordId = event.pathParameters?.id;
        if (!passwordId) {
            return errorResponse('Password ID is required', 400);
        }

        const existing = await docClient.send(
            new GetCommand({
                TableName: process.env.TABLE_NAME || 'passwords',
                Key: {
                    userId: session.userId,
                    passwordId,
                },
            })
        );

        if (!existing.Item) {
            return errorResponse('Password not found', 404);
        }

        await docClient.send(
            new DeleteCommand({
                TableName: process.env.TABLE_NAME || 'passwords',
                Key: {
                    userId: session.userId,
                    passwordId,
                },
            })
        );

        await sendLog('password-logs', {
            action: 'password_deleted',
            userId: session.userId,
            passwordId,
            site: existing.Item.site,
        });

        return successResponse({ message: 'Password deleted successfully' });
    } catch (error) {
        console.error('Error in delete password:', error);
        return errorResponse('Internal server error', 500);
    }
};
