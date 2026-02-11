import { useEffect, useMemo } from 'react';
import { sortCards } from '../utils/sorting';

export default function useFilteredCollection({
  collection,
  cardTags,
  cardQuantities = {},
  collectionTypeFilter,
  collectionRarityFilter,
  collectionTagFilter,
  collectionSearchQuery,
  collectionSortBy = '',
  onResetPage
}) {
  const filteredCollection = useMemo(() => {
    // First filter
    const filtered = collection.filter((card) => {
      const nameMatch = !collectionSearchQuery.trim()
        || card.name?.toLowerCase().includes(collectionSearchQuery.trim().toLowerCase());
      return nameMatch
        && (!collectionTypeFilter || card.types?.includes(collectionTypeFilter))
        && (!collectionRarityFilter || card.rarity === collectionRarityFilter)
        && (!collectionTagFilter || (cardTags[card.id] || []).includes(collectionTagFilter));
    });

    // Then sort
    return sortCards(filtered, collectionSortBy, cardQuantities);
  }, [
    collection,
    cardTags,
    cardQuantities,
    collectionTypeFilter,
    collectionRarityFilter,
    collectionTagFilter,
    collectionSearchQuery,
    collectionSortBy
  ]);

  useEffect(() => {
    onResetPage?.();
  }, [collectionTypeFilter, collectionRarityFilter, collectionTagFilter, collectionSearchQuery, onResetPage]);

  return { filteredCollection };
}
