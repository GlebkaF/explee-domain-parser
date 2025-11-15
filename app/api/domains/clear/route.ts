import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
  try {
    // Удаляем все домены из БД
    const result = await prisma.domain.deleteMany({});
    
    return NextResponse.json({
      success: true,
      message: 'База данных очищена',
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Clear database error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка при очистке базы данных',
      },
      { status: 500 }
    );
  }
}

