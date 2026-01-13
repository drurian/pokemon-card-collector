import { useEffect, useMemo } from 'react';

export default function usePagedList({ items, page, setPage, pageSize }) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    if (page < 1) setPage(1);
    else if (page > pageCount) setPage(pageCount);
  }, [page, pageCount, setPage]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return { pageCount, pagedItems };
}
