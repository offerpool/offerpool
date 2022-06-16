const { getTableName } = require("./get-table-name");
const { pool } = require("./query-db");
const { table_exists, create_table, create_nft_table } = require("./sql");

const buildPostgresTable = async () => {
  console.log("Checking postgres table");
  let result = await pool.query(table_exists, [
    process.env.PGSCHEMA,
    getTableName(),
  ]);
  if (!result.rows[0].exists) {
    // Create the table
    console.log("Creating postgres table...");
    result = await pool.query(create_table(getTableName()));
  }

  let nft_resut = await pool.query(table_exists, [
    process.env.PGSCHEMA,
    `${getTableName()}_nft_info`,
  ]);
  if (!nft_resut.rows[0].exists) {
    // Create the nft table
    console.log("Creating nft_info table...");
    result = await pool.query(create_nft_table(getTableName()));
  }
  
};

module.exports.buildPostgresTable = buildPostgresTable;
