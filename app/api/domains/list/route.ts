import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get('page')) || 1;
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

    return NextResponse.json({
      success: true,
      domains,
      total,
      totalPages,
      page,
      startIndex,
      endIndex,
    });
  } catch (error) {
    console.error('List domains error:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

