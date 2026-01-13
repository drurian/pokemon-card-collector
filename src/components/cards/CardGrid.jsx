import { Heart, Star } from 'lucide-react';
import { getCardImageSrc, handleCardImageError } from '../../utils/cardImages';

export default function CardGrid({
  cardList,
  emptyMsg,
  onSelect,
  getTypeBg,
  getTypeEmoji,
  getCardQuantity,
  isInCollection,
  isInWishlist
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {cardList.length === 0 ? (
        <div className="col-span-full text-center py-12 text-gray-600">{emptyMsg}</div>
      ) : cardList.map((card) => {
        const qty = getCardQuantity(card.id);
        const inCollection = isInCollection(card.id);
        const hasImage = Boolean(card.image);
        return (
          <div key={card.id} className="relative cursor-pointer" onClick={() => onSelect(card)}>
            <div className={`${getTypeBg(card.types?.[0])} rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-105 border-2 border-white/20`}>
              <div className="bg-white rounded-lg m-1 aspect-[2.5/3.5] flex flex-col items-center justify-center overflow-hidden relative">
                <img src={getCardImageSrc(card)} alt={card.name} className="w-full h-full object-contain" onError={handleCardImageError} />
                {!hasImage && (
                  <div className="absolute inset-0 text-center p-2 flex flex-col justify-center items-center">
                    <div className="text-2xl mb-1">{getTypeEmoji(card.types?.[0])}</div>
                    <div className="text-gray-900 font-bold text-xs leading-tight">{card.name}</div>
                    <div className="text-gray-600 text-xs mt-0.5">{card.set?.name}</div>
                    <div className="text-amber-600 font-semibold text-xs">{card.rarity}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
              {inCollection && qty > 1 && <div className="bg-blue-600 px-1.5 py-0.5 rounded-full shadow border border-white text-white text-xs font-bold">×{qty}</div>}
              {inCollection && <div className="bg-green-600 p-1 rounded-full shadow border border-white"><Star size={10} fill="white" className="text-white" /></div>}
              {isInWishlist(card.id) && <div className="bg-pink-600 p-1 rounded-full shadow border border-white"><Heart size={10} fill="white" className="text-white" /></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
