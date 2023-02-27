import { getCatInfo } from "../../../utils/cat-info-provider.js";
import { logger } from "../../../utils/logger.js";
import { base58 } from "../../../utils/base-58.js";
import {
  CatInfo,
  nftInfo,
  Offer,
  OfferComponent,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { TGetOfferSummaryResponse } from "chia-agent/api/rpc/index.js";
import { NFTInfo } from "chia-agent/api/chia/wallet/nft_wallet/nft_info.js";
import { ResultType } from "./types.js";
const prisma = new PrismaClient();

export const getOffersRoute = async (req: any, res: any) => {
  try {
    const pageSize = Math.min(req.query["page_size"] || 100, 100);
    const page = req.query["page"] || 1;
    const offered = req.query["offered"] || undefined;
    const requested = req.query["requested"] || undefined;
    const valid = req.query["valid"];

    let where: Prisma.OfferWhereInput = {};

    if (offered && !requested) {
      // see if they sent a cat code instead of a id
      const cat_info = await getCatInfo(offered);
      where = {
        ...where,
        components: { some: { component_id: cat_info.id, requested: false } },
      };
    }
    if (requested && !offered) {
      const cat_info = await getCatInfo(requested);
      where = {
        ...where,
        components: { some: { component_id: cat_info.id, requested: false } },
      };
    }
    if (requested && offered) {
      const requested_cat_info = await getCatInfo(requested);
      const offered_cat_info = await getCatInfo(offered);
      where = {
        ...where,
        AND: [
          {
            components: {
              some: { component_id: offered_cat_info.id, requested: false },
            },
          },
          {
            components: {
              some: { component_id: requested_cat_info.id, requested: true },
            },
          },
        ],
      };
    }

    let statusSearchParam = null;
    // default to only show valid offers
    if (valid == "all") {
      statusSearchParam = null;
    } else if (valid !== undefined) {
      statusSearchParam = valid ? 1 : 0;
    } else {
      statusSearchParam = 1;
    }

    if (statusSearchParam) {
      where = { ...where, status: statusSearchParam };
    }

    const offersPromise = prisma.offer.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: { found_at: "desc" },
      include: {
        components: { include: { nft_component: true, cat_component: true } },
      },
    });

    const countPromise = prisma.offer.count({ where });
    const [offers, count] = await Promise.all([offersPromise, countPromise]);

    res.json({
      count: count,
      page,
      page_size: pageSize,
      offers: offers.map(mapToReturnType),
    });
  } catch (error) {
    logger.error({ error, query: req.query }, "Error getting offers");
    res.status(500).send();
  }
};

type OffersQueryReturnType = (Offer & {
  components: (OfferComponent & {
    cat_component: CatInfo | null;
    nft_component: nftInfo | null;
  })[];
})[];

function mapToReturnType(value: OffersQueryReturnType[0]): ResultType {
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
  component: OffersQueryReturnType[0]["components"][0],
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
