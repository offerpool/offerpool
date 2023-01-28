import { addOfferEntryToPGDB } from "./add-offer-to-pg.js";
import { doesOfferExistInPG } from "./does-offer-exist-in-pg.js";
import { logger } from "./logger.js";

let updateInProgress = false;
let requestsForAdditionalUpdates = 0;
const ENTRIES_PER_ITER = 100;

export const updatePostgresTable = async (db: any, starting: any) => {
  if (updateInProgress) {
    requestsForAdditionalUpdates++;
    return;
  }
  updateInProgress = true;
  let offersAdded = 0;
  const start = new Date().getTime();

  let dupesHit = 0;
  let offersWereFound = true;
  let lastSeenHash = undefined;
  while (
    dupesHit <= parseInt(process.env.DATABASE_UPDATE_DUPE_LIMIT ?? "100") &&
    offersWereFound
  ) {
    let results: any[] = db
      .iterator({ limit: ENTRIES_PER_ITER, reverse: true, lt: lastSeenHash })
      .collect();
    const offerArray = results.map((entry) => {
      return entry.payload.value.offer_blob;
    });
    const offersThatAlreadyExist = await doesOfferExistInPG(offerArray);
    dupesHit += offersThatAlreadyExist.filter((x) => x).length || 0;
    for (let i = 0; i < offerArray.length; i++) {
      if (!offersThatAlreadyExist[i]) {
        await addOfferEntryToPGDB(offerArray[i]);
        offersAdded++;
      }
    }
    lastSeenHash = results?.pop()?.hash;
    if (results.length == 0) {
      offersWereFound = false;
    }
  }
  logger.info(
    {
      source: "update-postgres-table",
      time: (new Date().getTime() - start) / 1000,
      offers_added: offersAdded,
    },
    "Scanned OrbitDB for offers"
  );

  // If there was a request to update while we were updating, start all over again
  updateInProgress = false;
  if (requestsForAdditionalUpdates) {
    requestsForAdditionalUpdates = 0;
    updatePostgresTable(db, false);
  }
};
