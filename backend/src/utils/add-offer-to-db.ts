import { getNftDTO } from "./get-nft-dto.js";
import { createHash } from "node:crypto";
import {
  getNftCoinInfo,
  getOfferSummary,
  getOfferValidity,
} from "./get-offer-summary.js";
import { logger } from "./logger.js";
import { saveNFTInfos } from "./save-nft-infos.js";

import { PrismaClient } from "@prisma/client";
import { TGetOfferSummaryResponse } from "chia-agent/api/rpc/index.js";

const prisma = new PrismaClient();

/** Adds an offer to the postgres table, returns false if the offer could not be added */
export const addOfferEntryToDB = async (offer: string) => {
  try {
    const offerSummary = await getOfferSummary(offer);
    // If the chia client can't parse the offer, or it's an xch for xch offer (CAT1 to CAT1/XCH), ignore it
    if ("error" in offerSummary) {
      return true;
    }
    if (
      (offerSummary.summary.requested["xch"] &&
        offerSummary.summary.offered["xch"])
    ) {
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
    const infos = offerSummary && offerSummary.summary &&
      offerSummary.summary.infos;
    if (infos) {
      for (let nftCoinId in infos) {
        if (infos[nftCoinId] && infos[nftCoinId].launcher_id) {
          const nftCoinInfo = await getNftCoinInfo(
            infos[nftCoinId].launcher_id,
          );
          nfts.push(getNftDTO(nftCoinId, nftCoinInfo));
        }
      }
    }
    try {
      await saveNFTInfos(nfts);
    } catch (e) {
      logger.error(e);
      logger.info("continuing to add offer through NFT addition error");
    }

    const offerStatus = await getOfferValidity(offer);
    if ("error" in offerStatus) {
      return true;
    }

    let status = 0;
    if (offerStatus.valid) {
      status = 1;
    }

    await commitToDatabase(
      offer,
      status,
      offered_cats,
      requested_cats,
      offerSummary,
    );

    logger.info({ offer }, "added offer successfully");
  } catch (err) {
    logger.error({ offer, err }, "error adding offer");
    return false;
  }
  return true;
};

async function commitToDatabase(
  offer: string,
  status: number,
  offered_component_ids: string[],
  requested_component_ids: string[],
  offerSummary: TGetOfferSummaryResponse,
) {
  const result = await prisma.offer.create({
    data: {
      id: createHash("sha256").update(offer).digest(),
      offer: offer,
      status: status,
      info: JSON.stringify(offerSummary.summary),
      info_version: 1,
      components: {
        create: [
          ...offered_component_ids.map((cat) => ({
            requested: false,
            component_id: cat,
          })),
          ...requested_component_ids.map((cat) => ({
            requested: true,
            component_id: cat,
          })),
        ],
      },
    },
  });
}
