const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../shared/aws-clients');
const { successResponse, errorResponse, sendLog, extractSessionId, validateSession } = require('../shared/utils');

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

    const passwordId = event.pathParameters?.id;
    if (!passwordId) {
      return errorResponse('Password ID is required', 400);
    }

    const body = JSON.parse(event.body || '{}');
    const { site, login, encryptedPassword } = body;

    if (!site && !login && !encryptedPassword) {
      return errorResponse('At least one field must be provided', 400);
    }

    // Vérifier que le mot de passe appartient à l'utilisateur
    const existing = await docClient.send(
      new GetCommand({
        TableName: 'passwords',
        Key: {
          userId: session.userId,
          passwordId,
        },
      })
    );

    if (!existing.Item) {
      return errorResponse('Password not found', 404);
    }

    // Construire l'expression de mise à jour
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (site) {
      updateExpressions.push('#site = :site');
      expressionAttributeNames['#site'] = 'site';
      expressionAttributeValues[':site'] = site;
    }

    if (login) {
      updateExpressions.push('#login = :login');
      expressionAttributeNames['#login'] = 'login';
      expressionAttributeValues[':login'] = login;
    }

    if (encryptedPassword) {
      updateExpressions.push('#encryptedPassword = :encryptedPassword');
      expressionAttributeNames['#encryptedPassword'] = 'encryptedPassword';
      expressionAttributeValues[':encryptedPassword'] = encryptedPassword;
    }

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    await docClient.send(
      new UpdateCommand({
        TableName: 'passwords',
        Key: {
          userId: session.userId,
          passwordId,
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    await sendLog('password-logs', {
      action: 'password_updated',
      userId: session.userId,
      passwordId,
    });

    // Récupérer la version mise à jour
    const updated = await docClient.send(
      new GetCommand({
        TableName: 'passwords',
        Key: {
          userId: session.userId,
          passwordId,
        },
      })
    );

    return successResponse({
      id: updated.Item.passwordId,
      site: updated.Item.site,
      login: updated.Item.login,
      encryptedPassword: updated.Item.encryptedPassword,
      createdAt: updated.Item.createdAt,
      updatedAt: updated.Item.updatedAt,
    });
  } catch (error) {
    console.error('Error in update password:', error);
    return errorResponse('Internal server error', 500);
  }
};