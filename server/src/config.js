require("dotenv").config();

function requiredNumber(name, fallback) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a number`);
  }
  return value;
}

const geminiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
].filter(Boolean);

module.exports = {
  port: requiredNumber("PORT", 4000),
  maxUploadBytes: requiredNumber("MAX_UPLOAD_BYTES", 8 * 1024 * 1024),
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  geminiKeys,
};