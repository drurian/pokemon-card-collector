import { useRef, useState } from 'react';
import { TCGDEX_API_URL, extractUsdPriceFromCard, fetchJson, formatPrice } from '../services/tcgdex';

export default function usePricing() {
  const [priceResults, setPriceResults] = useState([]);
  const [searchingPrices, setSearchingPrices] = useState(false);
  const [priceSummary, setPriceSummary] = useState('');

  const priceAbortRef = useRef(null);

  const cancelPriceSearch = () => {
    if (priceAbortRef.current) priceAbortRef.current.abort();
    setSearchingPrices(false);
  };

  const clearPricing = () => {
    setPriceResults([]);
    setPriceSummary('');
  };

  const searchPrices = async (card) => {
    cancelPriceSearch();
    priceAbortRef.current = new AbortController();
    setSearchingPrices(true);
    setPriceResults([]);
    setPriceSummary('');
    try {
      const detail = await fetchJson(`${TCGDEX_API_URL}/${card.id}`, priceAbortRef.current.signal);
      const priceValue = extractUsdPriceFromCard(detail);
      setPriceSummary(formatPrice(priceValue) || 'Price unavailable');
    } catch (e) {
      if (e.name !== 'AbortError') {
        setPriceSummary('Price unavailable');
      }
    }
    setPriceResults([
      { store: 'TCGPlayer', price: 'Shop →', url: `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(card.name)}` },
      { store: 'eBay', price: 'Shop →', url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(card.name + ' pokemon card')}` },
    ]);
    setSearchingPrices(false);
  };

  return {
    priceResults,
    searchingPrices,
    priceSummary,
    searchPrices,
    cancelPriceSearch,
    clearPricing
  };
}
