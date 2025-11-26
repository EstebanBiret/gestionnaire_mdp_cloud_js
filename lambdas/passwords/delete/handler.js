const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { successResponse, errorResponse, getAuthenticatedUser } = require('./utils');

const endpoint = process.env.LOCALSTACK_HOSTNAME
    ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566`
    : process.env.DYNAMODB_ENDPOINT;

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "eu-west-3",
    endpoint: endpoint
});

const docClient = DynamoDBDocumentClient.from(client);

const sqs = new SQSClient({
    region: process.env.AWS_REGION || "eu-west-3",
    endpoint: endpoint
});

exports.handler = async (event) => {
    try {
        const user = await getAuthenticatedUser(event, docClient);

        if (!user) {return errorResponse('Unauthorized', 401);}

        const passwordId = event.pathParameters?.id;
        if (!passwordId) {
            return errorResponse('Password ID is required', 400);
        }

        const getCommand = new GetCommand({
            TableName: process.env.TABLE_NAME || 'passwords',
            Key: {
                id: passwordId
            }
        });

        const existing = await docClient.send(getCommand);

        if (!existing.Item) {
            return errorResponse('Password not found', 404);
        }

        if (existing.Item.userId !== user.userId) {
            return errorResponse('Attention filou des bois : Vous ne possédez pas ce mot de passe', 403);
        }

        await docClient.send(
            new DeleteCommand({
                TableName: process.env.TABLE_NAME || 'passwords',
                Key: {
                    id: passwordId
                }
            })
        );

        if (process.env.LOGS_QUEUE_URL) {
            try {
                await sqs.send(new SendMessageCommand({
                    QueueUrl: process.env.LOGS_QUEUE_URL,
                    MessageBody: JSON.stringify({
                        type: "DELETE_PASSWORD",
                        userId: user.userId,
                        id: passwordId,
                        timestamp: Date.now()
                    })
                }));
            } catch (sqsError) {
            }
        }

        return successResponse({ message: 'Mot de passe supprimé avec succès' });

    } catch (error) {
        return errorResponse(`Erreur interne du serveur : ${error.message}`, 500);
    }
};