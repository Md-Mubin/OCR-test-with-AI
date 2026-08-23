const { geminiKeys, geminiModel } = require("./config");

const extractionPrompt = `Extract information from this cheque image. Return JSON only with this exact shape:
{
  "name": string | null,
  "bankName": string | null,
  "accountId": string | null,
  "amount": string | null,
  "extraData": object,
  "fieldConfidence": { "name": number, "bankName": number, "accountId": number },
  "imageReadable": boolean
}
Read only clearly visible text. Never guess. Use null for unclear or missing values. Confidence values must be between 0 and 1.`;

function stripJsonFence(value) {
  return value.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
}

function validateExtraction(value) {
  if (!value || typeof value !== "object") throw new Error("Invalid extraction response");
  if (typeof value.imageReadable !== "boolean") throw new Error("Missing image readability result");
  if (!value.extraData || typeof value.extraData !== "object" || Array.isArray(value.extraData)) {
    value.extraData = {};
  }
  for (const field of ["name", "bankName", "accountId", "amount"]) {
    if (value[field] !== null && typeof value[field] !== "string") value[field] = null;
  }
  return value;
}

async function extractChequeData(image) {
  if (geminiKeys.length === 0) {
    throw Object.assign(new Error("Gemini API key is not configured"), { code: "AI_NOT_CONFIGURED" });
  }

  let lastError;
  for (const apiKey of geminiKeys) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: extractionPrompt },
            { inline_data: { mime_type: image.mimeType, data: image.buffer.toString("base64") } },
          ] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0 },
        }),
      });
      if (!response.ok) throw new Error(`Gemini request failed with ${response.status}`);
      const payload = await response.json();
      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini returned no extraction data");
      return validateExtraction(JSON.parse(stripJsonFence(text)));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

module.exports = { extractChequeData };