const PAGE_SIZE = 12;

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

export { PAGE_SIZE, TYPES, RARITIES, SAMPLE_CARDS };
