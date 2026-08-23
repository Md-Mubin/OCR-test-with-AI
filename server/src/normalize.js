function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeAccountId(value) {
  return String(value || "").replace(/[\s-]/g, "").toUpperCase();
}

function compareFields(extracted, profile) {
  const comparisons = {
    name: [normalizeText(extracted.name), normalizeText(profile.fullName)],
    bankName: [normalizeText(extracted.bankName), normalizeText(profile.bankName)],
    accountId: [normalizeAccountId(extracted.accountId), normalizeAccountId(profile.accountId)],
  };

  return Object.fromEntries(
    Object.entries(comparisons).map(([field, [received, expected]]) => [
      field,
      { matched: Boolean(received) && received === expected },
    ]),
  );
}

module.exports = { compareFields, normalizeAccountId, normalizeText };