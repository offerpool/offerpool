import { cat_info, getCatInfo } from "../../../utils/cat-info-provider.js";
import { logger } from "../../../utils/logger.js";

export const getCatsRoute = async (req: any, res: any) => {
  try {
    // Hack to update the cats information
    await getCatInfo("xch");
    res.json(cat_info);
  } catch (error) {
    logger.error({error}, "Get Cat Error");
    res.status(500).send();
  }
};

