exports.handler = async (event) => {
  try {

    const id = event.pathParameters?.id;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Mock delete OK for password ${id}`,
      }),
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Mock error" }),
    };
  }
};
