exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Méthode non autorisée" };
  }

  try {
    const { telephone, code } = JSON.parse(event.body);
    if (!telephone || !code) {
      return { statusCode: 400, body: JSON.stringify({ error: "Numéro ou code manquant" }) };
    }

    let to = telephone.trim().replace(/\s/g, "");
    if (to.startsWith("0")) to = "+33" + to.slice(1);
    else if (!to.startsWith("+")) to = "+33" + to;

    const auth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString("base64");

    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ To: to, Code: code })
      }
    );

    const result = await response.json();
    if (!response.ok) {
      console.error(result);
      return { statusCode: response.status, body: JSON.stringify({ error: result.message || "Erreur Twilio" }) };
    }

    const verified = result.status === "approved";
    return { statusCode: 200, body: JSON.stringify({ success: verified, status: result.status }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: "Erreur serveur" }) };
  }
};
