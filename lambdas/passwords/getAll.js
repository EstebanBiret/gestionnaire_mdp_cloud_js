const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../shared/aws-clients');
const { successResponse, errorResponse, extractSessionId, validateSession } = require('../shared/utils');

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

    // Récupérer tous les mots de passe de l'utilisateur
    const result = await docClient.send(
      new QueryCommand({
        TableName: 'passwords',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': session.userId,
        },
      })
    );

    const passwords = (result.Items || []).map((item) => ({
      id: item.passwordId,
      site: item.site,
      login: item.login,
      encryptedPassword: item.encryptedPassword,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return successResponse(passwords);
  } catch (error) {
    console.error('Error in getAll passwords:', error);
    return errorResponse('Internal server error', 500);
  }
};