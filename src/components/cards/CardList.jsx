import { Heart, Star } from 'lucide-react';
import { getCardImageSrc, handleCardImageError } from '../../utils/cardImages';

export default function CardList({
  cardList,
  emptyMsg,
  onSelect,
  getTypeBg,
  getTypeEmoji,
  getCardQuantity,
  isInCollection,
  isInWishlist,
  cardTags = {},
  getTagColor
}) {
  if (cardList.length === 0) {
    return <div className="text-center py-12 text-gray-600">{emptyMsg}</div>;
  }

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
        <div className="col-span-4">Card</div>
        <div className="col-span-2">Set</div>
        <div className="col-span-2">Rarity</div>
        <div className="col-span-1">Type</div>
        <div className="col-span-1 text-center">Qty</div>
        <div className="col-span-2">Tags</div>
      </div>

      {/* Card rows */}
      {cardList.map((card) => {
        const qty = getCardQuantity(card.id);
        const inCollection = isInCollection(card.id);
        const inWishlist = isInWishlist(card.id);
        const tags = cardTags[card.id] || [];

        return (
          <div
            key={card.id}
            onClick={() => onSelect(card)}
            className="grid grid-cols-12 gap-2 items-center px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
          >
            {/* Card info with thumbnail */}
            <div className="col-span-8 sm:col-span-4 flex items-center gap-3">
              <div className={`${getTypeBg(card.types?.[0])} p-0.5 rounded-lg flex-shrink-0`}>
                <div className="w-10 h-14 sm:w-12 sm:h-16 bg-white rounded overflow-hidden">
                  <img
                    src={getCardImageSrc(card)}
                    alt={card.name}
                    className="w-full h-full object-contain"
                    onError={handleCardImageError}
                  />
                </div>
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                  {card.name}
                </div>
                <div className="text-xs text-gray-500 sm:hidden truncate">
                  {card.set?.name}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {inCollection && (
                    <span className="bg-green-100 text-green-700 p-0.5 rounded" title="In Collection">
                      <Star size={10} fill="currentColor" />
                    </span>
                  )}
                  {inWishlist && (
                    <span className="bg-pink-100 text-pink-700 p-0.5 rounded" title="In Wishlist">
                      <Heart size={10} fill="currentColor" />
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Set - hidden on mobile */}
            <div className="hidden sm:block sm:col-span-2 text-sm text-gray-700 truncate" title={card.set?.name}>
              {card.set?.name}
            </div>

            {/* Rarity - hidden on mobile */}
            <div className="hidden sm:block sm:col-span-2">
              <span className="text-sm text-amber-700 font-medium">
                {card.rarity}
              </span>
            </div>

            {/* Type - hidden on mobile */}
            <div className="hidden sm:block sm:col-span-1 text-center" title={card.types?.[0]}>
              <span className="text-lg">{getTypeEmoji(card.types?.[0])}</span>
            </div>

            {/* Quantity */}
            <div className="col-span-2 sm:col-span-1 text-center">
              {inCollection && (
                <span className={`inline-flex items-center justify-center min-w-6 h-6 rounded-full text-xs font-bold ${qty > 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                  {qty}
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="col-span-2 flex flex-wrap gap-1 overflow-hidden">
              {tags.slice(0, 2).map((tag) => {
                const color = getTagColor?.(tag) || { bg: 'bg-gray-100', text: 'text-gray-700' };
                return (
                  <span
                    key={tag}
                    className={`px-1.5 py-0.5 rounded text-xs font-medium truncate max-w-16 ${color.bg} ${color.text}`}
                    title={tag}
                  >
                    {tag}
                  </span>
                );
              })}
              {tags.length > 2 && (
                <span className="text-xs text-gray-400">+{tags.length - 2}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
