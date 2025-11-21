const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || 'users';

exports.handler = async (event) => {
    try {
        const authHeader = event.headers?.Authorization || event.headers?.authorization;
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Authorization token is required' })
            };
        }

        // 1. Récupérer l'utilisateur via le token
        const result = await dynamodb.query({
            TableName: USERS_TABLE,
            IndexName: 'sessionToken-index',
            KeyConditionExpression: 'sessionToken = :token',
            ExpressionAttributeValues: {
                ':token': token
            }
        }).promise();

        if (result.Items.length === 0) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Invalid or expired token' })
            };
        }

        const user = result.Items[0];

        // 2. Supprimer le token de session
        await dynamodb.update({
            TableName: USERS_TABLE,
            Key: { userId: user.userId },
            UpdateExpression: 'REMOVE sessionToken, sessionExpiry',
            ConditionExpression: 'attribute_exists(userId)'
        }).promise();

        console.log('User logged out successfully:', user.userId);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Logged out successfully' })
        };

    } catch (error) {
        console.error('Error in logout:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};
