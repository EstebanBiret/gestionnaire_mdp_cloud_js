exports.handler = async (event) => {
  try {
    console.log("Event:", event);

    // Simuler l'extraction du sessionId
    const sessionId = "fake-session-id";

    const passwordId = event.pathParameters?.id;
    if (!passwordId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Password ID is required" })
      };
    }

    const body = JSON.parse(event.body || '{}');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "MOCK UPDATE SUCCESS",
        receivedId: passwordId,
        receivedBody: body
      })
    };

  } catch (error) {
    console.error("Mock update error:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "Mock error" }) };
  }
};
