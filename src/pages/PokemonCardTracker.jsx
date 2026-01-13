import { useState } from 'react';
import { Filter, Heart, Loader2, LogOut, RefreshCw, Search, Shield, Star, StopCircle, User } from 'lucide-react';
import pokeballSvg from '../assets/pokeball.svg';
import { AdminPanel, CardGrid, CardModal, LoginScreen, Pagination, PikachuIcon, SelectDropdown, SquirtleIcon } from '../components';
import { PAGE_SIZE, RARITIES, TYPES } from '../constants/cards';
import { getTypeBg, getTypeEmoji } from '../utils/cardsUi';
import { getTagColor } from '../utils/tags';
import { useAuthUsers, useCards, useCollectionData, useFilteredCollection, useFilteredWishlist, usePagedList, usePricing } from '../hooks';

export default function PokemonCardTracker() {
  const [view, setView] = useState('browse');
  const [browsePage, setBrowsePage] = useState(1);
  const [collectionPage, setCollectionPage] = useState(1);
  const [wishlistPage, setWishlistPage] = useState(1);
  const [selectedCard, setSelectedCard] = useState(null);
  const [collectionTypeFilter, setCollectionTypeFilter] = useState('');
  const [collectionRarityFilter, setCollectionRarityFilter] = useState('');
  const [collectionTagFilter, setCollectionTagFilter] = useState('');
  const [collectionSearchQuery, setCollectionSearchQuery] = useState('');
  const [wishlistSearchQuery, setWishlistSearchQuery] = useState('');

  const {
    currentUser,
    users,
    showLogin,
    showAdmin,
    cloudConnected,
    setShowAdmin,
    handleLogin,
    handleLogout,
    addNewUser,
    deleteUserAccount,
    updateUserAccount
  } = useAuthUsers();

  const {
    cards,
    loading,
    error,
    searchResults,
    searchQuery,
    searchType,
    searchRarity,
    showFilters,
    setShowFilters,
    setSearchQuery,
    setSearchType,
    setSearchRarity,
    searchCards,
    resetToSample,
    cancelSearch
  } = useCards();

  const {
    collection,
    wishlist,
    cardTags,
    allTags,
    saveStatus,
    addTagToCard,
    removeTagFromCard,
    getCardQuantity,
    setCardQuantity,
    incrementQuantity,
    decrementQuantity,
    getTotalCards,
    getDuplicateCount,
    renameTag,
    deleteTagGlobally,
    toggleCollection,
    toggleWishlist,
    isInCollection,
    isInWishlist
  } = useCollectionData({ currentUser, cloudConnected });

  const {
    priceResults,
    searchingPrices,
    priceSummary,
    searchPrices,
    cancelPriceSearch,
    clearPricing
  } = usePricing();

  const handleSelectCard = (card) => {
    setSelectedCard(card);
    clearPricing();
  };

  const { filteredCollection } = useFilteredCollection({
    collection,
    cardTags,
    collectionTypeFilter,
    collectionRarityFilter,
    collectionTagFilter,
    collectionSearchQuery,
    onResetPage: () => setCollectionPage(1)
  });
  const { filteredWishlist } = useFilteredWishlist({
    wishlist,
    wishlistSearchQuery,
    onResetPage: () => setWishlistPage(1)
  });
  const { pageCount: browsePageCount, pagedItems: pagedBrowseCards } = usePagedList({
    items: cards,
    page: browsePage,
    setPage: setBrowsePage,
    pageSize: PAGE_SIZE
  });
  const { pageCount: collectionPageCount, pagedItems: pagedCollection } = usePagedList({
    items: filteredCollection,
    page: collectionPage,
    setPage: setCollectionPage,
    pageSize: PAGE_SIZE
  });
  const { pageCount: wishlistPageCount, pagedItems: pagedWishlist } = usePagedList({
    items: filteredWishlist,
    page: wishlistPage,
    setPage: setWishlistPage,
    pageSize: PAGE_SIZE
  });

  if (showLogin) return <LoginScreen onLogin={handleLogin} users={users} />;

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
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && !loading && searchCards()} placeholder="Search by name..." className="flex-1 px-3 py-2 rounded-lg bg-white text-gray-900 border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-sm font-medium placeholder-gray-500" />
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
                    onClick={searchCards}
                    className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition flex items-center gap-1 text-sm"
                    data-testid="search"
                  >
                    <Search size={16} /> Search
                  </button>
                )}
              </div>
              {showFilters && <div className="flex gap-2 flex-wrap bg-white p-3 rounded-lg border-2 border-gray-200"><SelectDropdown value={searchType} onChange={(event) => setSearchType(event.target.value)} options={TYPES} placeholder="Any Type" className="flex-1 min-w-28" /><SelectDropdown value={searchRarity} onChange={(event) => setSearchRarity(event.target.value)} options={RARITIES} placeholder="Any Rarity" className="flex-1 min-w-28" /></div>}
            </div>
            {error && <div className="mb-3 p-2 bg-red-100 border-2 border-red-300 rounded-lg text-red-800 text-sm font-medium">{error}</div>}
            {searchResults.length > 0 && !loading && <button onClick={resetToSample} className="mb-3 px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium border-2 border-gray-300"><RefreshCw size={14} /> Back to Featured</button>}
            {searchResults.length === 0 && !loading && <div className="mb-4 text-2xl font-bold text-gray-800 text-center">Featured set</div>}
            {loading ? <div className="flex flex-col items-center justify-center py-12 gap-2 bg-white rounded-xl"><Loader2 className="animate-spin text-blue-600" size={40} /><p className="text-gray-700 font-medium">Searching...</p></div> : <CardGrid cardList={pagedBrowseCards} emptyMsg="No cards found." onSelect={handleSelectCard} getTypeBg={getTypeBg} getTypeEmoji={getTypeEmoji} getCardQuantity={getCardQuantity} isInCollection={isInCollection} isInWishlist={isInWishlist} />}
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
                    <SelectDropdown value={collectionTypeFilter} onChange={(event) => setCollectionTypeFilter(event.target.value)} options={TYPES} placeholder="All Types" className="w-32" />
                    <SelectDropdown value={collectionRarityFilter} onChange={(event) => setCollectionRarityFilter(event.target.value)} options={RARITIES} placeholder="All Rarities" className="w-32" />
                    {allTags.length > 0 && <SelectDropdown value={collectionTagFilter} onChange={(event) => setCollectionTagFilter(event.target.value)} options={allTags} placeholder="All Tags" className="w-32" />}
                  </div>
                </div>
                {(collectionTypeFilter || collectionRarityFilter || collectionTagFilter || collectionSearchQuery) && <div className="mt-2 text-sm text-gray-600 border-t pt-2">Showing <span className="font-bold">{filteredCollection.length}</span> of {collection.length} <button onClick={() => { setCollectionTypeFilter(''); setCollectionRarityFilter(''); setCollectionTagFilter(''); setCollectionSearchQuery(''); }} className="ml-2 text-blue-600 font-medium">Clear</button></div>}
              </div>
            )}
            <CardGrid cardList={pagedCollection} emptyMsg={collection.length ? "No cards match filters." : "Your collection is empty!"} onSelect={handleSelectCard} getTypeBg={getTypeBg} getTypeEmoji={getTypeEmoji} getCardQuantity={getCardQuantity} isInCollection={isInCollection} isInWishlist={isInWishlist} />
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
            <CardGrid cardList={pagedWishlist} emptyMsg="Your wishlist is empty!" onSelect={handleSelectCard} getTypeBg={getTypeBg} getTypeEmoji={getTypeEmoji} getCardQuantity={getCardQuantity} isInCollection={isInCollection} isInWishlist={isInWishlist} />
            <Pagination currentPage={wishlistPage} pageCount={wishlistPageCount} onPageChange={setWishlistPage} />
          </>
        )}
      </main>
      <footer className="mt-auto py-4 text-center text-xs text-white bg-blue-600 flex items-center justify-center">
        <img src={pokeballSvg} alt="" className="w-8 h-8" style={{ filter: 'brightness(0) invert(1)' }} aria-hidden="true" />
      </footer>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => { setSelectedCard(null); clearPricing(); cancelPriceSearch(); }}
          tags={cardTags[selectedCard.id] || []}
          allTags={allTags}
          getTagColor={getTagColor}
          onAddTag={addTagToCard}
          onRemoveTag={removeTagFromCard}
          isInCollection={isInCollection}
          isInWishlist={isInWishlist}
          getCardQuantity={getCardQuantity}
          setCardQuantity={setCardQuantity}
          incrementQuantity={incrementQuantity}
          decrementQuantity={decrementQuantity}
          toggleCollection={toggleCollection}
          toggleWishlist={toggleWishlist}
          getTypeBg={getTypeBg}
          getTypeEmoji={getTypeEmoji}
          priceSummary={priceSummary}
          searchingPrices={searchingPrices}
          priceResults={priceResults}
          searchPrices={searchPrices}
          cancelPriceSearch={cancelPriceSearch}
        />
      )}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} users={users} allTags={allTags} onAddUser={addNewUser} onDeleteUser={deleteUserAccount} onUpdateUser={updateUserAccount} onRenameTag={renameTag} onDeleteTag={deleteTagGlobally} getTagColor={getTagColor} />}
    </div>
  );
}
