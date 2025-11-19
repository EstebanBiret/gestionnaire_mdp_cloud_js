const { QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../shared/aws-clients');
const { successResponse, errorResponse, sendLog } = require('../shared/utils');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { login, password } = body;

    if (!login || !password) {
      return errorResponse('Login and password are required', 400);
    }

    // Chercher l'utilisateur par login
    const result = await docClient.send(
      new QueryCommand({
        TableName: 'users',
        IndexName: 'login-index',
        KeyConditionExpression: 'login = :login',
        ExpressionAttributeValues: {
          ':login': login,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      await sendLog('auth-logs', {
        action: 'login_failed',
        login,
        reason: 'user_not_found',
      });
      return errorResponse('Invalid credentials', 401);
    }

    const user = result.Items[0];

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      await sendLog('auth-logs', {
        action: 'login_failed',
        login,
        reason: 'invalid_password',
      });
      return errorResponse('Invalid credentials', 401);
    }

    // Créer une session
    const sessionId = uuidv4();
    const expiresAt = Math.floor(Date.now() / 1000) + 3600 * 24; // 24h

    await docClient.send(
      new PutCommand({
        TableName: 'sessions',
        Item: {
          sessionId,
          userId: user.userId,
          expiresAt,
        },
      })
    );

    await sendLog('auth-logs', {
      action: 'login_success',
      userId: user.userId,
      login,
    });

    return successResponse({
      sessionId,
      userId: user.userId,
      login: user.login,
    });
  } catch (error) {
    console.error('Error in login:', error);
    return errorResponse('Internal server error', 500);
  }
};