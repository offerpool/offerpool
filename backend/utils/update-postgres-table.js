const { addOfferEntryToPGDB } = require("./add-offer-to-pg");
const { doesOfferExistInPG } = require("./does-offer-exist-in-pg");

let updateInProgress = false;
let requestsForAdditionalUpdates = 0;
const ENTRIES_PER_ITER = 25;

const updatePostgresTable = async (db, starting) => {
  if (updateInProgress) {
    requestsForAdditionalUpdates++;
    return;
  }
  updateInProgress = true;

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
      }
    }
    lastSeenHash = results?.pop()?.hash;
    if (results.length == 0) {
      offersWereFound = false;
    }
  }

  // If there was a request to update while we were updating, start all over again
  updateInProgress = false;
  if (requestsForAdditionalUpdates) {
    requestsForAdditionalUpdates = 0;
    updatePostgresTable(db, false);
  }
};

module.exports.updatePostgresTable = updatePostgresTable;
