
import { updatePostgresTable } from "./update-postgres-table.js";
import { logger } from "./logger.js";

export const attachDbReplicateEvents = async (database) => {
    database.events.on("replicated", (address) => {
      logger.info("replication event fired");
      updatePostgresTable(database, false);
    });
    database.events.on("write", () => {
      logger.info(`offer written`);
      updatePostgresTable(database, false);
    });
    database.events.on(
      "replicate.progress",
      (address, hash, entry, progress, have) => {
        logger.debug({ progress }, "offer database replication in progress");
      }
    );
    await database.load();
}