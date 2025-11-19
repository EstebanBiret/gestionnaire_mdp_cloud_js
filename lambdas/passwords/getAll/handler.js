exports.handler = async (event) => {
  try {
    const session = { userId: "test-user" };

    // Données de test pour l'api
    const passwords = [
      { id: "1", site: "exemple.com", login: "user1", encryptedPassword: "xxxx", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "2", site: "test.com", login: "user2", encryptedPassword: "yyyy", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];

    return {
      statusCode: 200,
      body: JSON.stringify(passwords)
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
};