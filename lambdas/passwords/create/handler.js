const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
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
        console.log('EVENT create:', JSON.stringify(event));

        const sessionId = extractSessionId(event);
        if (!sessionId) return errorResponse('Unauthorized', 401);

        const session = await validateSession(sessionId, docClient);
        if (!session) return errorResponse('Invalid or expired session', 401);

        const body = event.body ? JSON.parse(event.body) : {};
        const { site, login, encryptedPassword } = body;

        if (!site || !login || !encryptedPassword) {
            return errorResponse("Site, login and encryptedPassword are required", 400);
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

        console.log("Password saved:", passwordItem);

        return successResponse(passwordItem, 201);

    } catch (error) {
        console.error('Error creating password:', error);
        return errorResponse("Internal server error", 500);
    }
};