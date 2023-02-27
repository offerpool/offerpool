import { logger } from "../../../../../utils/logger.js";
import { base58 } from "../../../../../utils/base-58.js";

import { Prisma, PrismaClient } from "@prisma/client";
import { TGetOfferSummaryResponse } from "chia-agent/api/rpc/index.js";
const prisma = new PrismaClient();

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
    const where: Prisma.OfferWhereInput = {
      components: {
        some: {
          nft_component: {
            collection_id: collectionId,
            minter_did_id: did,
          },
        },
      },
    };

    if (statusSearchParam !== null) {
      where.status = statusSearchParam;
    }

    const results = await GetOffers(where);
    const offers: ResultType[] = results.map(mapToReturnType);
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

interface ReturnComponentInfo {
  component_type: "nft" | "cat";
  component_id: string;
  cat_code?: string;
  cat_name?: string;
  mojos_per_coin: number;
  amount: number;
  nft_info?: any;
}

interface ResultType {
  id: string;
  active: boolean;
  info: {
    offered: ReturnComponentInfo[];
    requested: ReturnComponentInfo[];
  };
}

async function GetOffers(where: Prisma.OfferWhereInput) {
  return await prisma.offer.findMany({
    where,
    include: {
      components: { include: { nft_component: true, cat_component: true } },
    },
  });
}

function mapToReturnType(
  value: Awaited<ReturnType<typeof GetOffers>>[0]
): ResultType {
  const summary = JSON.parse(value.info) as TGetOfferSummaryResponse["summary"];
  return {
    id: base58.encode(value.id),
    active: value.status === 1,
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
  component: Awaited<ReturnType<typeof GetOffers>>[0]["components"][0],
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
      nft_info: component.nft_component.info,
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
