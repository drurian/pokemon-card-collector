import cardBackSvg from '../assets/card-back.svg';

const getCardImageSrc = (card) => card?.image || cardBackSvg;

const handleCardImageError = (event) => {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === 'true') return;
  img.dataset.fallbackApplied = 'true';
  img.src = cardBackSvg;
};

export { getCardImageSrc, handleCardImageError };
