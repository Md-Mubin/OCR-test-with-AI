const express = require("express");
const multer = require("multer");
const { maxUploadBytes, port } = require("./config");
const { extractChequeData } = require("./gemini");
const { compareFields } = require("./normalize");
const { chequeRepository, profileRepository } = require("./repositories");

const app = express();
app.use((request, response, next) => {
  const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:3000";
  response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (request.method === "OPTIONS") return response.sendStatus(204);
  return next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadBytes, files: 1 },
  fileFilter: (_request, file, callback) => {
    callback(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
  },
});

app.get("/health", (_request, response) => response.json({ status: "ok" }));

app.post("/api/cheques/verify", upload.single("cheque"), async (request, response) => {
  const userId = request.header("x-user-id") || "demo-user";
  if (!request.file) return response.status(400).json({ verified: false, errorCode: "IMAGE_REQUIRED" });

  try {
    const profile = await profileRepository.findByUserId(userId);
    if (!profile) return response.status(404).json({ verified: false, errorCode: "PROFILE_NOT_FOUND" });

    const extracted = await extractChequeData({ buffer: request.file.buffer, mimeType: request.file.mimetype });
    if (!extracted.imageReadable || ["name", "bankName", "accountId"].some((field) => !extracted[field])) {
      return response.status(422).json({ verified: false, errorCode: "IDENTITY_DATA_UNREADABLE" });
    }

    const fields = compareFields(extracted, profile);
    const mismatchedFields = Object.entries(fields).filter(([, value]) => !value.matched).map(([field]) => field);
    if (mismatchedFields.length > 0) {
      return response.status(422).json({ verified: false, mismatchedFields, errorCode: "PROFILE_DATA_MISMATCH" });
    }

    const submission = await chequeRepository.createVerified({ userId, extracted });
    return response.status(200).json({
      verified: true,
      matchedFields: Object.keys(fields),
      submissionId: submission.id,
    });
  } catch (error) {
    const status = error.code === "AI_NOT_CONFIGURED" ? 503 : 502;
    return response.status(status).json({ verified: false, errorCode: error.code || "EXTRACTION_FAILED" });
  }
});

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError) return response.status(400).json({ verified: false, errorCode: "INVALID_UPLOAD" });
  return response.status(400).json({ verified: false, errorCode: "INVALID_REQUEST" });
});

app.listen(port, () => console.log(`Cheque verification API listening on port ${port}`));