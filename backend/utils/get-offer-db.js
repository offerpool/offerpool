const { create } = require("ipfs-http-client");
const orbitdb = require("orbit-db");
const { getTableName } = require("./get-table-name");
const logger = require("pino")();

const getOfferDB = async (orbitDirectoryPrefix) => {
  const ipfs = await create(process.env.IPFS_HOST);
  if (process.env.MASTER_MULTIADDR) {
    logger.info(`Connecting to Master Node: ${process.env.MASTER_MULTIADDR}`);
    await ipfs.swarm.connect(process.env.MASTER_MULTIADDR);
  }
  let directory = `./orbitdb/${getTableName()}`
  if (orbitDirectoryPrefix) {
    directory = `./orbitdb/${orbitDirectoryPrefix}-${getTableName()}`
  }
  const orbitClient = await orbitdb.createInstance(ipfs, {
    directory,
  });
  dbAddress = await orbitClient.determineAddress(getTableName(), "eventlog", {
    accessController: {
      write: ["*"],
    },
  });
  logger.info({ dbAddress }, "orbit db table address set");
  let database = await orbitClient.log(dbAddress);
  return database;
};

module.exports.getOfferDB = getOfferDB;
