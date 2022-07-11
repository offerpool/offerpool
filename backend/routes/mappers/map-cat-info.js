const { getCatInfo } = require("../../utils/cat-info-provider");

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

  
module.exports.mapCatInfo = mapCatInfo;