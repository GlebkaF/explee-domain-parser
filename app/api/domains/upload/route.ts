import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

interface CSVRow {
  domain?: string;
  [key: string]: string | undefined;
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

// Очистка домена от протоколов и лишних символов
function cleanDomain(domain: string): string {
  if (!domain || typeof domain !== 'string') return '';
  
  let cleaned = domain.trim().toLowerCase();
  
  // Удаляем протоколы
  cleaned = cleaned.replace(/^https?:\/\//, '');
  
  // Удаляем www. префикс (опционально)
  cleaned = cleaned.replace(/^www\./, '');
  
  // Удаляем trailing slash и всё после него (путь)
  cleaned = cleaned.split('/')[0];
  
  // Удаляем порт, если есть
  cleaned = cleaned.split(':')[0];
  
  return cleaned;
}

// Валидация домена
function isValidDomain(domain: string): boolean {
  if (!domain || typeof domain !== 'string') return false;
  
  const trimmed = domain.trim();
  
  // Проверки:
  // - Не пустой
  // - Содержит точку
  // - Не содержит пробелов
  // - Базовый формат (буквы, цифры, точки, дефисы)
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/;
  
  return trimmed.length > 0 && 
         trimmed.includes('.') && 
         !trimmed.includes(' ') &&
         domainRegex.test(trimmed);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // Проверка наличия файла
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Файл не загружен' },
        { status: 400 }
      );
    }

    // Проверка типа файла
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'Разрешены только CSV файлы' },
        { status: 400 }
      );
    }

    // Чтение содержимого файла
    const text = await file.text();

    // Проверка на пустой файл
    if (!text.trim()) {
      return NextResponse.json(
        { success: false, error: 'CSV файл пустой' },
        { status: 400 }
      );
    }

    // Парсинг CSV
    const parseResult = Papa.parse<CSVRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
    });

    const stats: UploadStats = {
      totalRows: parseResult.data.length,
      inserted: 0,
      duplicates: 0,
      invalid: 0,
    };

    // Валидация и подготовка доменов
    const validDomains: string[] = [];
    const seenDomains = new Set<string>();
    const processingResults: DomainProcessingResult[] = [];

    for (const row of parseResult.data) {
      const rawDomain = row.domain?.trim();
      
      if (!rawDomain) {
        stats.invalid++;
        processingResults.push({
          originalDomain: rawDomain || '(пусто)',
          cleanedDomain: '',
          status: 'error',
          errorReason: 'Пустое значение'
        });
        continue;
      }

      // Очищаем домен от протоколов и лишних символов
      const cleanedDomain = cleanDomain(rawDomain);
      
      if (!cleanedDomain) {
        stats.invalid++;
        processingResults.push({
          originalDomain: rawDomain,
          cleanedDomain: '',
          status: 'error',
          errorReason: 'Не удалось очистить домен'
        });
        continue;
      }

      // Проверка валидности
      if (!isValidDomain(cleanedDomain)) {
        stats.invalid++;
        processingResults.push({
          originalDomain: rawDomain,
          cleanedDomain: cleanedDomain,
          status: 'error',
          errorReason: 'Невалидный формат домена'
        });
        continue;
      }

      // Проверка на дубликаты в самом файле
      if (seenDomains.has(cleanedDomain)) {
        stats.duplicates++;
        processingResults.push({
          originalDomain: rawDomain,
          cleanedDomain: cleanedDomain,
          status: 'duplicate',
          errorReason: 'Дубликат внутри файла'
        });
        continue;
      }

      seenDomains.add(cleanedDomain);
      validDomains.push(cleanedDomain);
      
      // Временно помечаем как success, проверим дубликаты БД позже
      processingResults.push({
        originalDomain: rawDomain,
        cleanedDomain: cleanedDomain,
        status: 'success',
      });
    }

    // Массовая вставка в БД
    const existingDomains = new Set<string>();
    if (validDomains.length > 0) {
      try {
        // Проверяем существующие домены
        const existing = await prisma.domain.findMany({
          where: {
            domain: { in: validDomains }
          },
          select: { domain: true }
        });
        
        existing.forEach((d: { domain: string }) => existingDomains.add(d.domain));
        
        const result = await prisma.domain.createMany({
          data: validDomains.map(domain => ({ domain })),
          skipDuplicates: true,
        });
        
        stats.inserted = result.count;
        stats.duplicates += validDomains.length - result.count;
        
        // Обновляем статусы в результатах
        processingResults.forEach(result => {
          if (result.status === 'success' && existingDomains.has(result.cleanedDomain)) {
            result.status = 'duplicate';
            result.errorReason = 'Дубликат в базе данных';
          }
        });
      } catch (error) {
        console.error('Database insert error:', error);
        return NextResponse.json(
          { success: false, error: 'Ошибка при сохранении в базу данных' },
          { status: 500 }
        );
      }
    }

    // Получение первых 20 доменов из БД
    const domains = await prisma.domain.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      stats,
      processingResults,
      domains,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка при обработке файла' 
      },
      { status: 500 }
    );
  }
}

