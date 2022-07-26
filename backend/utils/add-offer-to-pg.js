const { getNftDTO } = require("./get-nft-dto");
const { getOfferSummary, getOfferValidity, getNftCoinInfo } = require("./get-offer-summary");
const { getTableName } = require("./get-table-name");
const { pool } = require("./query-db");
const logger = require("pino")();
const { saveNFTInfos } = require("./save-nft-infos");

/** Adds an offer to the postgres table, returns false if the offer could not be added */
const addOfferEntryToPGDB = async (offer) => {
  try {
    const offerSummary = await getOfferSummary(offer);
    // If the chia client can't parse the offer, or it's an xch for xch offer (CAT1 to CAT1/XCH), ignore it
    if (!offerSummary || !offerSummary.success || (offerInfo.summary.requested['xch'] && offerInfo.summary.offered['xch'])) {
      return true;
    }
    const offered_cats = [];
    for (let cat in offerSummary.summary.offered) {
      offered_cats.push(cat);
    }
    const requested_cats = [];
    for (let cat in offerSummary.summary.requested) {
      requested_cats.push(cat);
    }

    // If the offer has any nft's, make sure entries for those NFTs exist in the nft_info table
    const nfts = [];
    const infos = offerSummary && offerSummary.summary && offerSummary.summary.infos
    if(infos) {
      for(let nftCoinId in infos) {
        if(infos[nftCoinId] && infos[nftCoinId].launcher_id) {
          const nftCoinInfo = await getNftCoinInfo(infos[nftCoinId].launcher_id);
          nfts.push(getNftDTO(nftCoinId, nftCoinInfo));
        }
      }
    }
    try {
      await saveNFTInfos(nfts);
    } catch (e) {
      logger.error(e);
      logger.info("continuing to add offer through NFT addition error")
    }

    const offerStatus = await getOfferValidity(offer);
    if (!offerStatus || !offerStatus.success) {
      return true;
    }

    let status = 0;
    if (offerStatus.valid) {
      status = 1;
    }
    await commitToPostgres(offer, status, offered_cats, requested_cats, offerSummary);

    logger.info({ offer }, "added offer successfully");
  } catch (err) {
    logger.error({ offer, err }, "error adding offer");
    return false;
  }
  return true;
};

module.exports.addOfferEntryToPGDB = addOfferEntryToPGDB;


async function commitToPostgres(offer, status, offered_cats, requested_cats, offerSummary) {
  // TODO: Make a single transaction
  const result = await pool.query(
    `INSERT into "${getTableName()}"(hash, offer, status, offered_cats, requested_cats, parsed_offer) VALUES (sha256($1), $2, $3, $4, $5, $6) RETURNING id;`,
    [
      offer,
      offer,
      status,
      offered_cats,
      requested_cats,
      JSON.stringify(offerSummary.summary),
    ]
  );
  const offerId = result?.rows?.[0]?.id;
  if (offerId) {
    for (var cat of offered_cats) {
      await pool.query(
        `INSERT into "${getTableName()}_offered_cat"(offer_id, cat_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
        [
          offerId,
          cat,
        ]);
    }
    for (var cat of requested_cats) {
      await pool.query(
        `INSERT into "${getTableName()}_requested_cat"(offer_id, cat_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
        [
          offerId,
          cat,
        ]);
    }
  }
}
