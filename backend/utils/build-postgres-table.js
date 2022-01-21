const { getTableName } = require("./get-table-name");
const { pool } = require("./query-db");
const { table_exists, create_table } = require("./sql");

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
  // Check for additional indexes here
};

module.exports.buildPostgresTable = buildPostgresTable;
