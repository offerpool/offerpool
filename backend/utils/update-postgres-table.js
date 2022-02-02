const { addOfferEntryToPGDB } = require("./add-offer-to-pg");
const { doesOfferExistInPG } = require("./does-offer-exist-in-pg");
const logger = require("pino")();

let updateInProgress = false;
let requestsForAdditionalUpdates = 0;
const ENTRIES_PER_ITER = 100;

const updatePostgresTable = async (db, starting) => {
  if (updateInProgress) {
    requestsForAdditionalUpdates++;
    return;
  }
  updateInProgress = true;
  offeredAdded = 0;
  start = new Date().getTime();

  let dupesHit = 0;
  let offersWereFound = true;
  let lastSeenHash = undefined;
  while (
    dupesHit <= process.env.DATABASE_UPDATE_DUPE_LIMIT &&
    offersWereFound
  ) {
    let results = db
      .iterator({ limit: ENTRIES_PER_ITER, reverse: true, lt: lastSeenHash })
      .collect();
    const offerArray = results.map((entry) => {
      return entry.payload.value.offer_blob;
    });
    const offersThatAlreadyExist = await doesOfferExistInPG(offerArray);
    dupesHit += offersThatAlreadyExist.filter((x) => x).length || 0;
    for (i = 0; i < offerArray.length; i++) {
      if (!offersThatAlreadyExist[i]) {
        await addOfferEntryToPGDB(offerArray[i]);
        offeredAdded++;
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
      offers_added: offeredAdded,
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

module.exports.updatePostgresTable = updatePostgresTable;
