function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function assertNonEmptyString(value, fieldName) {
  if (!isNonEmptyString(value)) {
    const err = new Error(`${fieldName} es requerido`);
    err.status = 400;
    throw err;
  }
}

function assertMongoId(value, fieldName) {
  // simple validation (24 hex chars)
  if (typeof value !== 'string' || !/^[a-fA-F0-9]{24}$/.test(value)) {
    const err = new Error(`${fieldName} inválido`);
    err.status = 400;
    throw err;
  }
}

module.exports = { assertNonEmptyString, assertMongoId };
