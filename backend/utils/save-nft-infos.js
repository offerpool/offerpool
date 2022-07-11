const { pool } = require("./query-db");
const { getTableName } = require("./get-table-name");


async function saveNFTInfos(nftInfos) {
    for(let nftInfo of nftInfos) {
        const result = await pool.query(
            `INSERT into "${getTableName()}_nft_info" as nft (launcher_id, nft_info, success, minter_did_id, collection_id) 
            VALUES ($1, $2, $3, $4, $5) 
            ON CONFLICT (launcher_id) DO UPDATE SET
              nft_info = CASE WHEN excluded.success THEN excluded.nft_info ELSE nft.nft_info, 
              success = CASE WHEN excluded.success THEN excluded.success ELSE nft.success, 
              minter_did_id = CASE WHEN excluded.success THEN  excluded.minter_did_id ELSE nft.minter_did_id,
              collection_id = CASE WHEN excluded.success THEN excluded.collection_id ELSE nft.collection_id;`,
            [
              nftInfo.coin_id,
              JSON.stringify(nftInfo.nft_info),
              nftInfo.success,
              nftInfo.minter_did_id,
              nftInfo.collection_id,
            ]
          );
    }
    return;
}

module.exports.saveNFTInfos = saveNFTInfos;