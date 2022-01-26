const { getCatInfo } = require("../../../utils/cat-info-provider");
const { getTableName } = require("../../../utils/get-table-name");
const { pool } = require("../../../utils/query-db");

const getOffersRoute = async (req, res) => {
  const pageSize = Math.min(req.query["page_size"] || 100, 100);
  const page = req.query["page"] || 1;
  const offered = req.query["offered"] || undefined;
  const requested = req.query["requested"] || undefined;
  const valid = req.query["valid"];

  let offeredSearchParam = null;
  if (offered) {
    // see if they sent a cat code instead of a id
    const cat_info = await getCatInfo(offered);
    offeredSearchParam = cat_info.id;
  }

  let requestedSearchParam = null;
  if (requested) {
    // see if they sent a cat code instead of a id
    const cat_info = await getCatInfo(requested);
    requestedSearchParam = cat_info.id;
  }

  let statusSearchParam = null;
  // default to only show valid offers
  if (valid == "all") {
    statusSearchParam = null;
  } else if (valid !== undefined) {
    statusSearchParam = valid ? 1 : 0;
  } else {
    statusSearchParam = 1;
  }

  const results = await pool.query(
    `SELECT *
    FROM "${getTableName()}"
    WHERE 
    ($3::smallint IS NULL OR status = $3::smallint) AND
    ($4::text IS NULL OR $4::text = ANY (offered_cats)) AND 
    ($5::text IS NULL OR $5::text = ANY (requested_cats))
    ORDER BY id DESC
    LIMIT $2 OFFSET ($1 - 1) * $2
    `,
    [
      page,
      pageSize,
      statusSearchParam,
      offeredSearchParam,
      requestedSearchParam,
    ]
  );
  const count = await pool.query(
    `SELECT COUNT(1) as count FROM "${getTableName()}"
    WHERE 
    ($1::smallint IS NULL OR status = $1::smallint) AND
    ($2::text IS NULL OR $2::text = ANY (offered_cats)) AND 
    ($3::text IS NULL OR $3::text = ANY (requested_cats))`,
    [statusSearchParam, offeredSearchParam, requestedSearchParam]
  );
  const offers = await Promise.all(results.rows.map(mapRowToOffer));
  res.json({
    count: parseInt(count.rows[0].count),
    page,
    page_size: pageSize,
    offers: offers,
  });
};

const mapRowToOffer = async (row) => {
  return {
    offer: row.offer,
    summary: row.parsed_offer,
    active: row.status ? true : false,
    summary_with_cat_info: {
      offered: await mapCatInfo(row.parsed_offer.offered),
      requested: await mapCatInfo(row.parsed_offer.requested),
    },
  };
};

const mapCatInfo = async (obj) => {
  const ret = [];

  for (let cat in obj) {
    const cat_info = await getCatInfo(cat);
    ret.push({
      cat_id: cat_info.id,
      cat_code: cat_info.cat_code,
      cat_name: cat_info.cat_name,
      mojos_per_coin: parseInt(cat_info.mojos_per_coin),
      amount: obj[cat],
    });
  }
  return ret;
};

module.exports.getOffersRoute = getOffersRoute;
