const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { successResponse, errorResponse, getAuthenticatedUser } = require('./utils');

const endpoint = process.env.LOCALSTACK_HOSTNAME
    ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566`
    : process.env.DYNAMODB_ENDPOINT;

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'eu-west-3',
    endpoint: endpoint
});

const docClient = DynamoDBDocumentClient.from(client);

const sqs = new SQSClient({
    region: process.env.AWS_REGION || 'eu-west-3',
    endpoint: endpoint
});

exports.handler = async (event) => {
    try {
        const user = await getAuthenticatedUser(event, docClient);
        if (!user) {
            return errorResponse('Unauthorized', 401);
        }
        // ----------------------------------------

        const command = new QueryCommand({
            TableName: process.env.TABLE_NAME || 'passwords',
            IndexName: 'userId-index',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': user.userId,
            },
        });

        const result = await docClient.send(command);
        const items = result.Items || [];

        // Log SQS
        if (process.env.LOGS_QUEUE_URL) {
            try {
                await sqs.send(new SendMessageCommand({
                    QueueUrl: process.env.LOGS_QUEUE_URL,
                    MessageBody: JSON.stringify({
                        type: "GET_PASSWORDS",
                        userId: user.userId,
                        count: items.length,
                        timestamp: Date.now()
                    })
                }));
            } catch (e) {
            }
        }

        return successResponse(items);

    } catch (error) {
        return errorResponse(`Erreur interne: ${error.message}`, 500);
    }
};