const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "eu-west-3",
    endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:4566"
});

const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const { site, login, encryptedPassword } = body;

        if (!site || !login || !encryptedPassword) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Site, login and encryptedPassword are required" })
            };
        }

        const password = {
            id: Date.now().toString() + Math.floor(Math.random() * 1000),
            site,
            login,
            encryptedPassword,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await docClient.send(new PutCommand({
            TableName: "passwords",
            Item: password
        }));

        console.log("Password saved:", password);

        return {
            statusCode: 201,
            body: JSON.stringify(password)
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" })
        };
    }
};
