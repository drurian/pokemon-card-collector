import { useEffect, useRef, useState } from 'react';
import { dedupeById, ensureQuantitiesForCollection, normalizeQuantities } from '../utils/collection';
import { dataClient } from '../services/dataClient';

export default function useCollectionData({ currentUser, cloudConnected }) {
  const [collection, setCollection] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cardTags, setCardTags] = useState({});
  const [cardQuantities, setCardQuantities] = useState({});
  const [allTags, setAllTags] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');

  const saveTimeoutRef = useRef(null);

  const loadUserData = async (username) => {
    if (!cloudConnected) return;
    try {
      setSaveStatus('Loading...');
      const data = await dataClient.loadData(username);
      if (data) {
        const dedupedCollection = dedupeById(data.collection);
        const dedupedWishlist = dedupeById(data.wishlist);
        const normalizedQuantities = normalizeQuantities(data.card_quantities);
        const hydratedQuantities = ensureQuantitiesForCollection(dedupedCollection, normalizedQuantities);
        setCollection(dedupedCollection);
        setWishlist(dedupedWishlist);
        setCardTags(data.card_tags || {});
        setCardQuantities(hydratedQuantities);
        setAllTags(data.all_tags || []);
      }
      setSaveStatus('');
    } catch (e) {
      setSaveStatus('Load failed');
    }
  };

  const saveUserData = async () => {
    if (!currentUser || !cloudConnected) return;
    try {
      setSaveStatus('Saving...');
      await dataClient.saveData(currentUser.username, collection, wishlist, cardTags, cardQuantities, allTags);
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(''), 1500);
    } catch (e) {
      setSaveStatus('Save failed');
    }
  };

  useEffect(() => {
    if (!currentUser || !cloudConnected) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveUserData, 1500);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [collection, wishlist, cardTags, cardQuantities, allTags, currentUser, cloudConnected]);

  useEffect(() => {
    if (currentUser && cloudConnected) {
      loadUserData(currentUser.username);
    }
  }, [currentUser, cloudConnected]);

  useEffect(() => {
    if (currentUser) return;
    setCollection([]);
    setWishlist([]);
    setCardTags({});
    setCardQuantities({});
    setAllTags([]);
    setSaveStatus('');
  }, [currentUser]);

  const addTagToCard = (cardId, tag) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) return;
    setCardTags((prev) => {
      const current = prev[cardId] || [];
      if (current.includes(trimmed)) return prev;
      return { ...prev, [cardId]: [...current, trimmed] };
    });
    setAllTags((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  };

  const removeTagFromCard = (cardId, tag) => {
    setCardTags((prev) => ({
      ...prev,
      [cardId]: (prev[cardId] || []).filter((t) => t !== tag)
    }));
  };

  const getCardQuantity = (cardId) => Math.max(1, parseInt(cardQuantities[cardId], 10) || 1);

  const setCardQuantity = (cardId, qty) => {
    const quantity = Math.max(1, parseInt(qty, 10) || 1);
    setCardQuantities((prev) => ({ ...prev, [cardId]: quantity }));
  };

  const incrementQuantity = (cardId) => {
    setCardQuantities((prev) => ({ ...prev, [cardId]: (prev[cardId] || 1) + 1 }));
  };

  const decrementQuantity = (cardId) => {
    setCardQuantities((prev) => ({ ...prev, [cardId]: Math.max(1, (prev[cardId] || 1) - 1) }));
  };

  const getTotalCards = () => collection.reduce((sum, card) => sum + (parseInt(cardQuantities[card.id], 10) || 1), 0);

  const getDuplicateCount = () => collection.reduce((sum, card) => {
    const qty = parseInt(cardQuantities[card.id], 10) || 1;
    return sum + Math.max(0, qty - 1);
  }, 0);

  const renameTag = (oldTag, newTag) => {
    const trimmed = newTag.trim().toLowerCase();
    if (!trimmed || trimmed === oldTag) return;
    setAllTags((prev) => prev.map((tag) => (tag === oldTag ? trimmed : tag)).filter((tag, index, arr) => arr.indexOf(tag) === index));
    setCardTags((prev) => {
      const updated = {};
      for (const cardId in prev) {
        updated[cardId] = prev[cardId].map((tag) => (tag === oldTag ? trimmed : tag));
      }
      return updated;
    });
  };

  const deleteTagGlobally = (tag) => {
    if (!confirm(`Delete tag "${tag}" from all cards?`)) return;
    setAllTags((prev) => prev.filter((item) => item !== tag));
    setCardTags((prev) => {
      const updated = {};
      for (const cardId in prev) {
        updated[cardId] = prev[cardId].filter((item) => item !== tag);
      }
      return updated;
    });
  };

  const toggleCollection = (card) => {
    setCollection((prev) => {
      const exists = prev.find((item) => item.id === card.id);
      if (exists) {
        setCardQuantities((quantities) => {
          const next = { ...quantities };
          delete next[card.id];
          return next;
        });
        return prev.filter((item) => item.id !== card.id);
      }
      setCardQuantities((quantities) => ({ ...quantities, [card.id]: quantities[card.id] || 1 }));
      return [...prev, card];
    });
  };

  const toggleWishlist = (card) => {
    setWishlist((prev) => prev.find((item) => item.id === card.id)
      ? prev.filter((item) => item.id !== card.id)
      : [...prev, card]);
  };

  const isInCollection = (id) => collection.some((item) => item.id === id);
  const isInWishlist = (id) => wishlist.some((item) => item.id === id);

  return {
    collection,
    wishlist,
    cardTags,
    cardQuantities,
    allTags,
    saveStatus,
    loadUserData,
    addTagToCard,
    removeTagFromCard,
    getCardQuantity,
    setCardQuantity,
    incrementQuantity,
    decrementQuantity,
    getTotalCards,
    getDuplicateCount,
    renameTag,
    deleteTagGlobally,
    toggleCollection,
    toggleWishlist,
    isInCollection,
    isInWishlist
  };
}
