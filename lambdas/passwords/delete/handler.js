const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
// FIX 1: Import relatif (fichier aplati)
const { successResponse, errorResponse, extractSessionId, validateSession } = require('./utils');

// FIX 2: Configuration Réseau pour LocalStack
const endpoint = process.env.LOCALSTACK_HOSTNAME
    ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566`
    : process.env.DYNAMODB_ENDPOINT;

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "eu-west-3",
    endpoint: endpoint
});

const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    try {
        console.log('EVENT delete:', JSON.stringify(event));

        // 1. Vérification de la session
        const sessionId = extractSessionId(event);
        if (!sessionId) return errorResponse('Unauthorized', 401);

        const session = await validateSession(sessionId, docClient);
        if (!session) return errorResponse('Invalid or expired session', 401);

        // 2. Récupération de l'ID du mot de passe (depuis l'URL /passwords/{id})
        const passwordId = event.pathParameters?.id;
        if (!passwordId) {
            return errorResponse('Password ID is required', 400);
        }

        // 3. Vérification de l'existence et de la PROPRIÉTÉ
        // On doit d'abord lire l'objet pour être sûr qu'il appartient à l'utilisateur
        const getCommand = new GetCommand({
            TableName: process.env.TABLE_NAME || 'passwords',
            Key: {
                id: passwordId // La clé primaire est "id" uniquement
            }
        });

        const existing = await docClient.send(getCommand);

        if (!existing.Item) {
            return errorResponse('Password not found', 404);
        }

        // SÉCURITÉ CRITIQUE : On vérifie que le password appartient bien à l'utilisateur connecté
        if (existing.Item.userId !== session.userId) {
            console.warn(`Tentative de suppression non autorisée par user ${session.userId} sur le mdp ${passwordId}`);
            return errorResponse('Forbidden: You do not own this password', 403);
        }

        // 4. Suppression effective
        await docClient.send(
            new DeleteCommand({
                TableName: process.env.TABLE_NAME || 'passwords',
                Key: {
                    id: passwordId
                }
            })
        );

        console.log(`Password ${passwordId} deleted successfully`);
        return successResponse({ message: 'Password deleted successfully' });

    } catch (error) {
        console.error('Error in delete password:', error);
        return errorResponse(`Internal server error: ${error.message}`, 500);
    }
};