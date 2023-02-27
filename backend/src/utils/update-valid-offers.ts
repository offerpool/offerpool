import { getOfferValidity } from "./get-offer-summary.js";
import { logger } from "./logger.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

let updating = false;
let requestToUpdate = 0;

export const updateValidOffers = async () => {
  if (updating) {
    requestToUpdate++;
    return;
  }
  updating = true;
  const start = new Date();
  logger.info("Starting Offer Update");
  // TODO: page through offers to limit memory usage
  const offers = await prisma.offer.findMany({
    where: {
      status: 1,
    },
    select: {
      id: true,
      offer: true,
    },
  });

  logger.info(`Offer Update Found ${offers.length} Offers`);
  // Do 10 offers at once
  const batch_size = 10;
  const batches = offers.length / batch_size;
  let currentPosition = 0;
  for (let batch = 0; batch < batches; batch++) {
    logger.info(`Updating offer batch ${batch} of ${batches}`);
    let offerPromises = [];
    for (
      let i = 0;
      i < batch_size && currentPosition < offers.length;
      i++, currentPosition++
    ) {
      const offer = offers[currentPosition].offer;
      const id = offers[currentPosition].id;
      offerPromises.push(updateOffer(offer, id));
    }
    await Promise.all(offerPromises);
  }

  logger.info(
    `Updating statuses for ${offers.length} offers took ${
      (new Date().getTime() - start.getTime()) / 1000
    } seconds.`
  );
  updating = false;
  if (requestToUpdate) {
    requestToUpdate = 0;
    updateValidOffers();
  }
};

const updateOffer = async (offer: string, id: Buffer) => {
  const offerStatus = await getOfferValidity(offer);
  if ("error" in offerStatus) {
    return;
  }
  if (!offerStatus) {
    logger.info(`Updating status of offer ${id}`);
    await prisma.offer.update({
      where: {
        id,
      },
      data: {
        status: 0,
      },
    });
  }
};
