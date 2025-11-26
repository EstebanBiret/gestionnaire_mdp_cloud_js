const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const USERS_TABLE = process.env.USERS_TABLE || 'users';

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
        const cookieHeader = event.headers?.Cookie || event.headers?.cookie;
        let token = null;

        if (cookieHeader) {
            const match = cookieHeader.match(/sessionToken=([^;]+)/);
            if (match) token = match[1];
        }

        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'http://localhost:4566',
            'Access-Control-Allow-Credentials': true,
            'Set-Cookie': 'sessionToken=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
        };

        if (!token) {
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({ message: 'Session déjà inactive' })
            };
        }

        const queryCommand = new QueryCommand({
            TableName: USERS_TABLE,
            IndexName: 'sessionToken-index',
            KeyConditionExpression: 'sessionToken = :token',
            ExpressionAttributeValues: {
                ':token': token
            }
        });

        const result = await docClient.send(queryCommand);

        if (result.Items && result.Items.length > 0) {
            const user = result.Items[0];

            const updateCommand = new UpdateCommand({
                TableName: USERS_TABLE,
                Key: { userId: user.userId },
                UpdateExpression: 'REMOVE sessionToken, sessionExpiry',
                ConditionExpression: 'attribute_exists(userId)'
            });

            await docClient.send(updateCommand);
        }

        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({ message: 'Déconnexion réussie' })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://localhost:4566',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({ message: 'Erreur interne du serveur' })
        };
    }
};