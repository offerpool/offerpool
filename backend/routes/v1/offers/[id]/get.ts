import { base58 } from "../../../../utils/base-58.js";
import { getTableName } from "../../../../utils/get-table-name.js";
import { pool } from "../../../../utils/query-db.js";
import { mapCatInfo } from "../../../mappers/map-cat-info.js";
import { mapNftInfo } from "../../../mappers/map-nft-info.js";
import { logger } from "../../../../utils/logger.js";

export const getOfferByHash = async (req: any, res: any) => {
    try {
        const encodedHash = req.params.id;
        const hashAsHex = Buffer.from(base58.decode(encodedHash)).toString('hex');
        const query = `SELECT offer.*,
        json_agg(json_build_object('nft_launcher_id', nft.launcher_id,
                                   'nft_info', nft.nft_info
            )) as nft_info
        FROM "${getTableName()}" offer
        left outer join "${getTableName()}_nft_info" nft
        on nft.launcher_id = ANY (offer.offered_cats) or
           nft.launcher_id = ANY (offer.requested_cats)
        WHERE 
            encode(offer.hash, 'hex') = $1
        GROUP BY offer.id`
        const result = await pool.query(query, [hashAsHex]);
        if(result.rows.length != 1) {
            res.status(404);
        } else {
            res.json(await mapRowToOffer(result.rows[0]))
        }
    } catch (error: any) {
        logger.error({error: error?.message, query: req.query}, "Error getting offers")
        res.status(500).send();
    }
}

const mapRowToOffer = async (row: any) => {
    return {
      offer: row.offer,
      summary: row.parsed_offer,
      active: row.status ? true : false,
      summary_with_cat_info: {
        offered: await mapCatInfo(row.parsed_offer.offered),
        requested: await mapCatInfo(row.parsed_offer.requested),
      },
      nft_info: mapNftInfo(row.nft_info)
    };
  };