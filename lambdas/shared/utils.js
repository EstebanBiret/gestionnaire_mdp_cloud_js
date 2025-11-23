const { SendMessageCommand } = require('@aws-sdk/client-sqs');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { sqsClient } = require('./aws-clients');

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

// Réponse success
function successResponse(data, statusCode = 200) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(data),
  };
}

// Réponse erreur
function errorResponse(message, statusCode = 400) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({ error: message }),
  };
}

// Envoyer un log dans SQS
async function sendLog(queueName, message) {
  try {
    const queueUrl = `http://localstack:4566/000000000000/${queueName}`;
    await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          timestamp: new Date().toISOString(),
          ...message,
        }),
      })
    );
  } catch (error) {
    console.error('Error sending log to SQS:', error);
  }
}

// Valider une session
async function validateSession(sessionId, docClient) {
    if (!sessionId) return null;

    try {
        const result = await docClient.send(
            new GetCommand({
                TableName: 'sessions',
                Key: { sessionId },
            })
        );

        if (!result.Item) return null;

        const now = Math.floor(Date.now() / 1000);
        if (result.Item.expiresAt < now) {
            return null;
        }

        return result.Item;
    } catch (error) {
        console.error('Error validating session:', error);
        return null;
    }
}

// Extraire sessionId des headers ou cookies
function extractSessionId(event) {
  // Depuis header Authorization
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Depuis cookies
  const cookies = event.headers?.Cookie || event.headers?.cookie;
  if (cookies) {
    const match = cookies.match(/sessionId=([^;]+)/);
    if (match) return match[1];
  }

  return null;
}

module.exports = {
  corsHeaders,
  successResponse,
  errorResponse,
  sendLog,
  validateSession,
  extractSessionId,
};