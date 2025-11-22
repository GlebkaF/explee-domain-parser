import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const domainId = parseInt(id);

    if (isNaN(domainId)) {
      return NextResponse.json(
        { success: false, error: 'Неверный ID домена' },
        { status: 400 }
      );
    }

    // Проверяем существование домена
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
    });

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Домен не найден' },
        { status: 404 }
      );
    }

    if (!domain.userQuery || domain.userQuery.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Запрос пользователя не указан. Пожалуйста, укажите запрос при загрузке доменов.' },
        { status: 400 }
      );
    }

    // Проверяем, можно ли запустить агент (только для created)
    if (domain.status !== 'created') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Можно запускать только домены в статусе "created"' 
        },
        { status: 400 }
      );
    }

    // Меняем статус на queued
    const updatedDomain = await prisma.domain.update({
      where: { id: domainId },
      data: {
        status: 'queued',
        errorMessage: null,
      },
    });

    // Принудительный запуск "крона" обработки очерели, это нужно потом что все бесплатные кроны работают как попало, такой "хак"
    fetch(`${request.nextUrl.origin}/api/cron/process-domains`, { 
      method: 'GET' 
    }).catch((error) => {
      console.log(error)
    });

    return NextResponse.json({
      success: true,
      domain: updatedDomain,
    });
  } catch (error) {
    console.error('Run agent error:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

