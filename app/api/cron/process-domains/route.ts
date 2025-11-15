import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function fetchDomainHtml(domain: string): Promise<string> {
  try {
    // Пробуем с https
    const httpsUrl = `https://${domain}`;
    console.log(`[Cron] Попытка загрузки ${httpsUrl}`);
    
    const response = await fetch(httpsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(30000), // 30 секунд таймаут
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`[Cron] Успешно загружено ${html.length} символов`);
    return html;
  } catch (httpsError) {
    // Если https не сработал, пробуем http
    try {
      const httpUrl = `http://${domain}`;
      console.log(`[Cron] HTTPS не сработал, пробуем ${httpUrl}`);
      
      const response = await fetch(httpUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      console.log(`[Cron] Успешно загружено через HTTP: ${html.length} символов`);
      return html;
    } catch (httpError) {
      throw new Error(`Не удалось загрузить домен: ${httpsError instanceof Error ? httpsError.message : 'Unknown error'}`);
    }
  }
}

async function processDomain(domainId: number) {
  let domainRecord;
  
  try {
    // Получаем информацию о домене
    domainRecord = await prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domainRecord) {
      throw new Error('Домен не найден');
    }

    // Ставим статус running
    await prisma.domain.update({
      where: { id: domainId },
      data: { status: 'running' },
    });

    console.log(`[Cron] Обработка домена ID ${domainId} (${domainRecord.domain}) началась`);

    // Загружаем HTML контент
    const htmlContent = await fetchDomainHtml(domainRecord.domain);

    // Сохраняем результат
    await prisma.domain.update({
      where: { id: domainId },
      data: { 
        status: 'completed',
        rawHtmlData: htmlContent,
        errorMessage: null,
      },
    });

    console.log(`[Cron] Домен ID ${domainId} успешно обработан`);
    return { success: true, domainId };
  } catch (error) {
    console.error(`[Cron] Ошибка при обработке домена ID ${domainId}:`, error);
    
    // При ошибке ставим статус error
    await prisma.domain.update({
      where: { id: domainId },
      data: { 
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
    });

    return { success: false, domainId, error };
  }
}

export async function GET() {
  try {
    console.log('[Cron] Запуск обработки доменов...');

    // Находим первый домен в статусе queued
    const queuedDomain = await prisma.domain.findFirst({
      where: { status: 'queued' },
      orderBy: { createdAt: 'asc' }, // Берем самый старый
    });

    if (!queuedDomain) {
      console.log('[Cron] Нет доменов в очереди');
      return NextResponse.json({
        success: true,
        message: 'Нет доменов в очереди',
        processed: 0,
      });
    }

    // Обрабатываем домен
    const result = await processDomain(queuedDomain.id);

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Домен ${queuedDomain.domain} успешно обработан` 
        : `Ошибка при обработке домена ${queuedDomain.domain}`,
      processed: 1,
      domain: queuedDomain.domain,
    });
  } catch (error) {
    console.error('[Cron] Критическая ошибка:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}

// Защита от несанкционированных запросов (опционально)
// export async function GET(request: NextRequest) {
//   const authHeader = request.headers.get('authorization');
//   const cronSecret = process.env.CRON_SECRET;
//   
//   if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
//     return NextResponse.json(
//       { success: false, error: 'Unauthorized' },
//       { status: 401 }
//     );
//   }
//   
//   // ... rest of the code
// }

