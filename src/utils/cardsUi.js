const getTypeBg = (type) => ({ Fire: 'bg-orange-700', Water: 'bg-blue-700', Grass: 'bg-green-700', Lightning: 'bg-yellow-600', Psychic: 'bg-purple-700', Fighting: 'bg-red-800', Colorless: 'bg-gray-600', Dark: 'bg-gray-800', Metal: 'bg-slate-600', Dragon: 'bg-indigo-700', Fairy: 'bg-pink-700' }[type] || 'bg-gray-700');
const getTypeEmoji = (type) => ({ Fire: '🔥', Water: '💧', Grass: '🌿', Lightning: '⚡', Psychic: '🔮', Fighting: '👊', Colorless: '⭐', Dark: '🌙', Metal: '⚙️', Dragon: '🐉', Fairy: '✨' }[type] || '⭐');

export { getTypeBg, getTypeEmoji };
