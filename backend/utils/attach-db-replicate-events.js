
const { updatePostgresTable } = require("./update-postgres-table");
const logger = require("pino")();

const attachDbReplicateEvents = async (database) => {
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

module.exports.attachDbReplicateEvents = attachDbReplicateEvents