import { useState } from "react";
import axios from "axios";
import { CatInfo } from "./CatInfo";
import type { ResultType } from "../../../backend/src/routes/v1/offers/types.js"

export function useLoadOffers(
  fromCat: CatInfo | undefined,
  toCat: CatInfo | undefined
) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<(ResultType & {price?: number})[]>([]);
  const [hasNextPage, setHasNextPage] = useState(!fromCat || !toCat);
  const [error, setError] = useState();
  const [page, setPage] = useState(1);

  async function loadItems(currentPage: number) {
    if (!fromCat || !toCat) {
      return {
        hasNextPage: false,
        data: [],
      };
    }
    let moreToLoad = true;
    const tempOffers = [];
    let pageSize = 100;
    let loop = true;
    if (fromCat.id === "any" || toCat.id === "any") {
      pageSize = 25;
    }

    while (loop && moreToLoad) {
      const params: any = {
        page: currentPage,
        page_size: pageSize,
      };
      if (fromCat.id !== "any") {
        params.offered = fromCat.id;
      }
      if (toCat.id !== "any") {
        params.requested = toCat.id;
      }
      const result = await axios.get(`/api/v1/offers`, {
        params,
      });
      for (let i = 0; i < result.data.offers.length; i++) {
        const offer: ResultType & {price?: number} = result.data.offers[i];
        if (fromCat.id !== "any" && toCat.id !== "any") {
          offer.price =
            (offer.info.offered.find(c => c.component_id === fromCat.id)?.amount ?? 0) /
            fromCat.mojos_per_coin /
            ((offer.info.requested.find(c => c.component_id === toCat.id)?.amount ?? 0) / toCat.mojos_per_coin);
        } else {
          offer.price = undefined;
        }
        tempOffers.push(result.data.offers[i]);
      }

      if (result.data.count <= currentPage * result.data.page_size) {
        moreToLoad = false;
      }
      if (fromCat.id === "any" || toCat.id === "any") {
        loop = false;
      }
      currentPage++;
    }
    if (fromCat.id !== "any" && toCat.id !== "any") {
      tempOffers.sort((a, b) => {
        return b.price - a.price;
      });
    }

    return {
      hasNextPage: moreToLoad,
      data: tempOffers,
    };
  }

  async function loadMore() {
    setLoading(true);
    try {
      const { data, hasNextPage: newHasNextPage } = await loadItems(page);
      setPage(page + 1);
      setItems((current) => [...current, ...data]);
      setHasNextPage(newHasNextPage);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  function clearOfferState() {
    setPage(1);
    setItems([]);
    setHasNextPage(true);
    setError(undefined);
    setLoading(false);
  }

  return {
    loadingOffers: loading,
    offers: items,
    hasNextOffersPage: hasNextPage,
    errorLoadingOffers: error,
    loadMoreOffers: loadMore,
    clearOfferState,
  };
}
