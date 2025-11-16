import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Пропускаем страницу логина
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }

  // Пропускаем крон-роут (Vercel Cron уже защищен на уровне платформы)
  if (request.nextUrl.pathname === '/api/cron/process-domains') {
    return NextResponse.next();
  }

  const validPassword = process.env.AUTH_PASSWORD;

  if (!validPassword) {
    // Если пароль не настроен, пропускаем все
    return NextResponse.next();
  }

  // Проверяем пароль в заголовке
  const passwordHeader = request.headers.get('x-password');
  
  // Вычисляем хеш пароля для cookie (простая защита от подделки)
  const passwordHash = Buffer.from(validPassword).toString('base64').slice(0, 20);
  const authCookie = request.cookies.get('auth')?.value;
  
  // Если есть правильный пароль в заголовке - авторизуем
  if (passwordHeader === validPassword) {
    const response = NextResponse.next();
    
    // Устанавливаем хеш пароля в cookie для SSR запросов
    if (authCookie !== passwordHash) {
      response.cookies.set('auth', passwordHash, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 дней
        path: '/',
      });
    }
    
    return response;
  }
  
  // Для SSR запросов (обновление страницы): проверяем хеш в cookie
  // Для API запросов всегда требуется пароль в заголовке
  if (authCookie === passwordHash && !request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Пароль неверный или отсутствует, редиректим на логин
  if (request.nextUrl.pathname.startsWith('/api')) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
