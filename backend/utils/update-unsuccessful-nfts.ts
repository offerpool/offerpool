import { logger } from "./logger.js"
import { getNftCoinInfo } from "./get-offer-summary.js";
import { pool } from "./query-db.js";
import { getTableName } from "./get-table-name.js";
import { getNftDTO } from "./get-nft-dto.js";
import { saveNFTInfos } from "./save-nft-infos.js";

let updating = false;
let requestToUpdate = 0;

export const updateUnsuccessfulNfts = async () => {
  if (updating) {
    requestToUpdate++;
    return;
  }
  updating = true;
  const start = new Date()
  logger.info("starting nft update")
  const nftLauncherIds = await pool.query(
    `select info_launchers.launcher_id launcher_id
    from (Select array_to_string(regexp_matches(parsed_offer ->> 'infos', '"launcher_id": "0x([0-9a-f]+)"', 'g'), ';') as "launcher_id", id
          from "${getTableName()}") as info_launchers
    left outer join "${getTableName()}_nft_info" nft on info_launchers.launcher_id = nft.launcher_id
        where info_launchers.launcher_id is not null and nft.launcher_id is null
    
    UNION DISTINCT
    
    SELECT launcher_id FROM "${getTableName()}_nft_info"
            WHERE
            (success <> true OR success is null)
    `
  );

  logger.info(`NFT fixup found ${nftLauncherIds.rows.length} NFTs`);
  // Do 10 nfts at once
  const batch_size = 10;
  const batches = nftLauncherIds.rows.length / batch_size;
  let currentPosition = 0;
  for (let batch = 0; batch < batches; batch++) {
    const promises: Promise<void>[] = [];
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

const updateNft = async (launcherId: string) => {
    const nfts = []
    let nftCoinInfo = undefined;
    try {
        const nftCoinInfo = await getNftCoinInfo(launcherId);
        nfts.push(getNftDTO(launcherId, nftCoinInfo));
        if(nftCoinInfo.success) {
            logger.info(`fixing up ${launcherId}`);
        }
        await saveNFTInfos(nfts)
    } catch (error: any) {
        logger.error({error: error?.message, nfts, nftCoinInfo}, "Error updating NFT")
    }
} 