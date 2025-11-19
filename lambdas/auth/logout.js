const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../shared/aws-clients');
const { successResponse, errorResponse, sendLog, extractSessionId, validateSession } = require('../shared/utils');

exports.handler = async (event) => {
  try {
    const sessionId = extractSessionId(event);

    if (!sessionId) {
      return errorResponse('Session ID is required', 401);
    }

    // Valider la session
    const session = await validateSession(sessionId, docClient);
    if (!session) {
      return errorResponse('Invalid or expired session', 401);
    }

    // Supprimer la session
    await docClient.send(
      new DeleteCommand({
        TableName: 'sessions',
        Key: { sessionId },
      })
    );

    await sendLog('auth-logs', {
      action: 'logout_success',
      userId: session.userId,
    });

    return successResponse({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in logout:', error);
    return errorResponse('Internal server error', 500);
  }
};