import { useState } from "react";
import axios from "axios";
import { CatInfo } from "./CatInfo";
import type { ResultType } from "../../../backend/src/routes/v1/offers/types.js"

export function useLoadInverseOffers(
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
    if (fromCat.id === "any" && toCat.id === "any") {
      return {
        hasNextPage: false,
        data: [],
      };
    }
    // Load all offers and sort on the client if neither are any
    let moreToLoad = true;
    const tempInverseOffers = [];
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
        params.requested = fromCat.id;
      }
      if (toCat.id !== "any") {
        params.offered = toCat.id;
      }
      const result = await axios.get(`/api/v1/offers`, { params });
      const offers = result.data.offers as ResultType[];
      for (let i = 0; i < offers.length; i++) {
        const inverseOffer: ResultType & {price?: number} = offers[i];
        if (fromCat.id !== "any" && toCat.id !== "any") {
          inverseOffer.price =
            (inverseOffer.info.requested.find(c => c.component_id === fromCat.id)?.amount ?? 0) /
            fromCat.mojos_per_coin /
            ((inverseOffer.info.offered.find(c => c.component_id === toCat.id)?.amount ?? 0) / toCat.mojos_per_coin);
        } else {
          inverseOffer.price = undefined;
        }
        tempInverseOffers.push(inverseOffer);
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
      tempInverseOffers.sort((a, b) => {
        return (a.price ?? 0) - (b.price ?? 0);
      });
    }

    return {
      hasNextPage: moreToLoad,
      data: tempInverseOffers,
    };
  }

  async function loadMore() {
    setLoading(true);
    try {
      const { data, hasNextPage: newHasNextPage } = await loadItems(page);
      setPage(page + 1);
      setItems((current: any[]) => [...current, ...data]);
      setHasNextPage(newHasNextPage);
    } catch (err: any) {
      console.log(err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  function clearInverseOfferState() {
    setPage(1);
    setItems([]);
    setHasNextPage(true);
    setError(undefined);
    setLoading(false);
  }

  return {
    loadingInverseOffers: loading,
    inverseOffers: items,
    hasNextInverseOffersPage: hasNextPage,
    errorLoadingInverseOffers: error,
    loadMoreInverseOffers: loadMore,
    clearInverseOfferState,
  };
}
