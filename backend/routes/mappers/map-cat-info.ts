import { getCatInfo } from "../../utils/cat-info-provider.js";

export const mapCatInfo = async (obj: any) => {
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
