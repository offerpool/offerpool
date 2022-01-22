const { create } = require('ipfs-http-client')
const orbitdb = require("orbit-db");
const { getTableName } = require("./get-table-name");
const { updatePostgresTable } = require("./update-postgres-table");

const getOfferDB = async () => {
  const ipfs = await create(process.env.IPFS_HOST);
  if (process.env.MASTER_MULTIADDR) {
    console.log("Connecting to Master Node: ", process.env.MASTER_MULTIADDR);
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
  console.log(dbAddress);
  let database = await orbitClient.log(dbAddress);
  await database.load();

  database.events.on("replicated", (address) => {
    console.log(`replication event fired`);
    updatePostgresTable(database, false);
  });
  database.events.on("write", () => {
    console.log(`offer written`);
    updatePostgresTable(database, false);
  });
  return database;
};

module.exports.getOfferDB = getOfferDB;
