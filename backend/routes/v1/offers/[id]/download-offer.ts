import { base58 } from "../../../../utils/base-58.js";
import { getTableName } from "../../../../utils/get-table-name.js";
import { pool } from "../../../../utils/query-db.js";
import { logger } from "../../../../utils/logger.js";
import type { Response } from "express";

export const downloadOffer = async (req: any, res: Response) => {
  try {
    const encodedHash = req.params.id;
    const hashAsHex = Buffer.from(base58.decode(encodedHash)).toString("hex");
    const query = `SELECT offer.offer
        FROM "${getTableName()}" offer
        WHERE encode(offer.hash, 'hex') = $1`;
    const result = await pool.query(query, [hashAsHex]);
    if (result.rows.length != 1) {
      res.status(404);
    } else {
      const offer = result.rows[0].offer;
      res.setHeader("Content-type", "text/plain");
      res.setHeader("Content-disposition", "attachment");
      res.send(offer);
    }
  } catch (error: any) {
    logger.error(
      { error: error?.message, query: req.query },
      "Error getting offers"
    );
    res.status(500).send();
  }
};
