const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../shared/aws-clients');
const { successResponse, errorResponse, sendLog, extractSessionId, validateSession } = require('../shared/utils');
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  try {
    const sessionId = extractSessionId(event);

    if (!sessionId) {
      return errorResponse('Unauthorized', 401);
    }

    // Valider la session
    const session = await validateSession(sessionId, docClient);
    if (!session) {
      return errorResponse('Invalid or expired session', 401);
    }

    const body = JSON.parse(event.body || '{}');
    const { site, login, encryptedPassword } = body;

    if (!site || !login || !encryptedPassword) {
      return errorResponse('Site, login and encrypted password are required', 400);
    }

    const passwordId = uuidv4();
    const now = new Date().toISOString();

    const password = {
      userId: session.userId,
      passwordId,
      site,
      login,
      encryptedPassword,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: 'passwords',
        Item: password,
      })
    );

    await sendLog('password-logs', {
      action: 'password_created',
      userId: session.userId,
      passwordId,
      site,
    });

    return successResponse(
      {
        id: passwordId,
        site,
        login,
        encryptedPassword,
        createdAt: now,
        updatedAt: now,
      },
      201
    );
  } catch (error) {
    console.error('Error in create password:', error);
    return errorResponse('Internal server error', 500);
  }
};