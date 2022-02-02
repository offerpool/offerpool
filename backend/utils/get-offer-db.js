const { create } = require("ipfs-http-client");
const orbitdb = require("orbit-db");
const { getTableName } = require("./get-table-name");
const { updatePostgresTable } = require("./update-postgres-table");
const logger = require("pino")();

const getOfferDB = async () => {
  const ipfs = await create(process.env.IPFS_HOST);
  if (process.env.MASTER_MULTIADDR) {
    logger.info(`Connecting to Master Node: ${process.env.MASTER_MULTIADDR}`);
    await ipfs.swarm.connect(process.env.MASTER_MULTIADDR);
  }

  const orbitClient = await orbitdb.createInstance(ipfs, {
    directory: `./orbitdb/${getTableName()}`,
  });
  dbAddress = await orbitClient.determineAddress(getTableName(), "eventlog", {
    accessController: {
      write: ["*"],
    },
  });
  logger.info({ dbAddress }, "orbit db table address set");
  let database = await orbitClient.log(dbAddress);
  await database.load();

  database.events.on("replicated", (address) => {
    logger.info(`replication event fired`);
    updatePostgresTable(database, false);
  });
  database.events.on("write", () => {
    logger.info(`offer written`);
    updatePostgresTable(database, false);
  });
  return database;
};

module.exports.getOfferDB = getOfferDB;
