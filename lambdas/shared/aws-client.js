const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { S3Client } = require('@aws-sdk/client-s3');
const { SQSClient } = require('@aws-sdk/client-sqs');

const REGION = process.env.AWS_REGION || 'eu-west-3';
const ENDPOINT = process.env.AWS_ENDPOINT || 'http://localstack:4566';

// Config commune
const config = {
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
};

// DynamoDB Client
const ddbClient = new DynamoDBClient(config);
const docClient = DynamoDBDocumentClient.from(ddbClient);

// S3 Client
const s3Client = new S3Client({
  ...config,
  forcePathStyle: true,
});

// SQS Client
const sqsClient = new SQSClient(config);

module.exports = {
  docClient,
  s3Client,
  sqsClient,
  REGION,
};