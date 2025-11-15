'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState<{ success: boolean; message: string; deletedCount?: number } | null>(null);

  const handleClearDatabase = async () => {
    if (!confirm('⚠️ Вы уверены, что хотите удалить ВСЕ домены из базы данных? Это действие необратимо!')) {
      return;
    }

    setClearing(true);
    setClearResult(null);

    try {
      const response = await fetch('/api/domains/clear', {
        method: 'DELETE',
      });

      const data = await response.json();
      setClearResult(data);
    } catch {
      setClearResult({
        success: false,
        message: 'Ошибка при очистке базы данных',
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <main className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🌐 Domain CSV Parser
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Прототип обработки CSV с доменами компаний
          </p>

          <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4 mb-8">
            <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
              ✅ Slice 1 — Импорт CSV готов!
            </h2>
            <p className="text-green-800 dark:text-green-200">
              Загрузите CSV файл с доменами для импорта в базу данных
            </p>
          </div>

          {/* Навигация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link
              href="/upload"
              className="flex items-center justify-between p-6 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors group"
            >
              <div>
                <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📤 Загрузка CSV
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Импортировать домены из CSV файла
                </p>
              </div>
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/domains"
              className="flex items-center justify-between p-6 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-lg transition-colors group"
            >
              <div>
                <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
                  📋 Список доменов
                </h3>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  Просмотр всех доменов с пагинацией
                </p>
              </div>
              <svg className="w-6 h-6 text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Прогресс разработки */}
          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                🚀 Прогресс разработки
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Slice 0:</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">Bootstrap проекта — Prisma, PostgreSQL, Health Check</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Slice 1:</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">Импорт CSV → PostgreSQL</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Slice 2.1:</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">Вывод доменов с пагинацией</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Slice 2.2:</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">Статусы + кнопка запуска агента</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏳</span>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Slice 3:</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">Cron endpoint + stub-agent</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏳</span>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Slice 4:</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">Агент v1 — сбор HTML</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏳</span>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Slice 5:</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">Агент v2 — LLM summary</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏳</span>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Slice 6:</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">UI улучшения</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                💾 Текущая модель данных
              </h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm">
{`enum DomainStatus {
  created
  queued
  running
  completed
  error
}

model Domain {
  id           Int          @id @default(autoincrement())
  domain       String       @unique
  status       DomainStatus @default(created)
  errorMessage String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}`}
              </pre>
            </section>
          </div>

          {/* Health Check & Database Management */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              🔧 Управление базой данных
            </h2>
            
            <div className="flex flex-wrap gap-4 mb-4">
              <a
                href="/api/health/db"
                target="_blank"
                className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                🔍 Проверить подключение к БД
              </a>
              
              <button
                onClick={handleClearDatabase}
                disabled={clearing}
                className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {clearing ? '⏳ Очистка...' : '🗑️ Очистить БД'}
              </button>
            </div>

            {clearResult && (
              <div className={`mt-4 p-4 rounded-lg ${
                clearResult.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <p className={clearResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                  {clearResult.success ? '✅' : '❌'} {clearResult.message}
                  {clearResult.deletedCount !== undefined && ` (удалено доменов: ${clearResult.deletedCount})`}
                </p>
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              ⚠️ Очистка БД удалит все домены без возможности восстановления
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
