import { logger } from "./logger.js";
import { getNftCoinInfo } from "./get-offer-summary.js";
import { getNftDTO } from "./get-nft-dto.js";
import { saveNFTInfos } from "./save-nft-infos.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

let updating = false;
let requestToUpdate = 0;

export const updateUnsuccessfulNfts = async () => {
  if (updating) {
    requestToUpdate++;
    return;
  }
  updating = true;
  const start = new Date();
  logger.info("starting nft update");
  const nftIds = await prisma.nftInfo.findMany({
    where: { info_version: 0 },
    select: { launcher_id: true },
  });
  logger.info(`NFT fixup found ${nftIds.length} NFTs`);
  // Do 10 nfts at once
  const batch_size = 10;
  const batches = nftIds.length / batch_size;
  let currentPosition = 0;
  for (let batch = 0; batch < batches; batch++) {
    const promises: Promise<void>[] = [];
    for (
      let i = 0;
      i < 10 && currentPosition < nftIds.length;
      i++, currentPosition++
    ) {
      const launcherId = nftIds[currentPosition].launcher_id;
      promises.push(updateNft(launcherId));
    }
    await Promise.all(promises);
  }

  logger.info(
    `Updating info for ${nftIds.length} nfts took ${
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
  const nfts = [];
  let nftCoinInfo = undefined;
  try {
    const nftCoinInfo = await getNftCoinInfo(launcherId);
    nfts.push(getNftDTO(launcherId, nftCoinInfo));
    if (nftCoinInfo.success) {
      logger.info(`fixing up ${launcherId}`);
    }
    await saveNFTInfos(nfts);
  } catch (error: any) {
    logger.error(
      { error: error?.message, nfts, nftCoinInfo },
      "Error updating NFT"
    );
  }
};
