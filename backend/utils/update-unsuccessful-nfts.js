const logger = require("pino")();
const { getNftCoinInfo } = require("./get-offer-summary");
const { pool } = require("./query-db");
const { getTableName } = require("./get-table-name");
const { getNftDTO } = require("./get-nft-dto");
const { saveNFTInfos } = require("./save-nft-infos");

let updating = false;
let requestToUpdate = 0;

const updateUnsuccessfulNfts = async () => {
  if (updating) {
    requestToUpdate++;
    return;
  }
  updating = true;
  const start = new Date()
  logger.info("starting nft update")
  const nftLauncherIds = await pool.query(
    `SELECT launcher_id FROM "${getTableName()}_nft_info"
        WHERE 
        (success <> true)`
  );

  logger.info(`NFT fixup found ${nftLauncherIds.rows.length} NFTs`);
  // Do 10 nfts at once
  const batch_size = 10;
  const batches = nftLauncherIds.rows.length / batch_size;
  let currentPosition = 0;
  for (let batch = 0; batch < batches; batch++) {
    promises = [];
    for (
      let i = 0;
      i < 10 && currentPosition < nftLauncherIds.rows.length;
      i++, currentPosition++
    ) {
      const launcherId = nftLauncherIds.rows[currentPosition].launcher_id;
      promises.push(updateNft(launcherId));
    }
    await Promise.all(promises);
  }

  logger.info(
    `Updating info for ${nftLauncherIds.rows.length} nfts took ${
      (new Date().getTime() - start.getTime()) / 1000
    } seconds.`
  );

  updating = false;
  if (requestToUpdate) {
    requestToUpdate = 0;
    updateUnsuccessfulNfts();
  }
};

const updateNft = async (launcherId) => {
    const nfts = []
    let nftCoinInfo = undefined;
    try {
        const nftCoinInfo = await getNftCoinInfo(launcherId);
        nfts.push(getNftDTO(launcherId, nftCoinInfo));
        await saveNFTInfos(nfts)
    } catch (error) {
        logger.error({error: error.message, nfts, nftCoinInfo}, "Error updating NFT")
    }
} 

module.exports.updateUnsuccessfulNfts = updateUnsuccessfulNfts;
