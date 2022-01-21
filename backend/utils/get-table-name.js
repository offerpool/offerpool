const getTableName = () => {
  return process.env.TABLE_NAME || "chia-offers";
};

module.exports.getTableName = getTableName;
