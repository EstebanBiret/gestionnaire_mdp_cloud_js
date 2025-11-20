exports.handler = async (event) => {
  try {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    const sessionId = authHeader?.split(' ')[1];

    if (!sessionId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Session ID is required' })
      };
    }

    console.log('Logout called for session:', sessionId);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Logged out successfully (mock)' })
    };
  } catch (error) {
    console.error('Error in logout:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};