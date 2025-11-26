const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
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
        console.log('EVENT create:', JSON.stringify(event));
        const user = await getAuthenticatedUser(event, docClient);

        if (!user) {
            return errorResponse('Unauthorized', 401);
        }
        // ------------------------------------

        const body = event.body ? JSON.parse(event.body) : {};
        const { site, login, encryptedPassword } = body;

        if (!site || !login || !encryptedPassword) {
            return errorResponse("Site, login et mot de passe sont requis", 400);
        }

        const passwordItem = {
            id: Date.now().toString() + Math.floor(Math.random() * 1000),
            userId: user.userId,
            site,
            login,
            encryptedPassword,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await docClient.send(new PutCommand({
            TableName: process.env.TABLE_NAME || "passwords",
            Item: passwordItem
        }));

        if (process.env.LOGS_QUEUE_URL) {
            try {
                await sqs.send(new SendMessageCommand({
                    QueueUrl: process.env.LOGS_QUEUE_URL,
                    MessageBody: JSON.stringify({
                        type: "CREATE_PASSWORD",
                        userId: user.userId,
                        site,
                        timestamp: Date.now()
                    })
                }));
            } catch (sqsError) {
                console.warn("Erreur SQS (non bloquant):", sqsError.message);
            }
        }

        return successResponse(passwordItem, 201);

    } catch (error) {
        console.error("Erreur create:", error);
        return errorResponse("Erreur interne du serveur", 500);
    }
};