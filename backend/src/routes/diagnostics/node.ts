import { RPCAgent } from "chia-agent";
import { get_blockchain_state } from "chia-agent/api/rpc/index.js";

export const nodeRoute = async (req: any, res: any) => {
  try {
    const state = await get_blockchain_state(
      new RPCAgent({ service: "full_node" })
    );
    if ("error" in state) {
      throw new Error();
    }
    res.json({
      ...state?.blockchain_state?.sync,
      height: state?.blockchain_state?.peak?.height,
    });
  } catch (err) {
    console.error(err);
    res.json({});
  }
};
