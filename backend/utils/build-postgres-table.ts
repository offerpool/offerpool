import { getTableName } from "./get-table-name.js";
import { pool } from "./query-db.js";
import { table_exists, create_table, create_nft_table } from "./sql.js";

export const buildPostgresTable = async () => {
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
