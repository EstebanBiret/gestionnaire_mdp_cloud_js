exports.handler = async (event) => {
  try {
    console.log("EVENT:", event);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        message: "Auth Lambda OK",
        received: event.body ? JSON.parse(event.body) : null
      })
    };

  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal error" })
    };
  }
};
