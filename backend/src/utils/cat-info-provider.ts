import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

let lastUpdate: string | undefined = undefined;

interface CatInfo {
  id: string;
  cat_name: string;
  cat_code: string;
  mojos_per_coin: number;
}

export let cat_info: Record<string, CatInfo> = {};
let code_to_id: Record<string, string> = {};
const CAT_REFRESH_INTERVAL = 120;

export const getCatInfo = async (cat_id: string) => {
  const cacheInvalidTime = new Date(
    new Date().getTime() - CAT_REFRESH_INTERVAL * 1000
  ).toISOString();
  if (!lastUpdate || lastUpdate < cacheInvalidTime) {
    await updateCatInfo();
  }

  // Allow callers to use the code
  if (cat_id && cat_id.toUpperCase && code_to_id[cat_id.toUpperCase()]) {
    cat_id = code_to_id[cat_id.toUpperCase()];
  }

  return cat_info[cat_id] || unknownCatId(cat_id);
};

const unknownCatId = (cat_id: string) => {
  return {
    id: cat_id,
    cat_name: `Unknown ${cat_id.slice(0, 5)}...${cat_id.slice(
      cat_id.length - 5
    )}`,
    cat_code: `Unknown ${cat_id.slice(0, 5)}...${cat_id.slice(
      cat_id.length - 5
    )}`,
  };
};

const updateCatInfo = async () => {
  const results = await prisma.catInfo.findMany();
  for (let i = 0; i < results.length; i++) {
    const row = results[i];
    cat_info[row.id] = {
      id: row.id,
      cat_name: row.name,
      cat_code: row.code,
      mojos_per_coin: parseInt(row.mojos_per_coin || "1000"),
    };
    code_to_id[row.code] = row.id;
  }
  lastUpdate = new Date().toISOString();
};
