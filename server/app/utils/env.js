const sanitizeValue = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return value;
  const [clean] = value.split("#");
  const trimmed = clean.trim();
  return trimmed.length ? trimmed : undefined;
};

const getNumberEnv = (key, fallback) => {
  const raw = sanitizeValue(process.env[key]);
  const num = Number(raw);
  return Number.isFinite(num) ? num : fallback;
};

const getStringEnv = (key, fallback) => {
  const raw = sanitizeValue(process.env[key]);
  return raw !== undefined ? raw : fallback;
};

module.exports = {
  sanitizeValue,
  getNumberEnv,
  getStringEnv,
};
