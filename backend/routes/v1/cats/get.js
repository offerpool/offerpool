const { cat_info, getCatInfo } = require("../../../utils/cat-info-provider");

const getCatsRoute = async (req, res) => {
  // Hack to update the cats information
  await getCatInfo("xch");
  res.json(cat_info);
};

module.exports.getCatsRoute = getCatsRoute;
