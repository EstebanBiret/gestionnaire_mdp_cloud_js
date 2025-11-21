const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || 'users';

exports.handler = async (event) => {
    try {
        const token = event.authorizationToken?.replace('Bearer ', '');

        if (!token) {
            throw new Error('Unauthorized');
        }

        // Vérifier le token dans DynamoDB
        const result = await dynamodb.query({
            TableName: USERS_TABLE,
            IndexName: 'sessionToken-index',
            KeyConditionExpression: 'sessionToken = :token',
            FilterExpression: 'sessionExpiry > :now',
            ExpressionAttributeValues: {
                ':token': token,
                ':now': Math.floor(Date.now() / 1000)
            }
        }).promise();

        if (result.Items.length === 0) {
            throw new Error('Unauthorized');
        }

        const user = result.Items[0];

        // Générer la policy IAM
        return {
            principalId: user.userId,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [{
                    Action: 'execute-api:Invoke',
                    Effect: 'Allow',
                    Resource: event.methodArn
                }]
            },
            context: {
                userId: user.userId,
                username: user.username,
                email: user.email
            }
        };

    } catch (error) {
        console.error('Authorization failed:', error);
        throw new Error('Unauthorized');
    }
};
