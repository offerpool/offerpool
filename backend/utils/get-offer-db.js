import { create } from "ipfs-http-client";
import orbitdb from "orbit-db";
import { getTableName } from "./get-table-name.js";
import { logger } from "./logger.js";

export const getOfferDB = async (orbitDirectoryPrefix) => {
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
  const dbAddress = await orbitClient.determineAddress(getTableName(), "eventlog", {
    accessController: {
      write: ["*"],
    },
  });
  logger.info({ dbAddress }, "orbit db table address set");
  let database = await orbitClient.log(dbAddress);
  return database;
};
