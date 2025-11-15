import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function processDomain(domainId: number) {
  try {
    // Ставим статус running
    await prisma.domain.update({
      where: { id: domainId },
      data: { status: 'running' },
    });

    console.log(`[Cron] Обработка домена ID ${domainId} началась`);

    // Имитация обработки - ждем 5 секунд
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Завершаем обработку
    await prisma.domain.update({
      where: { id: domainId },
      data: { status: 'completed' },
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

