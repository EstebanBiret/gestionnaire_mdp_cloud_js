const { GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
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

    // Supprimer le mot de passe
    await docClient.send(
      new DeleteCommand({
        TableName: 'passwords',
        Key: {
          userId: session.userId,
          passwordId,
        },
      })
    );

    await sendLog('password-logs', {
      action: 'password_deleted',
      userId: session.userId,
      passwordId,
      site: existing.Item.site,
    });

    return successResponse({ message: 'Password deleted successfully' });
  } catch (error) {
    console.error('Error in delete password:', error);
    return errorResponse('Internal server error', 500);
  }
};