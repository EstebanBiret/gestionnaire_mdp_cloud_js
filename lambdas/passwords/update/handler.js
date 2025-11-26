const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
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
    endpoint: process.env.LOCALSTACK_HOSTNAME
        ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566`
        : process.env.SQS_ENDPOINT
});

exports.handler = async (event) => {
    try {
        const user = await getAuthenticatedUser(event, docClient);
        if (!user) return errorResponse("Unauthorized", 401);

        const passwordId = event.pathParameters?.id;
        if (!passwordId) {
            return errorResponse('Password ID is required', 400);
        }

        const body = event.body ? JSON.parse(event.body) : {};
        const { site, login, encryptedPassword } = body;

        if (!site && !login && !encryptedPassword) {
            return errorResponse('At least one field must be provided', 400);
        }

        const existing = await docClient.send(
            new GetCommand({
                TableName: process.env.TABLE_NAME || 'passwords',
                Key: {
                    id: passwordId
                },
            })
        );

        if (!existing.Item) {
            return errorResponse('Password not found', 404);
        }

        if (existing.Item.userId !== user.userId) {
            return errorResponse('Attention filou des bois : Vous ne possédez pas ce mot de passe', 403);
        }

        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        if (site) {
            updateExpressions.push('#site = :site');
            expressionAttributeNames['#site'] = 'site';
            expressionAttributeValues[':site'] = site;
        }

        if (login) {
            updateExpressions.push('#login = :login');
            expressionAttributeNames['#login'] = 'login';
            expressionAttributeValues[':login'] = login;
        }

        if (encryptedPassword) {
            updateExpressions.push('#encryptedPassword = :encryptedPassword');
            expressionAttributeNames['#encryptedPassword'] = 'encryptedPassword';
            expressionAttributeValues[':encryptedPassword'] = encryptedPassword;
        }

        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();

        const result = await docClient.send(
            new UpdateCommand({
                TableName: process.env.TABLE_NAME || 'passwords',
                Key: {
                    id: passwordId
                },
                UpdateExpression: `SET ${updateExpressions.join(', ')}`,
                ExpressionAttributeNames: expressionAttributeNames,
                ExpressionAttributeValues: expressionAttributeValues,
                ReturnValues: 'ALL_NEW'
            })
        );

        await sqs.send(new SendMessageCommand({
            QueueUrl: process.env.LOGS_QUEUE_URL,
            MessageBody: JSON.stringify({
                type: "UPDATE_PASSWORD",
                userId: user.userId,
                id: passwordId,
                timestamp: Date.now()
            })
        }));

        return successResponse({
            id: result.Attributes.id,
            site: result.Attributes.site,
            login: result.Attributes.login,
            encryptedPassword: result.Attributes.encryptedPassword,
            updatedAt: result.Attributes.updatedAt,
        });

    } catch (error) {
        return errorResponse(`Erreur interne du serveur : ${error.message}`, 500);
    }
};