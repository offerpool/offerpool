const IPFS = require("ipfs");
const orbitdb = require("orbit-db");
const { getTableName } = require("./get-table-name");
const { updatePostgresTable } = require("./update-postgres-table");

const getOfferDB = async () => {
  const node = await IPFS.create({
    repo: `./orbitdb/${getTableName()}`,
    start: true,
    EXPERIMENTAL: {
      pubsub: true,
    },
    relay: { enabled: true, hop: { enabled: true, active: true } },
  });
  if (process.env.MASTER_MULTIADDR) {
    console.log("Connecting to Master Node: ", process.env.MASTER_MULTIADDR);
    await node.swarm.connect(process.env.MASTER_MULTIADDR);
  }
  const orbitClient = await orbitdb.createInstance(node, {
    directory: `./orbitdb/${getTableName()}`,
  });
  dbAddress = await orbitClient.determineAddress(getTableName(), "eventlog", {
    accessController: {
      write: ["*"],
    },
  });
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
