import { useState, useRef, useEffect } from 'react';
import { Search, Star, ShoppingCart, Heart, X, Sparkles, Loader2, ExternalLink, RefreshCw, StopCircle, Filter, ChevronDown, Tag, Plus, LogOut, Shield, User } from 'lucide-react';
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

const SESSION_STORAGE_KEY = 'pokemon-collector-session';

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

const supabase = {
  async getUsers() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pokemon_users?select=*`, {
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
  async deleteUser(username) {
    await fetch(`${SUPABASE_URL}/rest/v1/pokemon_users?username=eq.${username}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    await fetch(`${SUPABASE_URL}/rest/v1/pokemon_collections?user_id=eq.${username}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
  },
  async loadData(userId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pokemon_collections?user_id=eq.${userId}&select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const data = await res.json();
    return data[0] || null;
  },
  async saveData(userId, collection, wishlist, cardTags, cardQuantities, allTags) {
    const body = { user_id: userId, collection, wishlist, card_tags: cardTags, card_quantities: cardQuantities, all_tags: allTags, updated_at: new Date().toISOString() };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pokemon_collections?user_id=eq.${userId}`, {
      method: 'GET',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const existing = await res.json();
    const method = existing.length > 0 ? 'PATCH' : 'POST';
    const url = existing.length > 0 ? `${SUPABASE_URL}/rest/v1/pokemon_collections?user_id=eq.${userId}` : `${SUPABASE_URL}/rest/v1/pokemon_collections`;
    await fetch(url, { method, headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }, body: JSON.stringify(body) });
  }
};

export default function PokemonCardTracker() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [showLogin, setShowLogin] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

  const [view, setView] = useState('browse');
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
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [cloudConnected, setCloudConnected] = useState(false);

  const [searchType, setSearchType] = useState('');
  const [searchRarity, setSearchRarity] = useState('');
  const [collectionTypeFilter, setCollectionTypeFilter] = useState('');
  const [collectionRarityFilter, setCollectionRarityFilter] = useState('');
  const [collectionTagFilter, setCollectionTagFilter] = useState('');
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

  const loadUsers = async () => {
    if (!SUPABASE_KEY || SUPABASE_KEY.includes('your-publishable-key')) {
      const hashedPw = await hashPassword(DEFAULT_ADMIN.password);
      setUsers([{ username: DEFAULT_ADMIN.username, password: hashedPw, is_admin: true }]);
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
        setUsers(refreshedData || [{ username: DEFAULT_ADMIN.username, password: hashedPw, is_admin: true }]);
      } else {
        const hashedPw = await hashPassword(DEFAULT_ADMIN.password);
        const adminUser = data.find((user) => user.username === DEFAULT_ADMIN.username);
        if (adminUser && LEGACY_DEFAULT_ADMIN_HASHES.includes(adminUser.password) && adminUser.password !== hashedPw) {
          try {
            await supabase.updateUserPassword(DEFAULT_ADMIN.username, hashedPw);
            const updatedUsers = data.map((user) => (
              user.username === DEFAULT_ADMIN.username ? { ...user, password: hashedPw } : user
            ));
            setUsers(updatedUsers);
          } catch (updateErr) {
            console.log('Failed to update admin password hash:', updateErr);
            setUsers(data);
          }
        } else {
          setUsers(data);
        }
      }
      setCloudConnected(true);
    } catch (e) {
      console.error('Failed to load users:', e);
      const hashedPw = await hashPassword(DEFAULT_ADMIN.password);
      setUsers([{ username: DEFAULT_ADMIN.username, password: hashedPw, is_admin: true }]);
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
      if (data) { setCollection(data.collection || []); setWishlist(data.wishlist || []); setCardTags(data.card_tags || {}); setCardQuantities(data.card_quantities || {}); setAllTags(data.all_tags || []); }
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

  const addTagToCard = (cardId, tag) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) return;
    setCardTags(prev => { const current = prev[cardId] || []; if (current.includes(trimmed)) return prev; return { ...prev, [cardId]: [...current, trimmed] }; });
    setAllTags(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
  };

  const removeTagFromCard = (cardId, tag) => { setCardTags(prev => ({ ...prev, [cardId]: (prev[cardId] || []).filter(t => t !== tag) })); };

  const getCardQuantity = (cardId) => cardQuantities[cardId] || 1;

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
    return collection.reduce((sum, card) => sum + (cardQuantities[card.id] || 1), 0);
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
    setLoading(true); setError('');
    let searchDesc = [];
    if (searchQuery.trim()) searchDesc.push(`named "${searchQuery}"`);
    if (searchType) searchDesc.push(`${searchType} type`);
    if (searchRarity) searchDesc.push(`${searchRarity} rarity`);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1500, tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: `Search for Pokemon TCG cards that are ${searchDesc.join(' and ')}. Find 8-10 different real cards matching ALL criteria.\n\nFor each card, include the image URL from pokemontcg.io (format: https://images.pokemontcg.io/SETID/CARDNUMBER_hires.png).\n\nReturn ONLY a JSON array:\n[{"name":"Card Name","set":"Set Name","number":"123","rarity":"Rare Holo","type":"Fire","image":"https://images.pokemontcg.io/base1/4_hires.png"}]` }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(i => i.text || '').join('\n') || '';
      const match = text.replace(/```json|```/g, '').trim().match(/\[[\s\S]*?\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const formatted = parsed.map((c, i) => ({ id: `search-${i}-${Date.now()}`, name: c.name, set: { name: c.set }, number: c.number, rarity: c.rarity, types: [c.type], image: c.image || null }));
        setSearchResults(formatted); setCards(formatted);
      } else setError('Could not find cards. Try different filters.');
    } catch (e) { if (e.name !== 'AbortError') setError('Search failed. Please try again.'); }
    setLoading(false);
  };

  const searchPrices = async (card) => {
    cancelPriceSearch();
    priceAbortRef.current = new AbortController();
    setSearchingPrices(true); setPriceResults([]);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: priceAbortRef.current.signal,
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1500, tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: `Search for prices to buy Pokemon card "${card.name}" from "${card.set?.name}". Return ONLY JSON array:\n[{"store":"TCGPlayer","price":"$45.99","url":"https://tcgplayer.com"}]` }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(i => i.text || '').join('\n') || '';
      const match = text.replace(/```json|```/g, '').trim().match(/\[[\s\S]*?\]/);
      if (match) setPriceResults(JSON.parse(match[0])); else throw new Error('No results');
    } catch (e) {
      if (e.name !== 'AbortError') {
        setPriceResults([
          { store: 'TCGPlayer', price: 'Search →', url: `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(card.name)}` },
          { store: 'eBay', price: 'Search →', url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(card.name + ' pokemon card')}` },
        ]);
      }
    }
    setSearchingPrices(false);
  };

  const resetToSample = () => { setCards(SAMPLE_CARDS); setSearchResults([]); setSearchQuery(''); setSearchType(''); setSearchRarity(''); setError(''); };
  const toggleCollection = (card) => { setCollection(prev => prev.find(c => c.id === card.id) ? prev.filter(c => c.id !== card.id) : [...prev, card]); };
  const toggleWishlist = (card) => { setWishlist(prev => prev.find(c => c.id === card.id) ? prev.filter(c => c.id !== card.id) : [...prev, card]); };
  const isInCollection = (id) => collection.some(c => c.id === id);
  const isInWishlist = (id) => wishlist.some(c => c.id === id);
  const getTypeBg = (type) => ({ Fire: 'bg-orange-700', Water: 'bg-blue-700', Grass: 'bg-green-700', Lightning: 'bg-yellow-600', Psychic: 'bg-purple-700', Fighting: 'bg-red-800', Colorless: 'bg-gray-600', Dark: 'bg-gray-800', Metal: 'bg-slate-600', Dragon: 'bg-indigo-700', Fairy: 'bg-pink-700' }[type] || 'bg-gray-700');
  const getTypeEmoji = (type) => ({ Fire: '🔥', Water: '💧', Grass: '🌿', Lightning: '⚡', Psychic: '🔮', Fighting: '👊', Colorless: '⭐', Dark: '🌙', Metal: '⚙️', Dragon: '🐉', Fairy: '✨' }[type] || '⭐');
  const getFilteredCollection = () => collection.filter(card => (!collectionTypeFilter || card.types?.includes(collectionTypeFilter)) && (!collectionRarityFilter || card.rarity === collectionRarityFilter) && (!collectionTagFilter || (cardTags[card.id] || []).includes(collectionTagFilter)));

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
            {searchingPrices ? <button onClick={cancelPriceSearch} className="w-full py-2 px-4 rounded-lg font-semibold bg-red-600 text-white flex items-center justify-center gap-2 hover:bg-red-700 transition"><StopCircle size={16} /> Stop</button> : <button onClick={() => searchPrices(card)} className="w-full py-2 px-4 rounded-lg font-semibold bg-blue-600 text-white flex items-center justify-center gap-2 hover:bg-blue-700 transition"><ShoppingCart size={16} /> Find Prices</button>}
            {searchingPrices && <div className="flex items-center justify-center gap-2 py-2 text-blue-600"><Loader2 className="animate-spin" size={20} /><span className="text-sm">Searching...</span></div>}
            {priceResults.length > 0 && <div className="bg-gray-100 p-3 rounded-lg space-y-2"><div className="text-gray-900 font-semibold text-sm">🛒 Where to Buy</div>{priceResults.map((r, i) => <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center bg-white p-2 rounded-lg hover:bg-gray-50 transition text-sm border border-gray-200"><span className="text-gray-900 font-medium">{r.store}</span><span className="flex items-center gap-1 text-green-700 font-bold">{r.price} <ExternalLink size={12} /></span></a>)}</div>}
          </div>
        </div>
      </div>
    );
  };

  if (showLogin) return <LoginScreen onLogin={handleLogin} users={users} />;

  const filteredCollection = getFilteredCollection();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 p-3 shadow-lg">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-2"><User size={16} className="text-white/80" /><span className="text-white/90 text-sm font-medium">{currentUser?.username}</span></div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles size={18} /> Pokémon Cards <Sparkles size={18} /></h1>
          <div className="flex items-center gap-2">
            {currentUser?.is_admin && <button onClick={() => setShowAdmin(true)} className="text-white/80 hover:text-white p-1"><Shield size={18} /></button>}
            <button onClick={handleLogout} className="text-white/80 hover:text-white p-1"><LogOut size={18} /></button>
          </div>
        </div>
        {saveStatus && <div className="text-center text-white/90 text-xs mt-1">{saveStatus}</div>}
      </header>

      <nav className="flex justify-center gap-2 p-3 bg-white shadow flex-wrap">
        {[{ id: 'browse', label: 'Browse', icon: Search }, { id: 'collection', label: `Collection (${collection.length})`, icon: Star }, { id: 'wishlist', label: `Wishlist (${wishlist.length})`, icon: Heart }].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} className={`px-4 py-2 rounded-full font-semibold flex items-center gap-2 transition text-sm border-2 ${view === tab.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}><tab.icon size={14} /> {tab.label}</button>
        ))}
      </nav>

      <main className="p-3 max-w-5xl mx-auto">
        {view === 'browse' && (
          <>
            <div className="space-y-2 mb-4">
              <div className="flex gap-2">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && !loading && searchCardsWithAI()} placeholder="Search by name..." className="flex-1 px-3 py-2 rounded-lg bg-white text-gray-900 border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-sm font-medium placeholder-gray-500" />
                <button onClick={() => setShowFilters(!showFilters)} className={`px-3 py-2 rounded-lg transition text-sm border-2 ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}><Filter size={18} /></button>
                {loading ? <button onClick={cancelSearch} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition flex items-center gap-1 text-sm"><StopCircle size={16} /> Stop</button> : <button onClick={searchCardsWithAI} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition flex items-center gap-1 text-sm"><Search size={16} /> Search</button>}
              </div>
              {showFilters && <div className="flex gap-2 flex-wrap bg-white p-3 rounded-lg border-2 border-gray-200"><SelectDropdown value={searchType} onChange={setSearchType} options={TYPES} placeholder="Any Type" className="flex-1 min-w-28" /><SelectDropdown value={searchRarity} onChange={setSearchRarity} options={RARITIES} placeholder="Any Rarity" className="flex-1 min-w-28" /></div>}
            </div>
            {error && <div className="mb-3 p-2 bg-red-100 border-2 border-red-300 rounded-lg text-red-800 text-sm font-medium">{error}</div>}
            {searchResults.length > 0 && !loading && <button onClick={resetToSample} className="mb-3 px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium border-2 border-gray-300"><RefreshCw size={14} /> Back to Featured</button>}
            {loading ? <div className="flex flex-col items-center justify-center py-12 gap-2 bg-white rounded-xl"><Loader2 className="animate-spin text-blue-600" size={40} /><p className="text-gray-700 font-medium">Searching...</p></div> : <CardGrid cardList={cards} emptyMsg="No cards found." />}
          </>
        )}
        {view === 'collection' && (
          <>
            {collection.length > 0 && (
              <div className="bg-white border-2 border-green-200 rounded-xl p-3 mb-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div><div className="text-green-700 font-bold">📊 Your Collection</div><div className="text-gray-700 text-sm">Unique cards: <span className="font-bold text-green-700">{collection.length}</span> · Total with duplicates: <span className="font-bold text-blue-600">{getTotalCards()}</span></div></div>
                  <div className="flex gap-2 flex-wrap">
                    <SelectDropdown value={collectionTypeFilter} onChange={setCollectionTypeFilter} options={TYPES} placeholder="All Types" className="w-32" />
                    <SelectDropdown value={collectionRarityFilter} onChange={setCollectionRarityFilter} options={RARITIES} placeholder="All Rarities" className="w-32" />
                    {allTags.length > 0 && <SelectDropdown value={collectionTagFilter} onChange={setCollectionTagFilter} options={allTags} placeholder="All Tags" className="w-32" />}
                  </div>
                </div>
                {(collectionTypeFilter || collectionRarityFilter || collectionTagFilter) && <div className="mt-2 text-sm text-gray-600 border-t pt-2">Showing <span className="font-bold">{filteredCollection.length}</span> of {collection.length} <button onClick={() => { setCollectionTypeFilter(''); setCollectionRarityFilter(''); setCollectionTagFilter(''); }} className="ml-2 text-blue-600 font-medium">Clear</button></div>}
              </div>
            )}
            <CardGrid cardList={filteredCollection} emptyMsg={collection.length ? "No cards match filters." : "Your collection is empty!"} />
          </>
        )}
        {view === 'wishlist' && <CardGrid cardList={wishlist} emptyMsg="Your wishlist is empty!" />}
      </main>

      {selectedCard && <CardModal card={selectedCard} onClose={() => { setSelectedCard(null); setPriceResults([]); cancelPriceSearch(); }} />}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} users={users} allTags={allTags} onAddUser={addNewUser} onDeleteUser={deleteUserAccount} onRenameTag={renameTag} onDeleteTag={deleteTagGlobally} getTagColor={getTagColor} />}
    </div>
  );
}
