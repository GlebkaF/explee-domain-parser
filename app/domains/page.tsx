import Link from 'next/link';
import { prisma } from '@/lib/prisma';

interface SearchParams {
  page?: string;
}

export default async function DomainsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  // Получаем домены и общее количество параллельно
  const [domains, total] = await Promise.all([
    prisma.domain.findMany({
      skip,
      take: limit,
      orderBy: { id: 'desc' },
    }),
    prisma.domain.count(),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const startIndex = skip + 1;
  const endIndex = Math.min(skip + limit, total);

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
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Всего доменов в базе: <span className="font-semibold">{total}</span>
            </p>
          </div>

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
                        Дата добавления
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {domains.map((domain) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(domain.createdAt).toLocaleString('ru-RU', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
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
                    
                    {page > 3 && (
                      <span className="text-gray-500">...</span>
                    )}

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

                    {page < totalPages - 2 && (
                      <span className="text-gray-500">...</span>
                    )}

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
        </div>
      </main>
    </div>
  );
}

