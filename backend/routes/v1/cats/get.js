const { cat_info, getCatInfo } = require("../../../utils/cat-info-provider");
const logger = require("pino")();

const getCatsRoute = async (req, res) => {
  try {
    // Hack to update the cats information
    await getCatInfo("xch");
    res.json(cat_info);
  } catch (error) {
    logger.error({error}, "Get Cat Error");
    res.status(500).send();
  }
};

module.exports.getCatsRoute = getCatsRoute;
