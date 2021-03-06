const { pool } = require("./query-db");
const crypto = require("crypto");
const { getTableName } = require("./get-table-name");

/** Given an array of offers, return true or false if they exist in the database */
const doesOfferExistInPG = async (offers) => {
  if (!offers || offers.length < 1) {
    return [];
  }

  // Could do something fancier
  const sqlParams = offers
    .map((_, index) => {
      return `$${index + 1}`;
    })
    .join(",");
  const offerHashes = offers.map((offer) => {
    return crypto.createHash("sha256").update(offer).digest("hex");
  });
  const searchHases = offerHashes.map((offer) => {
    return Buffer.from(offer, "hex");
  });

  const results = await pool.query(
    `SELECT encode(hash, 'hex') as hash from "${getTableName()}" WHERE hash IN (${sqlParams})`,
    searchHases
  );

  // turn the row hashes into a map
  const existingHashes = {};
  for (let i = 0; i < results.rows.length; i++) {
    existingHashes[results.rows[i].hash] = true;
  }

  const returnArray = [];
  for (let i = 0; i < offers.length; i++) {
    returnArray.push(existingHashes[offerHashes[i]] || false);
  }
  return returnArray;
};

module.exports.doesOfferExistInPG = doesOfferExistInPG;
