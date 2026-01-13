import { useEffect, useMemo } from 'react';

export default function useFilteredCollection({
  collection,
  cardTags,
  collectionTypeFilter,
  collectionRarityFilter,
  collectionTagFilter,
  collectionSearchQuery,
  onResetPage
}) {
  const filteredCollection = useMemo(() => collection.filter((card) => {
    const nameMatch = !collectionSearchQuery.trim()
      || card.name?.toLowerCase().includes(collectionSearchQuery.trim().toLowerCase());
    return nameMatch
      && (!collectionTypeFilter || card.types?.includes(collectionTypeFilter))
      && (!collectionRarityFilter || card.rarity === collectionRarityFilter)
      && (!collectionTagFilter || (cardTags[card.id] || []).includes(collectionTagFilter));
  }), [
    collection,
    cardTags,
    collectionTypeFilter,
    collectionRarityFilter,
    collectionTagFilter,
    collectionSearchQuery
  ]);

  useEffect(() => {
    onResetPage?.();
  }, [collectionTypeFilter, collectionRarityFilter, collectionTagFilter, collectionSearchQuery, onResetPage]);

  return { filteredCollection };
}
