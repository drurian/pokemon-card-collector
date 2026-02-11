export default function Pagination({ currentPage, pageCount, onPageChange }) {
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
}
