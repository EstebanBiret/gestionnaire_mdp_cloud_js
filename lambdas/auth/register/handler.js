const { docClient } = require('../shared/aws-clients');
const { successResponse, errorResponse, sendLog } = require('../../shared/utils');
const bcrypt = require('bcryptjs');

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



    if (existingUser.Items && existingUser.Items.length > 0) {
      return errorResponse('User already exists', 409);
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = Date.now().toString() + Math.floor(Math.random() * 1000);


    // Créer une session
    const sessionId = Date.now().toString() + Math.floor(Math.random() * 1000);
    const expiresAt = Math.floor(Date.now() / 1000) + 3600 * 24; // 24h


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