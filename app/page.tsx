export default function Home() {
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

          <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
              ✅ Slice 0 — Bootstrap завершен!
            </h2>
            <p className="text-blue-800 dark:text-blue-200">
              Инфраструктура настроена: Prisma, PostgreSQL, Health Check
            </p>
          </div>

          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                📋 Инструкции по настройке
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Создайте PostgreSQL базу данных на <a href="https://neon.tech" target="_blank" rel="noopener" className="text-blue-600 hover:underline">Neon.tech</a></li>
                <li>Скопируйте <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">env.example</code> в <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">.env</code></li>
                <li>Вставьте ваш <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">DATABASE_URL</code> из Neon</li>
                <li>Выполните миграцию: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">npx prisma migrate dev --name init</code></li>
                <li>Запустите сервер: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">npm run dev</code></li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                🔍 Проверка работоспособности
              </h2>
              <a
                href="/api/health/db"
                target="_blank"
                className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Проверить подключение к БД
              </a>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Эндпоинт должен вернуть статус подключения и количество доменов
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                📦 Что дальше?
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Slice 1:</strong> Импорт CSV → PostgreSQL</li>
                <li><strong>Slice 2:</strong> Пагинация + статусы + кнопка запуска агента</li>
                <li><strong>Slice 3:</strong> Cron endpoint + stub-agent</li>
                <li><strong>Slice 4:</strong> Агент v1 — сбор HTML</li>
                <li><strong>Slice 5:</strong> Агент v2 — LLM summary</li>
                <li><strong>Slice 6:</strong> UI улучшения</li>
              </ul>
            </section>

            <section className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                💾 Текущая модель данных
              </h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm">
{`model Domain {
  id        Int      @id @default(autoincrement())
  domain    String   @unique
  createdAt DateTime @default(now())
}`}
              </pre>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
