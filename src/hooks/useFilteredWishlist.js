import { useEffect, useMemo } from 'react';

export default function useFilteredWishlist({ wishlist, wishlistSearchQuery, onResetPage }) {
  const filteredWishlist = useMemo(() => wishlist.filter((card) => !wishlistSearchQuery.trim()
    || card.name?.toLowerCase().includes(wishlistSearchQuery.trim().toLowerCase())), [wishlist, wishlistSearchQuery]);

  useEffect(() => {
    onResetPage?.();
  }, [wishlistSearchQuery, onResetPage]);

  return { filteredWishlist };
}
