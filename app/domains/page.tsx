import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import DomainsTable from './DomainsTable';

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
  const startIndex = skip + 1;
  const endIndex = Math.min(skip + limit, total);

  // Преобразуем даты для клиентского компонента
  const serializedDomains = domains.map((domain: {
    id: number;
    domain: string;
    status: 'created' | 'queued' | 'running' | 'completed' | 'error';
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) => ({
    ...domain,
    createdAt: domain.createdAt,
    updatedAt: domain.updatedAt,
  }));

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

          <DomainsTable
            domains={serializedDomains}
            page={page}
            totalPages={totalPages}
            total={total}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        </div>
      </main>
    </div>
  );
}
