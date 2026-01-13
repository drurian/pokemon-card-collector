const buildTcgParams = (name, type, rarity) => {
  const params = new URLSearchParams();
  if (name && name.trim()) params.set('name', name.trim());
  if (type) params.set('types', type);
  if (rarity) params.set('rarity', rarity);
  return params;
};

const ensureImageExtension = (url) => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  const lower = url.toLowerCase();
  if (/\.(png|jpe?g|webp)$/.test(lower)) return url;
  if (lower.includes('assets.tcgdex.net')) return `${url}/high.webp`;
  return `${url}.png`;
};

const normalizeCardImage = (card) => {
  if (!card) return null;
  if (typeof card.image === 'string') return ensureImageExtension(card.image);
  if (card.image && typeof card.image === 'object') {
    const candidate = card.image.high || card.image.large || card.image.medium || card.image.low || card.image.small || card.image.url;
    if (candidate) return ensureImageExtension(candidate);
  }
  if (card.images && typeof card.images === 'object') {
    const candidate = card.images.high || card.images.large || card.images.medium || card.images.low || card.images.small || card.images.png || card.images.jpg || card.images.webp || card.images.url;
    if (candidate) return ensureImageExtension(candidate);
  }
  return null;
};

const getSetName = (set) => {
  if (!set) return '';
  if (typeof set === 'string') return set;
  if (typeof set.name === 'string') return set.name;
  if (typeof set.id === 'string') return set.id;
  return '';
};

const formatTcgCard = (card) => ({
  id: card.id,
  name: card.name,
  set: { name: getSetName(card.set) },
  number: card.localId || card.number,
  rarity: card.rarity,
  types: card.types || [],
  image: normalizeCardImage(card)
});

const needsCardDetails = (card) => !card?.set?.name || !card?.rarity || !card?.types?.length;

export { buildTcgParams, ensureImageExtension, normalizeCardImage, getSetName, formatTcgCard, needsCardDetails };
