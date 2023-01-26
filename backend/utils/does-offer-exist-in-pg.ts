import { pool } from "./query-db.js";
import crypto from "crypto";
import { getTableName } from "./get-table-name.js";

/** Given an array of offers, return true or false if they exist in the database */
export const doesOfferExistInPG = async (offers: string[]) => {
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
  const existingHashes: Record<string, boolean> = {};
  for (let i = 0; i < results.rows.length; i++) {
    existingHashes[results.rows[i].hash] = true;
  }

  const returnArray = [];
  for (let i = 0; i < offers.length; i++) {
    returnArray.push(existingHashes[offerHashes[i]] || false);
  }
  return returnArray;
};