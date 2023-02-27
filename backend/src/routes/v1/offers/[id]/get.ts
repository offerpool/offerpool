import { base58 } from "../../../../utils/base-58.js";
import { logger } from "../../../../utils/logger.js";

import { PrismaClient } from "@prisma/client";
import { TGetOfferSummaryResponse } from "chia-agent/api/rpc/index.js";
import { NFTInfo } from "chia-agent/api/chia/wallet/nft_wallet/nft_info.js";
import { ResultType } from "./types.js";
const prisma = new PrismaClient();

export const getOfferByHash = async (req: any, res: any) => {
  try {
    const encodedHash = req.params.id;
    const idBuffer = Buffer.from(base58.decode(encodedHash));
    const result = await getOffer(idBuffer);
    if (result === null) {
      res.status(404);
      res.send();
    } else {
      res.json(mapToReturnType(result));
    }
  } catch (error: any) {
    logger.error(
      { error: error?.message, query: req.query },
      "Error getting offers"
    );
    res.status(500).send();
  }
};

function getOffer(idBuffer: Buffer) {
  return prisma.offer.findUnique({
    where: {
      id: idBuffer,
    },
    include: {
      components: {
        include: { nft_component: true, cat_component: true },
      },
    },
  });
}

function mapToReturnType(
  value: NonNullable<Awaited<ReturnType<typeof getOffer>>>
): ResultType {
  const summary = JSON.parse(value.info) as TGetOfferSummaryResponse["summary"];
  return {
    id: base58.encode(value.id),
    active: value.status === 1,
    offer: value.offer,
    info: {
      offered: value.components
        .filter((c) => c.requested === false)
        .map((c) => mapComponent(c, summary, false)),
      requested: value.components
        .filter((c) => c.requested === true)
        .map((c) => mapComponent(c, summary, true)),
    },
  };
}

function mapComponent(
  component: NonNullable<Awaited<ReturnType<typeof getOffer>>>["components"][0],
  summary: TGetOfferSummaryResponse["summary"],
  requested: boolean
) {
  if (component.nft_component) {
    return {
      component_type: "nft",
      component_id: component.component_id,
      mojos_per_coin: 1,
      amount: requested
        ? summary.requested[component.component_id]
        : summary.offered[component.component_id],
      nft_info: component.nft_component.info
        ? (JSON.parse(component.nft_component.info) as NFTInfo)
        : undefined,
    } as const;
  } else {
    return {
      component_type: "cat",
      component_id: component.component_id,
      cat_code: component.cat_component?.code,
      cat_name: component.cat_component?.name,
      mojos_per_coin: parseInt(
        component.cat_component?.mojos_per_coin || "1000"
      ),
      amount: requested
        ? summary.requested[component.component_id]
        : summary.offered[component.component_id],
    } as const;
  }
}
