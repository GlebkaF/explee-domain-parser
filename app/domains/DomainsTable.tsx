'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Domain {
  id: number;
  domain: string;
  status: 'created' | 'queued' | 'running' | 'completed' | 'error';
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DomainsTableProps {
  domains: Domain[];
  page: number;
  totalPages: number;
  total: number;
  startIndex: number;
  endIndex: number;
}

const STATUS_CONFIG = {
  created: {
    label: 'Создан',
    icon: '⚪',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  },
  queued: {
    label: 'В очереди',
    icon: '📋',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  running: {
    label: 'Выполняется',
    icon: '⚙️',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 animate-pulse',
  },
  completed: {
    label: 'Завершен',
    icon: '✅',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  error: {
    label: 'Ошибка',
    icon: '❌',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
};

export default function DomainsTable({
  domains,
  page,
  totalPages,
  total,
  startIndex,
  endIndex,
}: DomainsTableProps) {
  const [loadingDomains, setLoadingDomains] = useState<Set<number>>(new Set());

  const handleRunAgent = async (domainId: number) => {
    setLoadingDomains(prev => new Set(prev).add(domainId));

    try {
      const response = await fetch(`/api/domains/${domainId}/run-agent`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.error || 'Ошибка при запуске агента');
      }
    } catch (error) {
      console.error('Error running agent:', error);
      alert('Ошибка при запуске агента');
    } finally {
      setLoadingDomains(prev => {
        const newSet = new Set(prev);
        newSet.delete(domainId);
        return newSet;
      });
    }
  };

  const handleRestart = async (domainId: number) => {
    setLoadingDomains(prev => new Set(prev).add(domainId));

    try {
      const response = await fetch(`/api/domains/${domainId}/restart`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.error || 'Ошибка при перезапуске');
      }
    } catch (error) {
      console.error('Error restarting:', error);
      alert('Ошибка при перезапуске');
    } finally {
      setLoadingDomains(prev => {
        const newSet = new Set(prev);
        newSet.delete(domainId);
        return newSet;
      });
    }
  };

  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;

  return (
    <>
      {/* Статистика */}
      {total > 0 && (
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Показано {startIndex}-{endIndex} из {total}
        </div>
      )}

      {/* Таблица */}
      {total === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Нет доменов
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Загрузите CSV файл с доменами для начала работы
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            📤 Загрузить CSV
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Домен
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Дата создания
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {domains.map((domain) => {
                  const statusConfig = STATUS_CONFIG[domain.status] || STATUS_CONFIG.created;
                  const isLoading = loadingDomains.has(domain.id);
                  const canRunAgent = domain.status === 'created';

                  return (
                    <tr
                      key={domain.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {domain.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                        <a
                          href={`https://${domain.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {domain.domain}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}>
                          <span className="mr-1">{statusConfig.icon}</span>
                          {statusConfig.label}
                        </span>
                        {domain.errorMessage && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {domain.errorMessage}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(domain.createdAt).toLocaleString('ru-RU', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {domain.status === 'running' || domain.status === 'error' ? (
                          <button
                            onClick={() => handleRestart(domain.id)}
                            disabled={isLoading}
                            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
                          >
                            {isLoading ? '⏳ Перезапуск...' : '🔄 Перезапустить'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRunAgent(domain.id)}
                            disabled={!canRunAgent || isLoading}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
                          >
                            {isLoading ? '⏳ Запуск...' : '🚀 Run Agent'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center gap-2">
                {hasPrevPage ? (
                  <Link
                    href={`/domains?page=${page - 1}`}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    ← Назад
                  </Link>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2 text-sm font-medium text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-not-allowed"
                  >
                    ← Назад
                  </button>
                )}

                {hasNextPage ? (
                  <Link
                    href={`/domains?page=${page + 1}`}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Вперед →
                  </Link>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2 text-sm font-medium text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-not-allowed"
                  >
                    Вперед →
                  </button>
                )}
              </div>

              <div className="text-sm text-gray-700 dark:text-gray-300">
                Страница{' '}
                <span className="font-semibold">
                  {page} из {totalPages}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {page > 2 && (
                  <Link
                    href="/domains?page=1"
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    1
                  </Link>
                )}

                {page > 3 && <span className="text-gray-500">...</span>}

                {page > 1 && (
                  <Link
                    href={`/domains?page=${page - 1}`}
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {page - 1}
                  </Link>
                )}

                <span className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg">
                  {page}
                </span>

                {page < totalPages && (
                  <Link
                    href={`/domains?page=${page + 1}`}
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {page + 1}
                  </Link>
                )}

                {page < totalPages - 2 && <span className="text-gray-500">...</span>}

                {page < totalPages - 1 && (
                  <Link
                    href={`/domains?page=${totalPages}`}
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {totalPages}
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

