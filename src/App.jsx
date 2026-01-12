import { useState, useRef, useEffect } from 'react';
import { Search, Star, ShoppingCart, Heart, X, Loader2, ExternalLink, RefreshCw, StopCircle, Filter, ChevronDown, Tag, Plus, LogOut, Shield, User } from 'lucide-react';
import pikachuSvg from './assets/pikachu.svg';
import pokeballSvg from './assets/pokeball.svg';
import squirtleSvg from './assets/squirtle.svg';
import AdminPanel from './components/AdminPanel';
import LoginScreen from './components/LoginScreen';
import { hashPassword } from './utils/auth';

// For local development with Vite, create a .env file with:
// VITE_SUPABASE_URL=https://ivifaujvogltczeybmfg.supabase.co
// VITE_SUPABASE_KEY=your-key-here
//
// Then replace these lines with:
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const TCGDEX_API_URL = 'https://api.tcgdex.net/v2/en/cards';
const TCGDEX_SETS_URL = 'https://api.tcgdex.net/v2/en/sets';

const SESSION_STORAGE_KEY = 'pokemon-collector-session';
const AVATAR_STORAGE_PREFIX = 'pokemon-collector-avatar:';
const PAGE_SIZE = 12;

const LEGACY_DEFAULT_ADMIN_HASHES = [
  'c64ba234d45b6422383f0261d09a8d4ed2cd156fd636b348899cc24c6fa8906f'
];

const DEFAULT_ADMIN = { username: 'admin', password: 'admin123' };
const TYPES = ['Fire', 'Water', 'Grass', 'Lightning', 'Psychic', 'Fighting', 'Dark', 'Metal', 'Dragon', 'Fairy', 'Colorless'];
const RARITIES = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Ultra Rare', 'V', 'VMAX', 'VSTAR', 'GX', 'EX', 'Tag Team GX', 'Shiny', 'Secret Rare'];

const SAMPLE_CARDS = [
  { id: 'base1-4', name: 'Charizard', set: { name: 'Base Set' }, number: '4', rarity: 'Rare Holo', types: ['Fire'], image: 'https://images.pokemontcg.io/base1/4_hires.png' },
  { id: 'base1-58', name: 'Pikachu', set: { name: 'Base Set' }, number: '58', rarity: 'Common', types: ['Lightning'], image: 'https://images.pokemontcg.io/base1/58_hires.png' },
  { id: 'base1-2', name: 'Blastoise', set: { name: 'Base Set' }, number: '2', rarity: 'Rare Holo', types: ['Water'], image: 'https://images.pokemontcg.io/base1/2_hires.png' },
  { id: 'base1-15', name: 'Venusaur', set: { name: 'Base Set' }, number: '15', rarity: 'Rare Holo', types: ['Grass'], image: 'https://images.pokemontcg.io/base1/15_hires.png' },
  { id: 'neo1-9', name: 'Lugia', set: { name: 'Neo Genesis' }, number: '9', rarity: 'Rare Holo', types: ['Psychic'], image: 'https://images.pokemontcg.io/neo1/9_hires.png' },
  { id: 'base1-1', name: 'Alakazam', set: { name: 'Base Set' }, number: '1', rarity: 'Rare Holo', types: ['Psychic'], image: 'https://images.pokemontcg.io/base1/1_hires.png' },
  { id: 'xy12-52', name: 'Mewtwo EX', set: { name: 'Evolutions' }, number: '52', rarity: 'EX', types: ['Psychic'], image: 'https://images.pokemontcg.io/xy12/52_hires.png' },
  { id: 'sm1-143', name: 'Snorlax GX', set: { name: 'Sun & Moon' }, number: '143', rarity: 'GX', types: ['Colorless'], image: 'https://images.pokemontcg.io/sm1/143_hires.png' },
  { id: 'swsh4-44', name: 'Pikachu VMAX', set: { name: 'Vivid Voltage' }, number: '44', rarity: 'VMAX', types: ['Lightning'], image: 'https://images.pokemontcg.io/swsh4/44_hires.png' },
  { id: 'sm9-53', name: 'Gengar & Mimikyu GX', set: { name: 'Team Up' }, number: '53', rarity: 'Tag Team GX', types: ['Psychic'], image: 'https://images.pokemontcg.io/sm9/53_hires.png' },
  { id: 'swsh1-138', name: 'Zacian V', set: { name: 'Sword & Shield' }, number: '138', rarity: 'V', types: ['Metal'], image: 'https://images.pokemontcg.io/swsh1/138_hires.png' },
  { id: 'sm115-sv49', name: 'Charizard GX', set: { name: 'Hidden Fates' }, number: 'SV49', rarity: 'Shiny', types: ['Fire'], image: 'https://images.pokemontcg.io/sm115/SV49_hires.png' },
];

const TAG_COLORS = [
  { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
];

const getTagColor = (tagName) => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
};

const normalizeQuantities = (quantities) => Object.fromEntries(
  Object.entries(quantities || {}).map(([id, qty]) => [id, Math.max(1, parseInt(qty, 10) || 1)])
);

const ensureQuantitiesForCollection = (collectionItems, quantities) => {
  const updated = { ...(quantities || {}) };
  (collectionItems || []).forEach((card) => {
    if (!card?.id) return;
    if (!updated[card.id]) updated[card.id] = 1;
  });
  return updated;
};

const dedupeById = (items) => {
  const seen = new Set();
  return (items || []).filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const getStoredAvatar = (username) => {
  if (!username) return '';
  return localStorage.getItem(`${AVATAR_STORAGE_PREFIX}${username}`) || '';
};

const storeAvatar = (username, avatarUrl) => {
  if (!username) return;
  const key = `${AVATAR_STORAGE_PREFIX}${username}`;
  if (avatarUrl) localStorage.setItem(key, avatarUrl);
  else localStorage.removeItem(key);
};

const buildTcgParams = (name, type, rarity) => {
  const params = new URLSearchParams();
  if (name.trim()) params.set('name', name.trim());
  if (type) params.set('types', type);
  if (rarity) params.set('rarity', rarity);
  return params;
};

const ensureImageExtension = (url) => {
  if (!url) return null;
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

const PikachuIcon = ({ className }) => (
  <img src={pikachuSvg} alt="" className={className} aria-hidden="true" />
);

const SquirtleIcon = ({ className }) => (
  <img src={squirtleSvg} alt="" className={className} aria-hidden="true" />
);

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

const fetchJson = async (url, signal) => {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Request failed (HTTP ${res.status})`);
  }
  return res.json();
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

const supabase = {
  async getUsers() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pokemon_users?select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    return res.json();
  },
  async loadItems(userId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pokemon_collection_items?user_id=eq.${userId}&select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    return res.json();
  },
  async createUser(username, password, isAdmin = false) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pokemon_users`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({ username, password, is_admin: isAdmin })
    });
    return res.json();
  },
  async updateUserPassword(username, password) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pokemon_users?username=eq.${username}`, {
      method: 'PATCH',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ password })
    });
    return res.json();
  },
  async updateUser(username, updates) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pokemon_users?username=eq.${username}`, {
      method: 'PATCH',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },
  async deleteUser(username) {
    await fetch(`${SUPABASE_URL}/rest/v1/pokemon_users?username=eq.${username}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    await fetch(`${SUPABASE_URL}/rest/v1/pokemon_collection_items?user_id=eq.${username}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
  },
  async loadData(userId) {
    const items = await this.loadItems(userId);
    if (Array.isArray(items) && items.length > 0 && !items.error) {
      const collectionItems = items.filter((item) => item.item_type === 'collection');
      const wishlistItems = items.filter((item) => item.item_type === 'wishlist');
      const cardTags = {};
      const cardQuantities = {};
      collectionItems.forEach((item) => {
        if (!item.card_id) return;
        cardTags[item.card_id] = item.tags || [];
        cardQuantities[item.card_id] = item.quantity || 1;
      });
      const allTags = Object.values(cardTags).flat().filter((tag, index, arr) => arr.indexOf(tag) === index);
      return {
        collection: collectionItems.map((item) => item.card_data || { id: item.card_id }),
        wishlist: wishlistItems.map((item) => item.card_data || { id: item.card_id }),
        card_tags: cardTags,
        card_quantities: cardQuantities,
        all_tags: allTags
      };
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pokemon_collections?user_id=eq.${userId}&select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const data = await res.json();
    return data[0] || null;
  },
  async saveData(userId, collection, wishlist, cardTags, cardQuantities, allTags) {
    const rows = [
      ...(collection || []).map((card) => ({
        user_id: userId,
        card_id: card.id,
        item_type: 'collection',
        quantity: cardQuantities[card.id] || 1,
        tags: cardTags[card.id] || [],
        card_data: card,
        updated_at: new Date().toISOString()
      })),
      ...(wishlist || []).map((card) => ({
        user_id: userId,
        card_id: card.id,
        item_type: 'wishlist',
        quantity: 1,
        tags: cardTags[card.id] || [],
        card_data: card,
        updated_at: new Date().toISOString()
      }))
    ];
    const collectionIds = (collection || []).map((card) => card.id).filter(Boolean);
    const wishlistIds = (wishlist || []).map((card) => card.id).filter(Boolean);
    const deleteHeaders = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };
    const buildDeleteUrl = (itemType, ids) => {
      const params = new URLSearchParams({
        user_id: `eq.${userId}`,
        item_type: `eq.${itemType}`
      });
      if (ids && ids.length > 0) {
        const listValue = ids
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',');
        params.set('card_id', `not.in.(${listValue})`);
      }
      return `${SUPABASE_URL}/rest/v1/pokemon_collection_items?${params.toString()}`;
    };
    await fetch(buildDeleteUrl('collection', collectionIds), {
      method: 'DELETE',
      headers: deleteHeaders
    });
    await fetch(buildDeleteUrl('wishlist', wishlistIds), {
      method: 'DELETE',
      headers: deleteHeaders
    });
    if (rows.length === 0) return;
    await fetch(`${SUPABASE_URL}/rest/v1/pokemon_collection_items`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows)
    });
  }
};

export default function PokemonCardTracker() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [showLogin, setShowLogin] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

  const [view, setView] = useState('browse');
  const [browsePage, setBrowsePage] = useState(1);
  const [collectionPage, setCollectionPage] = useState(1);
  const [wishlistPage, setWishlistPage] = useState(1);
  const [cards, setCards] = useState(SAMPLE_CARDS);
  const [collection, setCollection] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cardTags, setCardTags] = useState({});
  const [cardQuantities, setCardQuantities] = useState({});
  const [allTags, setAllTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [priceResults, setPriceResults] = useState([]);
  const [searchingPrices, setSearchingPrices] = useState(false);
  const [priceSummary, setPriceSummary] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [cloudConnected, setCloudConnected] = useState(false);

  const [searchType, setSearchType] = useState('');
  const [searchRarity, setSearchRarity] = useState('');
  const [collectionTypeFilter, setCollectionTypeFilter] = useState('');
  const [collectionRarityFilter, setCollectionRarityFilter] = useState('');
  const [collectionTagFilter, setCollectionTagFilter] = useState('');
  const [collectionSearchQuery, setCollectionSearchQuery] = useState('');
  const [wishlistSearchQuery, setWishlistSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const abortControllerRef = useRef(null);
  const priceAbortRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    if (currentUser || users.length === 0) return;
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      const restoredUser = users.find((user) => user.username === saved.username);
      if (restoredUser) {
        setCurrentUser(restoredUser);
        setShowLogin(false);
        loadUserData(restoredUser.username);
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [users, currentUser]);

  useEffect(() => {
    const loadFeaturedCards = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      setLoading(true);
      setError('');
      try {
        const sets = await fetchJson(TCGDEX_SETS_URL, controller.signal);
        const sortedSets = Array.isArray(sets)
          ? sets.slice().sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0))
          : [];
        const featuredSet = sortedSets[0];
        if (!featuredSet?.id) throw new Error('No sets found');
        const candidateUrls = [
          `${TCGDEX_SETS_URL}/${featuredSet.id}`,
          `${TCGDEX_SETS_URL}/${featuredSet.id}/cards`,
          `${TCGDEX_API_URL}?set=${featuredSet.id}`
        ];
        let cardsData = null;
        for (const url of candidateUrls) {
          try {
            const data = await fetchJson(url, controller.signal);
            if (Array.isArray(data?.cards)) {
              cardsData = data.cards;
              break;
            }
            if (Array.isArray(data)) {
              cardsData = data;
              break;
            }
          } catch (innerError) {
            console.warn('Failed tcgdex fetch:', url, innerError);
          }
        }
        const list = Array.isArray(cardsData) ? cardsData : [];
        const formatted = list.map(formatTcgCard).slice(0, PAGE_SIZE);
        const enriched = await enrichCardsWithDetails(formatted, controller.signal);
        const finalCards = enriched.length > 0 ? enriched : formatted;
        if (finalCards.length === 0) throw new Error('No cards found in set');
        setCards(finalCards);
      } catch (e) {
        setCards(SAMPLE_CARDS);
        setError('Featured cards unavailable. Showing sample cards.');
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };
    loadFeaturedCards();
  }, []);

  const loadUsers = async () => {
    if (!SUPABASE_KEY || SUPABASE_KEY.includes('your-publishable-key')) {
      const hashedPw = await hashPassword(DEFAULT_ADMIN.password);
      const localAvatar = getStoredAvatar(DEFAULT_ADMIN.username);
      setUsers([{ username: DEFAULT_ADMIN.username, password: hashedPw, is_admin: true, avatar_url: localAvatar || undefined }]);
      return;
    }
    try {
      const data = await supabase.getUsers();
      if (!data || data.length === 0 || data.error) {
        const hashedPw = await hashPassword(DEFAULT_ADMIN.password);
        try {
          await supabase.createUser(DEFAULT_ADMIN.username, hashedPw, true);
        } catch (createErr) {
          console.log('Admin may already exist:', createErr);
        }
        const refreshedData = await supabase.getUsers();
        const baseUsers = refreshedData || [{ username: DEFAULT_ADMIN.username, password: hashedPw, is_admin: true }];
        setUsers(baseUsers.map((user) => ({
          ...user,
          avatar_url: user.avatar_url != null ? user.avatar_url : getStoredAvatar(user.username) || undefined
        })));
      } else {
        const hashedPw = await hashPassword(DEFAULT_ADMIN.password);
        const adminUser = data.find((user) => user.username === DEFAULT_ADMIN.username);
        if (adminUser && LEGACY_DEFAULT_ADMIN_HASHES.includes(adminUser.password) && adminUser.password !== hashedPw) {
          try {
            await supabase.updateUserPassword(DEFAULT_ADMIN.username, hashedPw);
            const updatedUsers = data.map((user) => (
              user.username === DEFAULT_ADMIN.username ? { ...user, password: hashedPw } : user
            ));
            setUsers(updatedUsers.map((user) => ({
              ...user,
              avatar_url: user.avatar_url != null ? user.avatar_url : getStoredAvatar(user.username) || undefined
            })));
          } catch (updateErr) {
            console.log('Failed to update admin password hash:', updateErr);
            setUsers(data.map((user) => ({
              ...user,
              avatar_url: user.avatar_url != null ? user.avatar_url : getStoredAvatar(user.username) || undefined
            })));
          }
        } else {
          setUsers(data.map((user) => ({
            ...user,
            avatar_url: user.avatar_url != null ? user.avatar_url : getStoredAvatar(user.username) || undefined
          })));
        }
      }
      setCloudConnected(true);
    } catch (e) {
      console.error('Failed to load users:', e);
      const hashedPw = await hashPassword(DEFAULT_ADMIN.password);
      const localAvatar = getStoredAvatar(DEFAULT_ADMIN.username);
      setUsers([{ username: DEFAULT_ADMIN.username, password: hashedPw, is_admin: true, avatar_url: localAvatar || undefined }]);
    }
  };

  const handleLogin = (user, rememberMe = false) => {
    setCurrentUser(user);
    setShowLogin(false);
    if (rememberMe) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ username: user.username }));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    loadUserData(user.username);
  };
  const handleLogout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentUser(null);
    setShowLogin(true);
    setCollection([]);
    setWishlist([]);
    setCardTags({});
    setCardQuantities({});
    setAllTags([]);
  };

  const loadUserData = async (username) => {
    if (!cloudConnected) return;
    try {
      setSaveStatus('Loading...');
      const data = await supabase.loadData(username);
      if (data) {
        const dedupedCollection = dedupeById(data.collection);
        const dedupedWishlist = dedupeById(data.wishlist);
        const normalizedQuantities = normalizeQuantities(data.card_quantities);
        const hydratedQuantities = ensureQuantitiesForCollection(dedupedCollection, normalizedQuantities);
        setCollection(dedupedCollection);
        setWishlist(dedupedWishlist);
        setCardTags(data.card_tags || {});
        setCardQuantities(hydratedQuantities);
        setAllTags(data.all_tags || []);
      }
      setSaveStatus('');
    } catch (e) { setSaveStatus('Load failed'); }
  };

  const saveUserData = async () => {
    if (!currentUser || !cloudConnected) return;
    try { setSaveStatus('Saving...'); await supabase.saveData(currentUser.username, collection, wishlist, cardTags, cardQuantities, allTags); setSaveStatus('Saved!'); setTimeout(() => setSaveStatus(''), 1500); }
    catch (e) { setSaveStatus('Save failed'); }
  };

  useEffect(() => {
    if (!currentUser || !cloudConnected) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveUserData, 1500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [collection, wishlist, cardTags, cardQuantities, allTags]);

  useEffect(() => {
    if (currentUser && cloudConnected) {
      loadUserData(currentUser.username);
    }
  }, [currentUser, cloudConnected]);

  useEffect(() => {
    const pageCount = Math.ceil(cards.length / PAGE_SIZE);
    if (pageCount === 0 && browsePage !== 1) setBrowsePage(1);
    else if (pageCount > 0 && browsePage > pageCount) setBrowsePage(pageCount);
  }, [cards.length, browsePage]);

  useEffect(() => {
    const filteredLength = getFilteredCollection().length;
    const pageCount = Math.ceil(filteredLength / PAGE_SIZE);
    if (pageCount === 0 && collectionPage !== 1) setCollectionPage(1);
    else if (pageCount > 0 && collectionPage > pageCount) setCollectionPage(pageCount);
  }, [collection, cardTags, collectionTypeFilter, collectionRarityFilter, collectionTagFilter, collectionPage]);

  useEffect(() => {
    const filteredLength = wishlist.filter((card) => !wishlistSearchQuery.trim()
      || card.name?.toLowerCase().includes(wishlistSearchQuery.trim().toLowerCase())).length;
    const pageCount = Math.ceil(filteredLength / PAGE_SIZE);
    if (pageCount === 0 && wishlistPage !== 1) setWishlistPage(1);
    else if (pageCount > 0 && wishlistPage > pageCount) setWishlistPage(pageCount);
  }, [wishlist, wishlistSearchQuery, wishlistPage]);

  useEffect(() => { setCollectionPage(1); }, [collectionTypeFilter, collectionRarityFilter, collectionTagFilter, collectionSearchQuery]);
  useEffect(() => { setWishlistPage(1); }, [wishlistSearchQuery]);

  const addNewUser = async (username, password, isAdmin) => {
    if (cloudConnected) { await supabase.createUser(username, password, isAdmin); }
    setUsers([...users, { username, password, is_admin: isAdmin }]);
  };

  const deleteUserAccount = async (username) => {
    if (username === 'admin') { alert('Cannot delete admin account'); return; }
    if (!confirm(`Delete user "${username}" and all their data?`)) return;
    if (cloudConnected) { await supabase.deleteUser(username); }
    setUsers(users.filter(u => u.username !== username));
  };

  const updateUserAccount = async (username, updates) => {
    if (!username) return;
    const avatarValue = updates.avatar_url === '' ? null : updates.avatar_url;
    const payload = {
      ...(updates.password ? { password: updates.password } : {}),
      ...(typeof updates.is_admin === 'boolean' ? { is_admin: updates.is_admin } : {}),
      ...(updates.avatar_url !== undefined ? { avatar_url: avatarValue } : {})
    };
    if (cloudConnected && Object.keys(payload).length > 0) {
      await supabase.updateUser(username, payload);
    }
    if (updates.avatar_url !== undefined) {
      storeAvatar(username, avatarValue || '');
    }
    setUsers((prev) => prev.map((user) => (
      user.username === username ? { ...user, ...payload } : user
    )));
    setCurrentUser((prev) => (
      prev?.username === username ? { ...prev, ...payload } : prev
    ));
  };

  const addTagToCard = (cardId, tag) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) return;
    setCardTags(prev => { const current = prev[cardId] || []; if (current.includes(trimmed)) return prev; return { ...prev, [cardId]: [...current, trimmed] }; });
    setAllTags(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
  };

  const removeTagFromCard = (cardId, tag) => { setCardTags(prev => ({ ...prev, [cardId]: (prev[cardId] || []).filter(t => t !== tag) })); };

  const getCardQuantity = (cardId) => Math.max(1, parseInt(cardQuantities[cardId], 10) || 1);

  const setCardQuantity = (cardId, qty) => {
    const quantity = Math.max(1, parseInt(qty) || 1);
    setCardQuantities(prev => ({ ...prev, [cardId]: quantity }));
  };

  const incrementQuantity = (cardId) => {
    setCardQuantities(prev => ({ ...prev, [cardId]: (prev[cardId] || 1) + 1 }));
  };

  const decrementQuantity = (cardId) => {
    setCardQuantities(prev => ({ ...prev, [cardId]: Math.max(1, (prev[cardId] || 1) - 1) }));
  };

  const getTotalCards = () => {
    return collection.reduce((sum, card) => sum + (parseInt(cardQuantities[card.id], 10) || 1), 0);
  };

  const getDuplicateCount = () => {
    return collection.reduce((sum, card) => {
      const qty = parseInt(cardQuantities[card.id], 10) || 1;
      return sum + Math.max(0, qty - 1);
    }, 0);
  };

  const renameTag = (oldTag, newTag) => {
    const trimmed = newTag.trim().toLowerCase();
    if (!trimmed || trimmed === oldTag) return;
    setAllTags(prev => prev.map(t => t === oldTag ? trimmed : t).filter((t, i, a) => a.indexOf(t) === i));
    setCardTags(prev => { const updated = {}; for (const cardId in prev) { updated[cardId] = prev[cardId].map(t => t === oldTag ? trimmed : t); } return updated; });
  };

  const deleteTagGlobally = (tag) => {
    if (!confirm(`Delete tag "${tag}" from all cards?`)) return;
    setAllTags(prev => prev.filter(t => t !== tag));
    setCardTags(prev => { const updated = {}; for (const cardId in prev) { updated[cardId] = prev[cardId].filter(t => t !== tag); } return updated; });
  };

  const cancelSearch = () => { if (abortControllerRef.current) abortControllerRef.current.abort(); setLoading(false); };
  const cancelPriceSearch = () => { if (priceAbortRef.current) priceAbortRef.current.abort(); setSearchingPrices(false); };

  const searchCardsWithAI = async () => {
    const hasQuery = searchQuery.trim() || searchType || searchRarity;
    if (!hasQuery) { setCards(SAMPLE_CARDS); setSearchResults([]); return; }
    cancelSearch();
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError('');
    let timeoutId;
    try {
      const params = buildTcgParams(searchQuery, searchType, searchRarity);
      const url = params.toString() ? `${TCGDEX_API_URL}?${params.toString()}` : TCGDEX_API_URL;
      timeoutId = setTimeout(() => abortControllerRef.current?.abort(), 10000);
      const res = await fetch(url, { signal: abortControllerRef.current.signal });
      if (!res.ok) {
        throw new Error(`Search failed (HTTP ${res.status})`);
      }
      const data = await res.json();
      const formatted = (Array.isArray(data) ? data : data?.data || []).map(formatTcgCard);
      const enriched = await enrichCardsWithDetails(formatted, abortControllerRef.current.signal);
      const finalCards = enriched.length > 0 ? enriched : formatted;
      if (finalCards.length === 0) {
        setError('No cards found. Try different filters.');
      }
      setSearchResults(finalCards);
      setCards(finalCards);
    } catch (e) {
      if (e.name === 'AbortError') {
        setError('Search timed out. Please try again.');
      } else {
        setError(e.message || 'Search failed. Please try again.');
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
    setLoading(false);
  };

  const searchPrices = async (card) => {
    cancelPriceSearch();
    priceAbortRef.current = new AbortController();
    setSearchingPrices(true);
    setPriceResults([]);
    setPriceSummary('');
    try {
      const detail = await fetchJson(`${TCGDEX_API_URL}/${card.id}`, priceAbortRef.current.signal);
      const priceValue = extractUsdPriceFromCard(detail);
      setPriceSummary(formatPrice(priceValue) || 'Price unavailable');
    } catch (e) {
      if (e.name !== 'AbortError') {
        setPriceSummary('Price unavailable');
      }
    }
    setPriceResults([
      { store: 'TCGPlayer', price: 'Shop →', url: `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(card.name)}` },
      { store: 'eBay', price: 'Shop →', url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(card.name + ' pokemon card')}` },
    ]);
    setSearchingPrices(false);
  };

  const resetToSample = () => { setCards(SAMPLE_CARDS); setSearchResults([]); setSearchQuery(''); setSearchType(''); setSearchRarity(''); setError(''); };
  const toggleCollection = (card) => {
    setCollection((prev) => {
      const exists = prev.find((c) => c.id === card.id);
      if (exists) {
        setCardQuantities((quantities) => {
          const next = { ...quantities };
          delete next[card.id];
          return next;
        });
        return prev.filter((c) => c.id !== card.id);
      }
      setCardQuantities((quantities) => ({ ...quantities, [card.id]: quantities[card.id] || 1 }));
      return [...prev, card];
    });
  };
  const toggleWishlist = (card) => { setWishlist(prev => prev.find(c => c.id === card.id) ? prev.filter(c => c.id !== card.id) : [...prev, card]); };
  const isInCollection = (id) => collection.some(c => c.id === id);
  const isInWishlist = (id) => wishlist.some(c => c.id === id);
  const getTypeBg = (type) => ({ Fire: 'bg-orange-700', Water: 'bg-blue-700', Grass: 'bg-green-700', Lightning: 'bg-yellow-600', Psychic: 'bg-purple-700', Fighting: 'bg-red-800', Colorless: 'bg-gray-600', Dark: 'bg-gray-800', Metal: 'bg-slate-600', Dragon: 'bg-indigo-700', Fairy: 'bg-pink-700' }[type] || 'bg-gray-700');
  const getTypeEmoji = (type) => ({ Fire: '🔥', Water: '💧', Grass: '🌿', Lightning: '⚡', Psychic: '🔮', Fighting: '👊', Colorless: '⭐', Dark: '🌙', Metal: '⚙️', Dragon: '🐉', Fairy: '✨' }[type] || '⭐');
  const getFilteredCollection = () => collection.filter(card => {
    const nameMatch = !collectionSearchQuery.trim()
      || card.name?.toLowerCase().includes(collectionSearchQuery.trim().toLowerCase());
    return nameMatch
      && (!collectionTypeFilter || card.types?.includes(collectionTypeFilter))
      && (!collectionRarityFilter || card.rarity === collectionRarityFilter)
      && (!collectionTagFilter || (cardTags[card.id] || []).includes(collectionTagFilter));
  });

  const SelectDropdown = ({ value, onChange, options, placeholder, className = '' }) => (
    <div className={`relative ${className}`}>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full appearance-none px-3 py-2 pr-8 rounded-lg bg-white text-gray-900 border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-sm font-medium">
        <option value="">{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    </div>
  );

  const CardTags = ({ cardId, editable = false }) => (
    <div className="flex flex-wrap gap-1">
      {(cardTags[cardId] || []).map(tag => {
        const color = getTagColor(tag);
        return (
          <span key={tag} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text} border ${color.border}`}>
            {tag}
            {editable && <button onClick={(e) => { e.stopPropagation(); removeTagFromCard(cardId, tag); }} className="hover:opacity-70"><X size={12} /></button>}
          </span>
        );
      })}
    </div>
  );

  const CardGrid = ({ cardList, emptyMsg }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {cardList.length === 0 ? (
        <div className="col-span-full text-center py-12 text-gray-600">{emptyMsg}</div>
      ) : cardList.map(card => {
        const qty = getCardQuantity(card.id);
        const inCollection = isInCollection(card.id);
        return (
          <div key={card.id} className="relative cursor-pointer" onClick={() => { setSelectedCard(card); setPriceResults([]); }}>
            <div className={`${getTypeBg(card.types?.[0])} rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-105 border-2 border-white/20`}>
              <div className="bg-white rounded-lg m-1 aspect-[2.5/3.5] flex flex-col items-center justify-center overflow-hidden">
                {card.image ? <img src={card.image} alt={card.name} className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} /> : null}
                <div className={`text-center p-2 flex-col justify-center items-center ${card.image ? 'hidden' : 'flex'} h-full w-full`}>
                  <div className="text-2xl mb-1">{getTypeEmoji(card.types?.[0])}</div>
                  <div className="text-gray-900 font-bold text-xs leading-tight">{card.name}</div>
                  <div className="text-gray-600 text-xs mt-0.5">{card.set?.name}</div>
                  <div className="text-amber-600 font-semibold text-xs">{card.rarity}</div>
                </div>
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

  const Pagination = ({ currentPage, pageCount, onPageChange }) => {
    if (pageCount <= 1) return null;
    const lastPage = pageCount;
    const visibleCount = Math.min(3, lastPage);
    const pages = [];
    for (let i = 1; i <= visibleCount; i += 1) pages.push(i);
    if (lastPage > visibleCount + 1) pages.push('ellipsis');
    if (lastPage > visibleCount) pages.push(lastPage);
    return (
      <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
        {pages.map((page, index) => (
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-full text-sm font-semibold border-2 transition ${page === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
            >
              {page}
            </button>
          )
        ))}
      </div>
    );
  };

  const CardModal = ({ card, onClose }) => {
    const [localNewTag, setLocalNewTag] = useState('');
    const tags = cardTags[card.id] || [];
    const unusedTags = allTags.filter(t => !tags.includes(t));
    const inCollection = isInCollection(card.id);
    const qty = getCardQuantity(card.id);
    const handleAddTag = (tag) => { addTagToCard(card.id, tag); setLocalNewTag(''); };
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
        <div className="bg-white rounded-2xl max-w-md w-full my-4 shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className={`${getTypeBg(card.types?.[0])} p-4 rounded-t-2xl flex justify-between items-center`}>
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><span className="text-2xl">{getTypeEmoji(card.types?.[0])}</span>{card.name}</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white bg-black/20 rounded-full p-1"><X size={20} /></button>
          </div>
          <div className="p-4 space-y-3">
            {card.image && <div className="flex justify-center"><img src={card.image} alt={card.name} className="w-48 rounded-lg shadow-lg" onError={(e) => { e.target.style.display = 'none'; }} /></div>}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-100 p-2 rounded-lg"><span className="text-gray-500 block text-xs">Set</span><span className="text-gray-900 font-medium">{card.set?.name}</span></div>
              <div className="bg-gray-100 p-2 rounded-lg"><span className="text-gray-500 block text-xs">Number</span><span className="text-gray-900 font-medium">#{card.number}</span></div>
              <div className="bg-gray-100 p-2 rounded-lg"><span className="text-gray-500 block text-xs">Rarity</span><span className="text-gray-900 font-medium">{card.rarity}</span></div>
              <div className="bg-gray-100 p-2 rounded-lg"><span className="text-gray-500 block text-xs">Type</span><span className="text-gray-900 font-medium">{card.types?.join(', ')}</span></div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm mb-2"><Tag size={14} /> Tags</div>
              {tags.length > 0 && <div className="mb-2"><CardTags cardId={card.id} editable={true} /></div>}
              <div className="flex gap-2">
                <input type="text" value={localNewTag} onChange={e => setLocalNewTag(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddTag(localNewTag); }} placeholder="Add new tag..." className="flex-1 px-3 py-1.5 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none text-sm" />
                <button onClick={() => handleAddTag(localNewTag)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"><Plus size={16} /></button>
              </div>
              {unusedTags.length > 0 && <div className="mt-2"><div className="text-xs text-gray-500 mb-1">Quick add:</div><div className="flex flex-wrap gap-1">{unusedTags.slice(0, 6).map(tag => { const color = getTagColor(tag); return <button key={tag} onClick={() => handleAddTag(tag)} className={`px-2 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text} border ${color.border} hover:opacity-80 transition`}>+ {tag}</button>; })}</div></div>}
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
                    <input type="number" value={qty} onChange={e => setCardQuantity(card.id, e.target.value)} className="w-14 text-center py-1 rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:outline-none font-bold text-blue-800" min="1" />
                    <button onClick={() => incrementQuantity(card.id)} className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center justify-center">+</button>
                  </div>
                </div>
              </div>
            )}
            {priceSummary && <div className="text-center text-sm text-gray-700 font-semibold">{priceSummary}</div>}
            {searchingPrices ? <button onClick={cancelPriceSearch} className="w-full py-2 px-4 rounded-lg font-semibold bg-red-600 text-white flex items-center justify-center gap-2 hover:bg-red-700 transition"><StopCircle size={16} /> Stop</button> : <button onClick={() => searchPrices(card)} className="w-full py-2 px-4 rounded-lg font-semibold bg-blue-600 text-white flex items-center justify-center gap-2 hover:bg-blue-700 transition"><ShoppingCart size={16} /> Shop</button>}
            {searchingPrices && <div className="flex items-center justify-center gap-2 py-2 text-blue-600"><Loader2 className="animate-spin" size={20} /><span className="text-sm">Searching...</span></div>}
            {priceResults.length > 0 && <div className="bg-gray-100 p-3 rounded-lg space-y-2"><div className="text-gray-900 font-semibold text-sm">🛒 Where to Buy</div>{priceResults.map((r, i) => <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center bg-white p-2 rounded-lg hover:bg-gray-50 transition text-sm border border-gray-200"><span className="text-gray-900 font-medium">{r.store}</span><span className="flex items-center gap-1 text-green-700 font-bold">{r.price} <ExternalLink size={12} /></span></a>)}</div>}
          </div>
        </div>
      </div>
    );
  };

  if (showLogin) return <LoginScreen onLogin={handleLogin} users={users} />;

  const filteredCollection = getFilteredCollection();
  const browsePageCount = Math.ceil(cards.length / PAGE_SIZE);
  const pagedBrowseCards = cards.slice((browsePage - 1) * PAGE_SIZE, browsePage * PAGE_SIZE);
  const collectionPageCount = Math.ceil(filteredCollection.length / PAGE_SIZE);
  const pagedCollection = filteredCollection.slice((collectionPage - 1) * PAGE_SIZE, collectionPage * PAGE_SIZE);
  const filteredWishlist = wishlist.filter((card) => !wishlistSearchQuery.trim()
    || card.name?.toLowerCase().includes(wishlistSearchQuery.trim().toLowerCase()));
  const wishlistPageCount = Math.ceil(filteredWishlist.length / PAGE_SIZE);
  const pagedWishlist = filteredWishlist.slice((wishlistPage - 1) * PAGE_SIZE, wishlistPage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      <header className="bg-blue-600 p-5 shadow-lg">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={`${currentUser.username} avatar`}
                className="w-7 h-7 rounded-full object-cover border border-white/30"
              />
            ) : (
              <User size={16} className="text-white/80" />
            )}
            <span className="text-white/90 text-xl font-medium">{currentUser?.username}</span>
          </div>
          <h1 className="text-[1.8rem] font-bold text-white flex items-center gap-2">
            <PikachuIcon className="w-12 h-12 text-white" />
            Pokémon Cards
            <SquirtleIcon className="w-12 h-12" />
          </h1>
          <div className="flex items-center gap-2">
            {currentUser?.is_admin && (
              <button
                onClick={() => setShowAdmin(true)}
                className="text-white/80 hover:text-white p-1"
                aria-label="Open admin panel"
                data-testid="open-admin-panel"
              >
                <Shield size={18} />
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-white/80 hover:text-white p-1"
              aria-label="Log out"
              data-testid="logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
        {saveStatus && <div className="text-center text-white/90 text-xs mt-1">{saveStatus}</div>}
      </header>

      <nav className="flex justify-center gap-2 p-3 bg-white shadow flex-wrap">
        {[{ id: 'browse', label: 'Browse', icon: Search }, { id: 'collection', label: `Collection (${collection.length})`, icon: Star }, { id: 'wishlist', label: `Wishlist (${wishlist.length})`, icon: Heart }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`px-4 py-2 rounded-full font-semibold flex items-center gap-2 transition text-sm border-2 ${view === tab.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
            aria-label={`${tab.id} tab`}
            data-testid={`nav-tab-${tab.id}`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </nav>

      <main className="p-3 max-w-5xl mx-auto flex-1 w-full">
        {view === 'browse' && (
          <>
            <div className="space-y-2 mb-4">
              <div className="flex gap-2">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && !loading && searchCardsWithAI()} placeholder="Search by name..." className="flex-1 px-3 py-2 rounded-lg bg-white text-gray-900 border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-sm font-medium placeholder-gray-500" />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 rounded-lg transition text-sm border-2 ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                  aria-label="Toggle filters"
                  data-testid="toggle-filters"
                >
                  <Filter size={18} />
                </button>
                {loading ? (
                  <button
                    onClick={cancelSearch}
                    className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition flex items-center gap-1 text-sm"
                    data-testid="stop-search"
                  >
                    <StopCircle size={16} /> Stop
                  </button>
                ) : (
                  <button
                    onClick={searchCardsWithAI}
                    className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition flex items-center gap-1 text-sm"
                    data-testid="search"
                  >
                    <Search size={16} /> Search
                  </button>
                )}
              </div>
              {showFilters && <div className="flex gap-2 flex-wrap bg-white p-3 rounded-lg border-2 border-gray-200"><SelectDropdown value={searchType} onChange={setSearchType} options={TYPES} placeholder="Any Type" className="flex-1 min-w-28" /><SelectDropdown value={searchRarity} onChange={setSearchRarity} options={RARITIES} placeholder="Any Rarity" className="flex-1 min-w-28" /></div>}
            </div>
            {error && <div className="mb-3 p-2 bg-red-100 border-2 border-red-300 rounded-lg text-red-800 text-sm font-medium">{error}</div>}
            {searchResults.length > 0 && !loading && <button onClick={resetToSample} className="mb-3 px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium border-2 border-gray-300"><RefreshCw size={14} /> Back to Featured</button>}
            {searchResults.length === 0 && !loading && <div className="mb-4 text-2xl font-bold text-gray-800 text-center">Featured set</div>}
            {loading ? <div className="flex flex-col items-center justify-center py-12 gap-2 bg-white rounded-xl"><Loader2 className="animate-spin text-blue-600" size={40} /><p className="text-gray-700 font-medium">Searching...</p></div> : <CardGrid cardList={pagedBrowseCards} emptyMsg="No cards found." />}
            <Pagination currentPage={browsePage} pageCount={browsePageCount} onPageChange={setBrowsePage} />
          </>
        )}
        {view === 'collection' && (
          <>
            {collection.length > 0 && (
              <div className="bg-white border-2 border-green-200 rounded-xl p-3 mb-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <div className="text-green-700 font-bold">📊 Your Collection</div>
                    <div className="text-gray-700 text-sm">
                      Unique cards: <span className="font-bold text-green-700">{collection.length}</span>
                      · Duplicates: <span className="font-bold text-blue-600">{getDuplicateCount()}</span>
                      · Total copies: <span className="font-bold text-blue-600">{getTotalCards()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="text"
                      value={collectionSearchQuery}
                      onChange={(e) => setCollectionSearchQuery(e.target.value)}
                      placeholder="Search by name..."
                      className="flex-1 min-w-40 px-3 py-2 rounded-lg bg-white text-gray-900 border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-sm font-medium placeholder-gray-500"
                    />
                    <SelectDropdown value={collectionTypeFilter} onChange={setCollectionTypeFilter} options={TYPES} placeholder="All Types" className="w-32" />
                    <SelectDropdown value={collectionRarityFilter} onChange={setCollectionRarityFilter} options={RARITIES} placeholder="All Rarities" className="w-32" />
                    {allTags.length > 0 && <SelectDropdown value={collectionTagFilter} onChange={setCollectionTagFilter} options={allTags} placeholder="All Tags" className="w-32" />}
                  </div>
                </div>
                {(collectionTypeFilter || collectionRarityFilter || collectionTagFilter || collectionSearchQuery) && <div className="mt-2 text-sm text-gray-600 border-t pt-2">Showing <span className="font-bold">{filteredCollection.length}</span> of {collection.length} <button onClick={() => { setCollectionTypeFilter(''); setCollectionRarityFilter(''); setCollectionTagFilter(''); setCollectionSearchQuery(''); }} className="ml-2 text-blue-600 font-medium">Clear</button></div>}
              </div>
            )}
            <CardGrid cardList={pagedCollection} emptyMsg={collection.length ? "No cards match filters." : "Your collection is empty!"} />
            <Pagination currentPage={collectionPage} pageCount={collectionPageCount} onPageChange={setCollectionPage} />
          </>
        )}
        {view === 'wishlist' && (
          <>
            {wishlist.length > 0 && (
              <div className="mb-3">
                <input
                  type="text"
                  value={wishlistSearchQuery}
                  onChange={(e) => setWishlistSearchQuery(e.target.value)}
                  placeholder="Search wishlist by name..."
                  className="w-full px-3 py-2 rounded-lg bg-white text-gray-900 border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-sm font-medium placeholder-gray-500"
                />
              </div>
            )}
            <CardGrid cardList={pagedWishlist} emptyMsg="Your wishlist is empty!" />
            <Pagination currentPage={wishlistPage} pageCount={wishlistPageCount} onPageChange={setWishlistPage} />
          </>
        )}
      </main>
      <footer className="mt-auto py-4 text-center text-xs text-white bg-blue-600 flex items-center justify-center">
        <img src={pokeballSvg} alt="" className="w-8 h-8" style={{ filter: 'brightness(0) invert(1)' }} aria-hidden="true" />
      </footer>

      {selectedCard && <CardModal card={selectedCard} onClose={() => { setSelectedCard(null); setPriceResults([]); cancelPriceSearch(); }} />}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} users={users} allTags={allTags} onAddUser={addNewUser} onDeleteUser={deleteUserAccount} onUpdateUser={updateUserAccount} onRenameTag={renameTag} onDeleteTag={deleteTagGlobally} getTagColor={getTagColor} />}
    </div>
  );
}
