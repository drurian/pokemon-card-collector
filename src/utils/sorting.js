// Sort options for collection view
export const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'rarity-desc', label: 'Rarity (High → Low)' },
  { value: 'rarity-asc', label: 'Rarity (Low → High)' },
  { value: 'set-asc', label: 'Set (A-Z)' },
  { value: 'set-desc', label: 'Set (Z-A)' },
  { value: 'quantity-desc', label: 'Quantity (High → Low)' },
  { value: 'quantity-asc', label: 'Quantity (Low → High)' },
  { value: 'type-asc', label: 'Type (A-Z)' },
];

// Rarity ranking for sorting (higher = rarer)
const RARITY_RANK = {
  'Common': 1,
  'Uncommon': 2,
  'Rare': 3,
  'Rare Holo': 4,
  'V': 5,
  'VMAX': 6,
  'VSTAR': 7,
  'EX': 8,
  'GX': 9,
  'Tag Team GX': 10,
  'Ultra Rare': 11,
  'Shiny': 12,
  'Secret Rare': 13,
};

const getRarityRank = (rarity) => RARITY_RANK[rarity] || 0;

/**
 * Sort a list of cards by the specified sort option
 * @param {Array} cards - Array of card objects
 * @param {string} sortBy - Sort option value (e.g., 'name-asc', 'rarity-desc')
 * @param {Object} cardQuantities - Map of card ID to quantity
 * @returns {Array} Sorted array of cards
 */
export const sortCards = (cards, sortBy, cardQuantities = {}) => {
  if (!sortBy || !cards.length) return cards;

  const [field, direction] = sortBy.split('-');
  const multiplier = direction === 'desc' ? -1 : 1;

  return [...cards].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '');
        break;

      case 'rarity':
        comparison = getRarityRank(a.rarity) - getRarityRank(b.rarity);
        break;

      case 'set':
        comparison = (a.set?.name || '').localeCompare(b.set?.name || '');
        break;

      case 'quantity':
        const qtyA = cardQuantities[a.id] || 1;
        const qtyB = cardQuantities[b.id] || 1;
        comparison = qtyA - qtyB;
        break;

      case 'type':
        const typeA = a.types?.[0] || '';
        const typeB = b.types?.[0] || '';
        comparison = typeA.localeCompare(typeB);
        break;

      default:
        comparison = 0;
    }

    return comparison * multiplier;
  });
};
