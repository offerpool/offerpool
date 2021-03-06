const boolParse = (value, defaultValue) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  value = String(value).trim();

  if (/^(?:y|yes|true|1|on)$/i.test(value)) {
    return true;
  }

  if (/^(?:n|no|false|0|off)$/i.test(value)) {
    return false;
  }

  return defaultValue;
};

module.exports.boolParse = boolParse;
