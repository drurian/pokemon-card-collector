import { useEffect, useMemo } from 'react';
import { sortCards } from '../utils/sorting';

export default function useFilteredWishlist({
  wishlist,
  cardTags = {},
  wishlistSearchQuery,
  wishlistTagFilter = '',
  wishlistSortBy = '',
  onResetPage
}) {
  const filteredWishlist = useMemo(() => {
    // First filter
    const filtered = wishlist.filter((card) => {
      const nameMatch = !wishlistSearchQuery.trim()
        || card.name?.toLowerCase().includes(wishlistSearchQuery.trim().toLowerCase());
      const tagMatch = !wishlistTagFilter
        || (cardTags[card.id] || []).includes(wishlistTagFilter);
      return nameMatch && tagMatch;
    });

    // Then sort
    return sortCards(filtered, wishlistSortBy);
  }, [wishlist, cardTags, wishlistSearchQuery, wishlistTagFilter, wishlistSortBy]);

  useEffect(() => {
    onResetPage?.();
  }, [wishlistSearchQuery, wishlistTagFilter, onResetPage]);

  return { filteredWishlist };
}
