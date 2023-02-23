/**
 * This script pulls cat info from the spacescan api and updates the cat_info table in the database
 * It is intended to be run once to populate the table, and then as needed to refresh the data, but no more than once per week
 */

import { CatInfo, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// pull cat info from space scan api
let page = 1;
const baseUrl = `https://api2.spacescan.io/v0.1/xch/cats`;
console.log(`getting page ${page} of cat info`);
const initialFetch = await fetch(baseUrl);
const initialData = await initialFetch.json() as APIResponse;

const isCat = (item: CatInfo | undefined): item is CatInfo => {
    return !!item
  }


if (initialData.status.toUpperCase() === "SUCCESS") {
  const catInfo: CatInfo[] = [{id: "xch", name: "Chia", code: "XCH", mojos_per_coin: "1000000000000"}];
  const cats = initialData.cats.map((cat) => mapCatToCatInfo(cat)).filter(isCat);
  
  catInfo.push(...cats)
  for(page = 2; page <=  (initialData.summary.total_cats / initialData.summary.page_count) + 1; page++) {
    console.log("sleeping for 10 seconds");
    await new Promise(r => setTimeout(r, 10000));
    console.log(`getting page ${page} of cat info`);
    const fetchResult = await fetch(`${baseUrl}?page=${initialData.summary.page_num + 1}`);
    const data = await fetchResult.json() as APIResponse;
    if (data.status.toUpperCase() === "SUCCESS") {
      const cats = data.cats.map((cat) => mapCatToCatInfo(cat)).filter(isCat);
      catInfo.push(...cats);
    } else {
        throw new Error("Error fetching cat info from spacescan");
    }
  }
  console.log(`Updating ${catInfo.length} cats in database`);
  for(const cat of catInfo) {
    await prisma.catInfo.upsert({
      where: {
        id: cat.id,
      },
      create: cat,
      update: cat,
    });
  }
}

console.log("Done")

function mapCatToCatInfo(cat: Cat): CatInfo | undefined {
    if(!cat.asset_id || !cat.symbol || !cat.asset_name) {
        return undefined;
    }
    return {
        id: cat.asset_id,
        name: cat.asset_name,
        code: cat.symbol,
        mojos_per_coin: "1000",
    }
}

interface APIResponse {
  status: string;
  cats: Cat[];
  summary: Summary;
}

interface Cat {
  asset_id: string;
  asset_name?: string;
  symbol?: string;
  cat_type: string;
  price_usd: string;
  price_xch: string;
  issued_time?: string;
  updated: string;
  holders: string;
  twitter: any;
  discord: any;
  website: any;
  whitepaper: any;
  reddit: any;
  lisp: any;
  clvm: any;
  cat_description: any;
  tags?: string;
  details: any;
  description?: string;
  total_supply?: number;
  txns_count?: string;
  txns_amount?: string;
  logo: string;
}

interface Summary {
  total_cats: number;
  page_num: number;
  page_count: number;
}



