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

    if (password.length < 8) {
      return errorResponse('Password must be at least 8 characters', 400);
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await docClient.send(
      new QueryCommand({
        TableName: 'users',
        IndexName: 'login-index',
        KeyConditionExpression: 'login = :login',
        ExpressionAttributeValues: {
          ':login': login,
        },
      })
    );

    if (existingUser.Items && existingUser.Items.length > 0) {
      return errorResponse('User already exists', 409);
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Créer l'utilisateur
    await docClient.send(
      new PutCommand({
        TableName: 'users',
        Item: {
          userId,
          login,
          passwordHash,
          createdAt: new Date().toISOString(),
        },
      })
    );

    // Créer une session
    const sessionId = uuidv4();
    const expiresAt = Math.floor(Date.now() / 1000) + 3600 * 24; // 24h

    await docClient.send(
      new PutCommand({
        TableName: 'sessions',
        Item: {
          sessionId,
          userId,
          expiresAt,
        },
      })
    );

    await sendLog('auth-logs', {
      action: 'register_success',
      userId,
      login,
    });

    return successResponse(
      {
        sessionId,
        userId,
        login,
      },
      201
    );
  } catch (error) {
    console.error('Error in register:', error);
    return errorResponse('Internal server error', 500);
  }
};