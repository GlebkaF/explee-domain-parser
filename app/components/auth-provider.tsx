'use client';

// Перехватываем все fetch запросы и добавляем пароль из localStorage
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const [url, options = {}] = args;
    const password = localStorage.getItem('auth_password');
    
    if (password) {
      const headers = new Headers(options.headers || {});
      headers.set('x-password', password);
      options.headers = headers;
    }
    
    return originalFetch(url, options);
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
