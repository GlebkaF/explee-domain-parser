'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DomainsTable from './DomainsTable';

interface Domain {
  id: number;
  domain: string;
  status: 'created' | 'queued' | 'running' | 'completed' | 'error';
  errorMessage: string | null;
  companyDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function DomainsContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  
  const [data, setData] = useState<{
    domains: Domain[];
    total: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);

  // Функция загрузки данных
  const loadData = async () => {
    try {
      const response = await fetch(`/api/domains/list?page=${page}`);
      const result = await response.json();
      
      if (result.success) {
        setData({
          domains: result.domains,
          total: result.total,
          totalPages: result.totalPages,
          startIndex: result.startIndex,
          endIndex: result.endIndex,
        });
      }
    } catch (error) {
      console.error('Error loading domains:', error);
    } finally {
      setLoading(false);
    }
  };

  // Начальная загрузка и поллинг
  useEffect(() => {
    // Начальная загрузка
    setLoading(true);
    loadData();

    // Поллинг каждые 3 секунды
    const interval = setInterval(() => {
      loadData();
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <main className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-block"
            >
              ← Назад на главную
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              📋 Список доменов
            </h1>
            {data && (
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Всего доменов в базе: <span className="font-semibold">{data.total}</span>
              </p>
            )}
          </div>

          {loading && !data ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка...</p>
            </div>
          ) : data ? (
            <DomainsTable
              domains={data.domains}
              page={page}
              totalPages={data.totalPages}
              total={data.total}
              startIndex={data.startIndex}
              endIndex={data.endIndex}
            />
          ) : (
            <div className="text-center py-12 text-red-600">
              Ошибка загрузки данных
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DomainsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <main className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка...</p>
            </div>
          </div>
        </main>
      </div>
    }>
      <DomainsContent />
    </Suspense>
  );
}
