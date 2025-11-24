const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

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
        const tokenValue = event.authorizationToken || event.headers?.Authorization || event.headers?.authorization;

        if (!tokenValue) {
            throw new Error('Unauthorized');
        }

        const token = tokenValue.replace('Bearer ', '');

        const command = new QueryCommand({
            TableName: USERS_TABLE,
            IndexName: 'sessionToken-index',
            KeyConditionExpression: 'sessionToken = :token',
            FilterExpression: 'sessionExpiry > :now',
            ExpressionAttributeValues: {
                ':token': token,
                ':now': Math.floor(Date.now() / 1000)
            }
        });

        const result = await docClient.send(command);

        if (!result.Items || result.Items.length === 0) {
            throw new Error('Unauthorized');
        }

        const user = result.Items[0];

        return generatePolicy(user.userId, 'Allow', event.methodArn, user);

    } catch (error) {
        throw new Error('Unauthorized');
    }
};

const generatePolicy = (principalId, effect, resource, userContext) => {
    const authResponse = {
        principalId: principalId
    };

    if (effect && resource) {
        const policyDocument = {
            Version: '2012-10-17',
            Statement: [{
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: "*"
            }]
        };
        authResponse.policyDocument = policyDocument;
    }

    if (userContext) {
        authResponse.context = {
            userId: userContext.userId,
            email: userContext.email
        };
    }

    return authResponse;
};