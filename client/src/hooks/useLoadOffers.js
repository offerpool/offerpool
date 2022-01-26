import { useState } from "react";
import axios from "axios";

export function useLoadOffers(fromCat, toCat) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [hasNextPage, setHasNextPage] = useState(!fromCat || !toCat);
  const [error, setError] = useState();
  const [page, setPage] = useState(1);

  async function loadItems(currentPage) {
    let moreToLoad = true;
    const tempOffers = [];
    let pageSize = 100;
    let loop = true;
    if (fromCat.id === "any" || toCat.id === "any") {
      pageSize = 25;
    }

    while (loop && moreToLoad) {
      const params = {
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
        const offer = result.data.offers[i];
        if (fromCat.id !== "any" && toCat.id !== "any") {
          offer.price =
            offer.summary.offered[fromCat.id] /
            fromCat.mojos_per_coin /
            (offer.summary.requested[toCat.id] / toCat.mojos_per_coin);
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
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  function clearOfferState(fromCat, toCat) {
    setPage(1);
    setItems([]);
    setHasNextPage(true);
    setError();
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
