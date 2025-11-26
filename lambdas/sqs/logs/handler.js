const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const endpoint = process.env.LOCALSTACK_HOSTNAME
    ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566`
    : process.env.DYNAMODB_ENDPOINT;

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'eu-west-3',
    endpoint: endpoint
});

const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    console.log("Received SQS event:", JSON.stringify(event, null, 2));

    for (const record of event.Records) {
        try {
            const log = JSON.parse(record.body);

            const logItem = {
                id: Date.now().toString() + Math.floor(Math.random() * 1000),
                type: log.type,
                userId: log.userId,
                site: log.site,
                login: log.login,
                timestamp: log.timestamp
            };

            await docClient.send(new PutCommand({
                TableName: process.env.LOGS_TABLE,
                Item: logItem
            }));

            console.log("Inserted log item:", logItem);
        } catch (error) {
            console.error("Error processing SQS message:", error);
        }
    }

    return { statusCode: 200 };
};
