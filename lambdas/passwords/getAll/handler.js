const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { successResponse, errorResponse, extractSessionId, validateSession } = require('./utils');

const endpoint = process.env.LOCALSTACK_HOSTNAME
    ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566`
    : process.env.DYNAMODB_ENDPOINT;

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'eu-west-3',
    endpoint: endpoint
});

const docClient = DynamoDBDocumentClient.from(client);

const sqs = new SQSClient({
    region: process.env.AWS_REGION || "eu-west-3",
    endpoint: process.env.LOCALSTACK_HOSTNAME
        ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566`
        : process.env.SQS_ENDPOINT
});

exports.handler = async (event) => {
    try {
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

        await sqs.send(new SendMessageCommand({
            QueueUrl: process.env.LOGS_QUEUE_URL,
            MessageBody: JSON.stringify({
                type: "GET_PASSWORDS",
                userId: session.userId,
                timestamp: Date.now()
            })
        }));

        return successResponse(result.Items || []);
        
    } catch (error) {
        return errorResponse(`Erreur interne du serveur : ${error.message}`, 500);
    }
};