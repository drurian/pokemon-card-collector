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

export { normalizeQuantities, ensureQuantitiesForCollection, dedupeById };
