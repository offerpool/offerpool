import fs from "fs";
import path from "path";
import https from "https";
import * as fetchModule from "node-fetch";
const fetch = fetchModule.default.default;

const options = {
    cert: fs.readFileSync(
      path.resolve(process.env.CHIA_SSL_DIR ?? "", "../full_node/private_full_node.crt"),
      `utf-8`
    ),
    key: fs.readFileSync(
      path.resolve(process.env.CHIA_SSL_DIR ?? "", "../full_node/private_full_node.key"),
      "utf-8"
    ),
    rejectUnauthorized: false,
  };
  
  const sslConfiguredAgent = new https.Agent(options);
  

export const nodeRoute = async (req: any, res: any) => {
    try
    {
        const state = await fetch(`${process.env.FULL_NODE_RPC_HOST}/get_blockchain_state`, {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ }),
            method: "post",
            agent: sslConfiguredAgent});
          const data = await state.json();
          res.json({... data?.blockchain_state?.sync, height: data?.blockchain_state?.peak?.height});
    } catch(err) {
        console.error(err);
        res.json({});
    }
};
