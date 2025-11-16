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
      // Поллинг без лоадера, чтобы не мешать пользователю
      loadData();
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Обработчик запуска агента
  const handleRunAgent = async (domainId: number) => {
    // Оптимистичное обновление статуса
    setData(prevData => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        domains: prevData.domains.map(domain =>
          domain.id === domainId
            ? { ...domain, status: 'queued' as const }
            : domain
        ),
      };
    });

    try {
      const response = await fetch(`/api/domains/${domainId}/run-agent`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.error || 'Ошибка при запуске агента');
        // Откатываем оптимистичное обновление при ошибке
        await loadData();
      }
    } catch (error) {
      console.error('Error running agent:', error);
      alert('Ошибка при запуске агента');
      // Откатываем оптимистичное обновление при ошибке
      await loadData();
    }
  };

  // Обработчик перезапуска
  const handleRestart = async (domainId: number) => {
    // Оптимистичное обновление статуса
    setData(prevData => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        domains: prevData.domains.map(domain =>
          domain.id === domainId
            ? { ...domain, status: 'queued' as const }
            : domain
        ),
      };
    });

    try {
      const response = await fetch(`/api/domains/${domainId}/restart`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.error || 'Ошибка при перезапуске');
        // Откатываем оптимистичное обновление при ошибке
        await loadData();
      }
    } catch (error) {
      console.error('Error restarting:', error);
      alert('Ошибка при перезапуске');
      // Откатываем оптимистичное обновление при ошибке
      await loadData();
    }
  };

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
            <div className="relative">
              {/* Overlay лоадер при переключении страниц */}
              {loading && (
                <div className="absolute inset-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Загрузка страницы...</p>
                  </div>
                </div>
              )}
              <DomainsTable
                domains={data.domains}
                page={page}
                totalPages={data.totalPages}
                total={data.total}
                startIndex={data.startIndex}
                endIndex={data.endIndex}
                onRunAgent={handleRunAgent}
                onRestart={handleRestart}
              />
            </div>
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
