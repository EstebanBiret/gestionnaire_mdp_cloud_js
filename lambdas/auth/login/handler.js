exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { login, password } = body;

    if (!login || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Login and password are required' }),
      };
    }

    console.log('Login called with:', login, password);

    // Générer une session mock
    const sessionId = 'mock-session-12345';
    const userId = 'mock-user-1';

    return {
      statusCode: 200,
      body: JSON.stringify({
        sessionId,
        userId,
        login,
      }),
    };
  } catch (error) {
    console.error('Error in login:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
