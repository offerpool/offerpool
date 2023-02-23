import { updateLocalDB } from "./update-local-db.js";
import { logger } from "./logger.js";

export const attachDbReplicateEvents = async (database: any) => {
  database.events.on("replicated", (address: any) => {
    logger.info("replication event fired");
    updateLocalDB(database, false);
  });
  database.events.on("write", () => {
    logger.info(`offer written`);
    updateLocalDB(database, false);
  });
  database.events.on(
    "replicate.progress",
    (address: any, hash: any, entry: any, progress: any, have: any) => {
      logger.debug({ progress }, "offer database replication in progress");
    }
  );
  await database.load();
};
