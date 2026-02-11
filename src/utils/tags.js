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

export { TAG_COLORS, getTagColor };
