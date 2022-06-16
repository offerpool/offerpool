const { pool } = require("./query-db");
const { getTableName } = require("./get-table-name");


async function saveNFTInfos(nftInfos) {
    for(let nftInfo of nftInfos) {
        // TODO: A conflict could be an oppertunity to update the NFT info, but consider that later
        const result = await pool.query(
            `INSERT into "${getTableName()}_nft_info" (launcher_id, nft_id, coin_info) VALUES ($1, $2, $3) ON CONFLICT (launcher_id) DO NOTHING`,
            [
              nftInfo.coin_id,
              nftInfo.nft_id,
              JSON.stringify(nftInfo.nft_info)
            ]
          );
    }
    return;
}

module.exports.saveNFTInfos = saveNFTInfos;