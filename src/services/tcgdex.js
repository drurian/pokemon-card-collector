import { formatTcgCard, needsCardDetails } from '../utils/tcgdex';

const TCGDEX_API_URL = 'https://api.tcgdex.net/v2/en/cards';
const TCGDEX_SETS_URL = 'https://api.tcgdex.net/v2/en/sets';

const fetchJson = async (url, signal) => {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Request failed (HTTP ${res.status})`);
  }
  return res.json();
};

const enrichCardsWithDetails = async (cards, signal) => {
  const pending = cards.map(async (card) => {
    if (!card?.id || !needsCardDetails(card)) return card;
    try {
      const detail = await fetchJson(`${TCGDEX_API_URL}/${card.id}`, signal);
      return formatTcgCard({ ...card, ...detail });
    } catch (e) {
      return card;
    }
  });
  return Promise.all(pending);
};

const extractUsdPriceFromCard = (card) => {
  if (!card) return null;
  const pricing = card.pricing || card.price;
  const tcg = pricing?.tcgplayer;
  const unit = tcg?.unit || pricing?.unit;
  if (unit && unit !== 'USD') return null;
  const holo = tcg?.holofoil || tcg?.normal || tcg?.reverseHolofoil || tcg?.firstEditionHolofoil;
  const price = holo?.marketPrice ?? holo?.midPrice ?? holo?.lowPrice ?? tcg?.market ?? tcg?.mid ?? tcg?.low;
  if (typeof price === 'number') return price;
  if (typeof price === 'string') return price;
  return null;
};

const formatPrice = (price) => {
  if (price == null) return null;
  if (typeof price === 'number') return `$${price.toFixed(2)}`;
  return price;
};

export {
  TCGDEX_API_URL,
  TCGDEX_SETS_URL,
  fetchJson,
  enrichCardsWithDetails,
  extractUsdPriceFromCard,
  formatPrice
};
