const fs = require("fs");
const path = require("path");
const https = require("https");
const fetch = require("node-fetch").default;
const crypto = require("crypto");
const logger = require("pino")();

const options = {
  cert: fs.readFileSync(
    path.resolve(process.env.CHIA_SSL_DIR, "./private_wallet.crt"),
    `utf-8`
  ),
  key: fs.readFileSync(
    path.resolve(process.env.CHIA_SSL_DIR, "./private_wallet.key"),
    "utf-8"
  ),
  rejectUnauthorized: false,
};

const sslConfiguredAgent = new https.Agent(options);

const getOfferSummary = async (offer) => {
  const summary = await fetch(
    `${process.env.WALLET_RPC_HOST}/get_offer_summary`,
    {
      method: "post",
      body: JSON.stringify({ offer }),
      headers: { "Content-Type": "application/json" },
      agent: sslConfiguredAgent,
    }
  );
  return await summary.json();
};

const getOfferValidity = async (offer) => {
  const summary = await fetch(
    `${process.env.WALLET_RPC_HOST}/check_offer_validity`,
    {
      method: "post",
      body: JSON.stringify({ offer }),
      headers: { "Content-Type": "application/json" },
      agent: sslConfiguredAgent,
    }
  );
  return await summary.json();
};

const getNftCoinInfo = async (coin_id) => {
  const summary = await fetch(
    `${process.env.WALLET_RPC_HOST}/nft_get_info`,
    {
      method: "post",
      body: JSON.stringify({ coin_id }),
      headers: { "Content-Type": "application/json" },
      agent: sslConfiguredAgent,
    }
  );
  const result = await summary.json();

  if(!result.success) {
    return result;
  }

  const metadataResult = await getNFTMetadata(result.nft_info);
  result.success = metadataResult.success;
  if(!result.success) {
    return result;
  }
  result.collection_id = metadataResult.metadata?.collection?.id;

  const did_owner_response = await fetch( `${process.env.OFFER_HELPER_HOST}/get_minter_did_for_nft`, 
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coin_id }),
  });
  if(did_owner_response.status < 300) {
    did_data = await did_owner_response.json();
    result.minter_did_id = did_data.did_id;
  } else {
    respText = did_owner_response.text();
    logger.silent({response: respText, coin_id}, "error getting did owner")
    result.success = false;
  }
  if(!result.success) {
    return result;
  }

  return result;
};

const getNFTMetadata = async (nft_info) => {
  // If there is no metadata, consider it successful
  let success = true;
  for(let i = 0; i < nft_info?.metadata_uris?.length ?? 0; i++) {
    success = false;
    try {
      const response = await fetch(nft_info.metadata_uris[i]);
      const responseString = await response.text();
      const hash = "0x" + crypto.createHash('sha256').update(responseString).digest('hex');
      if(response.status < 300) {
        if(!nft_info.metadata_hash || hash == nft_info.metadata_hash) {
          return {
            success: true,
            metadata: JSON.parse(responseString),
          }
        }
      }
      logger.silent({expected_hash: nft_info?.metadata_hash, actual_hash: hash, response: responseString }, "error getting nft metadata");
    } catch (e) {
      logger.info({e}, "thrown error getting nft metadata");
      // Don't log any errors here
    }
  }
   return {
    success,
   }
}


module.exports.getOfferSummary = getOfferSummary;
module.exports.getOfferValidity = getOfferValidity;
module.exports.getNftCoinInfo = getNftCoinInfo;
