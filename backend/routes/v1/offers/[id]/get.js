const { base58 } = require("../../../../utils/base-58");
const { getTableName } = require("../../../../utils/get-table-name");
const { pool } = require("../../../../utils/query-db");
const { mapCatInfo } = require("../../../mappers/map-cat-info");
const { mapNftInfo } = require("../../../mappers/map-nft-info");
const logger = require("pino")();

const getOfferByHash = async (req, res) => {
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
    } catch (error) {
        logger.error({error: error.message, query: req.query}, "Error getting offers")
        res.status(500).send();
    }
}

const mapRowToOffer = async (row) => {
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

  module.exports.getOfferByHash = getOfferByHash;