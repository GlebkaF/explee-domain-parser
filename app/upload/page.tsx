'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Domain {
  id: number;
  domain: string;
  createdAt: string;
}

interface UploadStats {
  totalRows: number;
  inserted: number;
  duplicates: number;
  invalid: number;
}

interface DomainProcessingResult {
  originalDomain: string;
  cleanedDomain: string;
  status: 'success' | 'duplicate' | 'error';
  errorReason?: string;
}

interface UploadResponse {
  success: boolean;
  stats?: UploadStats;
  processingResults?: DomainProcessingResult[];
  domains?: Domain[];
  error?: string;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/domains/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch {
      setResult({
        success: false,
        error: 'Ошибка при загрузке файла',
      });
    } finally {
      setUploading(false);
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
              📤 Загрузка CSV
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Импорт доменов компаний из CSV файла
            </p>
          </div>

          {/* Форма загрузки CSV */}
          <div className="mb-8">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="flex flex-col items-center gap-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    dark:file:bg-blue-900 dark:file:text-blue-200"
                />
                
                {file && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Выбран файл: <span className="font-medium">{file.name}</span>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                    text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {uploading ? '⏳ Загрузка...' : '📤 Загрузить CSV'}
                </button>
              </div>

              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <p className="font-medium mb-2">Формат CSV файла:</p>
                <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">
{`domain
example.com
https://google.com
http://github.com
www.reddit.com
https://www.youtube.com/watch?v=123`}
                </pre>
                <p className="mt-2 text-xs">
                  ✨ Автоматически удаляются: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">https://</code>, <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">http://</code>, <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">www.</code>, пути, порты
                </p>
              </div>
            </div>
          </div>

          {/* Результаты загрузки */}
          {result && (
            <div className="mb-8">
              {result.success ? (
                <div className="space-y-6">
                  {/* Статистика */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4">
                      ✅ Файл успешно обработан
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {result.stats?.totalRows}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Всего строк
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {result.stats?.inserted}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Добавлено
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                          {result.stats?.duplicates}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Дубликатов
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                          {result.stats?.invalid}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Невалидных
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Детальная таблица обработки */}
                  {result.processingResults && result.processingResults.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        📝 Детальный отчет по доменам
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                №
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Исходный домен
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Статус
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Очищенный домен
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Примечание
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {result.processingResults.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-mono">
                                  {item.originalDomain}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  {item.status === 'success' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      ✓ Добавлен
                                    </span>
                                  )}
                                  {item.status === 'duplicate' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                      ⚠ Дубликат
                                    </span>
                                  )}
                                  {item.status === 'error' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                      ✗ Ошибка
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium">
                                  {item.cleanedDomain ? (
                                    <span className="text-blue-600 dark:text-blue-400 font-mono">
                                      {item.cleanedDomain}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                  {item.errorReason || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">
                    ❌ Ошибка при обработке файла
                  </h3>
                  <p className="text-red-700 dark:text-red-300">
                    {result.error}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

