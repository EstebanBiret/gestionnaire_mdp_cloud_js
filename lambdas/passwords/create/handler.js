const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
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
    region: process.env.AWS_REGION || 'eu-west-3',
    endpoint: process.env.LOCALSTACK_HOSTNAME
        ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566`
        : process.env.SQS_ENDPOINT
});

exports.handler = async (event) => {
    try {
        const sessionId = extractSessionId(event);
        if (!sessionId) return errorResponse('Unauthorized', 401);

        const session = await validateSession(sessionId, docClient);
        if (!session) return errorResponse('Session invalide ou expirée', 401);

        const body = event.body ? JSON.parse(event.body) : {};
        const { site, login, encryptedPassword } = body;

        if (!site || !login || !encryptedPassword) {
            return errorResponse("Site, login et mot de passe sont requis", 400);
        }

        const passwordItem = {
            id: Date.now().toString() + Math.floor(Math.random() * 1000),
            userId: session.userId,
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

        await sqs.send(new SendMessageCommand({
            QueueUrl: process.env.LOGS_QUEUE_URL,
            MessageBody: JSON.stringify({
                type: "CREATE_PASSWORD",
                userId: session.userId,
                site,
                login,
                timestamp: Date.now()
            })
        }));

        return successResponse(passwordItem, 201);

    } catch (error) {
        return errorResponse("Erreur interne du serveur", 500);
    }
};