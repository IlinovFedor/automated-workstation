import { useState, useEffect, useRef, useCallback } from 'react';
import type { TableType } from '@/types';
import { api } from '@/api';

interface SearchSelectProps {
  mode: TableType;
  value: { id: number | null; name: string };
  onChange: (id: number, name: string) => void;
}

export function SearchSelect({ mode, value, onChange }: SearchSelectProps) {
  const [search, setSearch] = useState(value.name);
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value.name);
  }, [value.name]);

  const fetchItems = useCallback(async (pageNum: number, searchTerm: string, append = false) => {
    setLoading(true);
    try {
      let result;
      switch (mode) {
        case 'subgroups':
          result = await api.subgroups.list(pageNum, 20, searchTerm);
          break;
        case 'teachers':
          result = await api.teachers.list(pageNum, 20, searchTerm);
          break;
        case 'locations':
          result = await api.locations.list(pageNum, 20, searchTerm);
          break;
        case 'subjects':
          result = await api.subjects.list(pageNum, 20, searchTerm);
          break;
      }
      
      const newItems = mode === 'subgroups' 
        ? (result as Awaited<ReturnType<typeof api.subgroups.list>>).subgroups
        : mode === 'teachers'
        ? (result as Awaited<ReturnType<typeof api.teachers.list>>).teachers
        : mode === 'locations'
        ? (result as Awaited<ReturnType<typeof api.locations.list>>).locations
        : (result as Awaited<ReturnType<typeof api.subjects.list>>).subjects;

      setItems((prev) => (append ? [...prev, ...newItems] : newItems));
      setHasMore(pageNum < result.pagination.total_pages - 1);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    if (isOpen) {
      setPage(0);
      setItems([]);
      setHasMore(true);
      fetchItems(0, search);
    }
  }, [isOpen, search, fetchItems]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScroll = useCallback(() => {
    if (!listRef.current || loading || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchItems(nextPage, search, true);
    }
  }, [loading, hasMore, page, search, fetchItems]);

  const handleSelect = (id: number, name: string) => {
    setSearch(name);
    onChange(id, name);
    setIsOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Поиск..."
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {isOpen && (
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {items.length === 0 && !loading && (
            <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-center">Ничего не найдено</div>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id, item.name)}
              className="w-full px-3 py-2 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
            >
              {item.name}
            </button>
          ))}
          {loading && (
            <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-center">Загрузка...</div>
          )}
        </div>
      )}
    </div>
  );
}
