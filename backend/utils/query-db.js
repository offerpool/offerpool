const { Pool } = require("pg");

const pool = new Pool();

module.exports.pool = pool;
