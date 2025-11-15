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

    // Проверяем, можно ли перезапустить (только для running и error)
    if (domain.status !== 'running' && domain.status !== 'error') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Можно перезапускать только домены в статусе "running" или "error"' 
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

    return NextResponse.json({
      success: true,
      domain: updatedDomain,
    });
  } catch (error) {
    console.error('Restart error:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

