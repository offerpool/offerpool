import { mapCatInfo } from "../../../../mappers/map-cat-info.js";
import { mapMinNftInfo } from "../../../../mappers/map-nft-info.js";
import { getTableName } from "../../../../../utils/get-table-name.js";
import { logger } from "../../../../../utils/logger.js";
import { pool } from "../../../../../utils/query-db.js";
import { base58 } from "../../../../../utils/base-58.js";

export const getOffersForCollectionRoute = async (req: any, res: any) => {
  try {
    const did = req.query["did"];
    const collectionId = req.query["collection_id"];
    const valid = req.query["valid"];

    let statusSearchParam = null;
    // default to only show valid offers
    if (valid == "all") {
      statusSearchParam = null;
    } else if (valid !== undefined) {
      statusSearchParam = valid ? 1 : 0;
    } else {
      statusSearchParam = 1;
    }

    const query = `
      SELECT offer.hash, offer.status, offer.parsed_offer,
        json_agg(json_build_object('nft_launcher_id', nft.launcher_id,
                                   'nft_info', nft.nft_info
            )) as nft_info
        FROM "${getTableName()}" offer
        inner join "${getTableName()}_requested_cat" requested on requested.offer_id = offer.id
        inner join "${getTableName()}_nft_info" nft
        on nft.launcher_id = requested.cat_id
        WHERE
        ($1::smallint IS NULL OR status = $1::smallint) AND
        nft.collection_id = $2 AND
        nft.minter_did_id = $3
    GROUP BY offer.id
    UNION ALL
    SELECT offer.hash, offer.status, offer.parsed_offer,
            json_agg(json_build_object('nft_launcher_id', nft.launcher_id,
                                      'nft_info', nft.nft_info
                )) as nft_info
        FROM "${getTableName()}" offer
        inner join "${getTableName()}_offered_cat" offered on offered.offer_id = offer.id
        inner join "${getTableName()}_nft_info" nft
        on nft.launcher_id = offered.cat_id
        WHERE
        ($1::smallint IS NULL OR status = $1::smallint) AND
        nft.collection_id = $2 AND
        nft.minter_did_id = $3
    GROUP BY offer.id`;

    const results = await pool.query(query, [
      statusSearchParam,
      collectionId,
      did,
    ]);
    const offers = await Promise.all(results.rows.map(mapRowToOffer));
    res.send({
      offers: offers,
    });
  } catch (error: any) {
    logger.error(
      { error: error?.message, query: req.query },
      "Error getting offers"
    );
    res.status(500).send();
  }
};

const mapRowToOffer = async (row: any) => {
  return {
    id: base58.encode(row.hash),
    active: row.status ? true : false,
    summary_with_cat_info: {
      offered: await mapCatInfo(row.parsed_offer.offered),
      requested: await mapCatInfo(row.parsed_offer.requested),
    },
    nft_info: mapMinNftInfo(row.nft_info),
  };
};
