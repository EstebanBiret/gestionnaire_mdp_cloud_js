const { successResponse, errorResponse, getAuthenticatedUser } = require('./utils');

exports.handler = async (event) => {
    const user = await getAuthenticatedUser(event);

    if (!user) {
        return errorResponse('Non authentifié', 401);
    }

    return successResponse({
        authenticated: true,
        user: {
            userId: user.userId,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname
        }
    });
};