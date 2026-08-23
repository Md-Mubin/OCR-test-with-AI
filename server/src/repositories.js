const crypto = require("node:crypto");

// Replace these in-memory repositories with the project's database repositories.
const profiles = new Map([
  ["demo-user", {
    id: "demo-user",
    fullName: "Amina Rahman",
    bankName: "Example Bank",
    accountId: "1234567890",
  }],
]);

const chequeSubmissions = [];

const profileRepository = {
  async findByUserId(userId) {
    return profiles.get(userId) || null;
  },
};

const chequeRepository = {
  async createVerified({ userId, extracted }) {
    const submission = {
      id: crypto.randomUUID(),
      userId,
      verificationStatus: "VERIFIED",
      amount: extracted.amount,
      extraData: extracted.extraData,
      createdAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
    };
    chequeSubmissions.push(submission);
    return submission;
  },
};

module.exports = { chequeRepository, profileRepository };