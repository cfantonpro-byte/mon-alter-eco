exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Méthode non autorisée" };
  }

  try {
    const data = JSON.parse(event.body);

    // Mapping validé : champ du formulaire -> colonne Airtable
    const fields = {
      "CSP": data.csp || "",
      "Situation familiale": data.situationFamiliale || "",
      "Age": data.age,
      "Imposition annuelle": data.impositionAnnuelle || "",
      "Effort d'épargne": data.effortEpargne || "",
      "Epargne totale": data.epargneTotale || "",
      "Ville": data.ville || "",
      "Code postal": data.codePostal || "",
      "Nom et prénom": data.nomPrenom || "",
      "N° telephone (fx)": data.telephone ? parseInt(data.telephone.replace(/\D/g, ""), 10) : null,
      "Objectifs": Array.isArray(data.objectifs) ? data.objectifs : []
    };

    // Airtable n'aime pas les valeurs null/undefined : on les retire avant l'envoi
    Object.keys(fields).forEach((key) => {
      if (fields[key] === null || fields[key] === undefined || fields[key] === "") {
        delete fields[key];
      }
    });

    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME)}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          records: [{ fields }],
          typecast: true // crée automatiquement les options manquantes dans les champs "Choix unique"/"Objectifs multiples"
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Erreur Airtable:", result);
      return { statusCode: response.status, body: JSON.stringify(result) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id: result.records[0].id })
    };
  } catch (error) {
    console.error("Erreur serveur:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Erreur serveur" }) };
  }
};
