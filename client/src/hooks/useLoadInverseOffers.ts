import { useState } from "react";
import axios from "axios";
import { CatInfo } from "./CatInfo";

export function useLoadInverseOffers(
  fromCat: CatInfo | undefined,
  toCat: CatInfo | undefined
) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any>([]);
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
      for (let i = 0; i < result.data.offers.length; i++) {
        const inverseOffer = result.data.offers[i];
        if (fromCat.id !== "any" && toCat.id !== "any") {
          inverseOffer.price =
            inverseOffer.summary.requested[fromCat.id] /
            fromCat.mojos_per_coin /
            (inverseOffer.summary.offered[toCat.id] / toCat.mojos_per_coin);
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
        return a.price - b.price;
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
