import { useEffect, useRef, useState } from 'react';
import { PAGE_SIZE, SAMPLE_CARDS } from '../constants/cards';
import { buildTcgParams, formatTcgCard } from '../utils/tcgdex';
import { TCGDEX_API_URL, TCGDEX_SETS_URL, enrichCardsWithDetails, fetchJson } from '../services/tcgdex';

export default function useCards() {
  const [cards, setCards] = useState(SAMPLE_CARDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchRarity, setSearchRarity] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    const loadFeaturedCards = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      setLoading(true);
      setError('');
      try {
        const sets = await fetchJson(TCGDEX_SETS_URL, controller.signal);
        const sortedSets = Array.isArray(sets)
          ? sets.slice().sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0))
          : [];
        const featuredSet = sortedSets[0];
        if (!featuredSet?.id) throw new Error('No sets found');
        const candidateUrls = [
          `${TCGDEX_SETS_URL}/${featuredSet.id}`,
          `${TCGDEX_SETS_URL}/${featuredSet.id}/cards`,
          `${TCGDEX_API_URL}?set=${featuredSet.id}`
        ];
        let cardsData = null;
        for (const url of candidateUrls) {
          try {
            const data = await fetchJson(url, controller.signal);
            if (Array.isArray(data?.cards)) {
              cardsData = data.cards;
              break;
            }
            if (Array.isArray(data)) {
              cardsData = data;
              break;
            }
          } catch (innerError) {
            console.warn('Failed tcgdex fetch:', url, innerError);
          }
        }
        const list = Array.isArray(cardsData) ? cardsData : [];
        const formatted = list.map(formatTcgCard).slice(0, PAGE_SIZE);
        const enriched = await enrichCardsWithDetails(formatted, controller.signal);
        const finalCards = enriched.length > 0 ? enriched : formatted;
        if (finalCards.length === 0) throw new Error('No cards found in set');
        setCards(finalCards);
      } catch (e) {
        setCards(SAMPLE_CARDS);
        setError('Featured cards unavailable. Showing sample cards.');
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    loadFeaturedCards();
  }, []);

  const cancelSearch = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setLoading(false);
  };

  const searchCards = async () => {
    const hasQuery = searchQuery.trim() || searchType || searchRarity;
    if (!hasQuery) {
      setCards(SAMPLE_CARDS);
      setSearchResults([]);
      return;
    }
    cancelSearch();
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError('');
    let timeoutId;
    try {
      const params = buildTcgParams(searchQuery, searchType, searchRarity);
      const url = params.toString() ? `${TCGDEX_API_URL}?${params.toString()}` : TCGDEX_API_URL;
      timeoutId = setTimeout(() => abortControllerRef.current?.abort(), 10000);
      const res = await fetch(url, { signal: abortControllerRef.current.signal });
      if (!res.ok) {
        throw new Error(`Search failed (HTTP ${res.status})`);
      }
      const data = await res.json();
      const formatted = (Array.isArray(data) ? data : data?.data || []).map(formatTcgCard);
      const enriched = await enrichCardsWithDetails(formatted, abortControllerRef.current.signal);
      const finalCards = enriched.length > 0 ? enriched : formatted;
      if (finalCards.length === 0) {
        setError('No cards found. Try different filters.');
      }
      setSearchResults(finalCards);
      setCards(finalCards);
    } catch (e) {
      if (e.name === 'AbortError') {
        setError('Search timed out. Please try again.');
      } else {
        setError(e.message || 'Search failed. Please try again.');
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const resetToSample = () => {
    setCards(SAMPLE_CARDS);
    setSearchResults([]);
    setSearchQuery('');
    setSearchType('');
    setSearchRarity('');
    setError('');
  };

  return {
    cards,
    loading,
    error,
    searchResults,
    searchQuery,
    searchType,
    searchRarity,
    showFilters,
    setShowFilters,
    setSearchQuery,
    setSearchType,
    setSearchRarity,
    searchCards,
    resetToSample,
    cancelSearch
  };
}
