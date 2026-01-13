import { useState } from 'react';
import { ExternalLink, Heart, Loader2, Plus, ShoppingCart, Star, StopCircle, Tag, X } from 'lucide-react';
import { getCardImageSrc, handleCardImageError } from '../../utils/cardImages';
import CardTags from './CardTags';

export default function CardModal({
  card,
  onClose,
  tags,
  allTags,
  getTagColor,
  onAddTag,
  onRemoveTag,
  isInCollection,
  isInWishlist,
  getCardQuantity,
  setCardQuantity,
  incrementQuantity,
  decrementQuantity,
  toggleCollection,
  toggleWishlist,
  getTypeBg,
  getTypeEmoji,
  priceSummary,
  searchingPrices,
  priceResults,
  searchPrices,
  cancelPriceSearch
}) {
  const [localNewTag, setLocalNewTag] = useState('');
  const unusedTags = (allTags || []).filter((tag) => !(tags || []).includes(tag));
  const inCollection = isInCollection(card.id);
  const qty = getCardQuantity(card.id);
  const handleAddTag = (tag) => {
    onAddTag(card.id, tag);
    setLocalNewTag('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full my-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className={`${getTypeBg(card.types?.[0])} p-4 rounded-t-2xl flex justify-between items-center`}>
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><span className="text-2xl">{getTypeEmoji(card.types?.[0])}</span>{card.name}</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white bg-black/20 rounded-full p-1"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-center"><img src={getCardImageSrc(card)} alt={card.name} className="w-48 rounded-lg shadow-lg" onError={handleCardImageError} /></div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-100 p-2 rounded-lg"><span className="text-gray-500 block text-xs">Set</span><span className="text-gray-900 font-medium">{card.set?.name}</span></div>
            <div className="bg-gray-100 p-2 rounded-lg"><span className="text-gray-500 block text-xs">Number</span><span className="text-gray-900 font-medium">#{card.number}</span></div>
            <div className="bg-gray-100 p-2 rounded-lg"><span className="text-gray-500 block text-xs">Rarity</span><span className="text-gray-900 font-medium">{card.rarity}</span></div>
            <div className="bg-gray-100 p-2 rounded-lg"><span className="text-gray-500 block text-xs">Type</span><span className="text-gray-900 font-medium">{card.types?.join(', ')}</span></div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm mb-2"><Tag size={14} /> Tags</div>
            {tags?.length > 0 && (
              <div className="mb-2">
                <CardTags
                  tags={tags}
                  editable={true}
                  getTagColor={getTagColor}
                  onRemoveTag={(tag) => onRemoveTag(card.id, tag)}
                />
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={localNewTag}
                onChange={(event) => setLocalNewTag(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') handleAddTag(localNewTag); }}
                placeholder="Add new tag..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
              />
              <button onClick={() => handleAddTag(localNewTag)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"><Plus size={16} /></button>
            </div>
            {unusedTags.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Quick add:</div>
                <div className="flex flex-wrap gap-1">
                  {unusedTags.slice(0, 6).map((tag) => {
                    const color = getTagColor(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => handleAddTag(tag)}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text} border ${color.border} hover:opacity-80 transition`}
                      >
                        + {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => toggleCollection(card)} className={`flex-1 py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition text-sm border-2 ${inCollection ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'}`}><Star size={14} fill={inCollection ? 'white' : 'none'} />{inCollection ? 'Collected ✓' : 'Add to Collection'}</button>
            <button onClick={() => toggleWishlist(card)} className={`flex-1 py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition text-sm border-2 ${isInWishlist(card.id) ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-700 border-gray-300 hover:border-pink-500'}`}><Heart size={14} fill={isInWishlist(card.id) ? 'white' : 'none'} />{isInWishlist(card.id) ? 'Wanted ✓' : 'Add to Wishlist'}</button>
          </div>
          {inCollection && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium text-sm">Quantity owned:</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => decrementQuantity(card.id)} className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center justify-center">−</button>
                  <input type="number" value={qty} onChange={(event) => setCardQuantity(card.id, event.target.value)} className="w-14 text-center py-1 rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:outline-none font-bold text-blue-800" min="1" />
                  <button onClick={() => incrementQuantity(card.id)} className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center justify-center">+</button>
                </div>
              </div>
            </div>
          )}
          {priceSummary && <div className="text-center text-sm text-gray-700 font-semibold">{priceSummary}</div>}
          {searchingPrices ? (
            <button onClick={cancelPriceSearch} className="w-full py-2 px-4 rounded-lg font-semibold bg-red-600 text-white flex items-center justify-center gap-2 hover:bg-red-700 transition"><StopCircle size={16} /> Stop</button>
          ) : (
            <button onClick={() => searchPrices(card)} className="w-full py-2 px-4 rounded-lg font-semibold bg-blue-600 text-white flex items-center justify-center gap-2 hover:bg-blue-700 transition"><ShoppingCart size={16} /> Shop</button>
          )}
          {searchingPrices && <div className="flex items-center justify-center gap-2 py-2 text-blue-600"><Loader2 className="animate-spin" size={20} /><span className="text-sm">Searching...</span></div>}
          {priceResults.length > 0 && (
            <div className="bg-gray-100 p-3 rounded-lg space-y-2">
              <div className="text-gray-900 font-semibold text-sm">🛒 Where to Buy</div>
              {priceResults.map((result, index) => (
                <a
                  key={`${result.store}-${index}`}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-between items-center bg-white p-2 rounded-lg hover:bg-gray-50 transition text-sm border border-gray-200"
                >
                  <span className="text-gray-900 font-medium">{result.store}</span>
                  <span className="flex items-center gap-1 text-green-700 font-bold">{result.price} <ExternalLink size={12} /></span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
