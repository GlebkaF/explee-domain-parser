# Domain CSV Processing Prototype

Этот проект — реализация задания для прототипа обработки CSV с доменами компаний.  
Цель — показать работу с загрузкой CSV, хранением данных в PostgreSQL, запуском «агентов» на каждый домен, использованием LLM для анализа и реализацией простой UI-навигации.

Проект построен в стиле **XP (extreme programming)** через маленькие слайды, каждый из которых добавляет минимальный, но рабочий функционал.

---

## 📌 Исходное тестовое задание

> **Section 2: Build a prototype for domain CSV processing**
>
> The task is to create a working prototype application with the following features:
>
> - Ability to upload a CSV file containing a list of company domains  
> - For each domain, the user should be able to trigger an agent that performs a specific analysis  
>   (for example, fetch the company’s homepage and, in one sentence, describe what the company does)
> - Implement pagination so that users can navigate through pages of domains efficiently  
> - Ensure that the state of each cell (for example, whether an agent has been run on a domain)  
>   is preserved when switching between pages
> - The prototype does not need to be production-ready but should demonstrate the core functionality clearly  
>
> **Deliverable:**  
> an application deployed on any platform (e.g., Replit),  
> with access granted to:  
> - vladbay@explee.com  
> - tony@explee.com  

---

## 🔧 Технологический стек

- **Next.js (App Router)**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL (Neon)**  
- **Tailwind CSS** (минимальный UI)
- **LLM API** (OpenAI или совместимая, через `OPENAI_API_KEY`)
- Деплой: **Vercel**

---

# 🧩 Архитектура прототипа

Приложение демонстрирует весь цикл:

1. **Импорт CSV → домены → сохранение в PostgreSQL**
2. **Отображение таблицы доменов с пагинацией**
3. **Запуск «агента»** на домен:
   - Этап 1 — загрузка HTML с домена (`rawHtml`)
   - Этап 2 — LLM-обработка сырых данных → краткое описание компании (`llmSummary`)
4. **Статусы обработки**:
   ```
   idle → queued → running → html_fetched → completed / error
   ```
5. **Cron-like endpoint**, который обрабатывает домены в очереди
6. Простая, но удобная UI-навигация

---

# 🧪 Подход к разработке: XP-style slicing

## Slice 0 — Bootstrap проекта
- Инициализация Next.js на Vercel  
- Настройка PostgreSQL (Neon)  
- Подключение Prisma  
- Таблица `Domain(id, domain)`  
- Эндпоинт `/api/health/db`  

## Slice 1 — Импорт CSV → PostgreSQL
- Форма загрузки CSV  
- Серверный парсинг  
- Вставка доменов  
- Мини-отчёт + вывод первых 20  

## Slice 2 — Пагинация + статусы + кнопка запуска агента
- Статусы:
  ```
  idle, queued, running, html_fetched, completed, error
  ```
- Таблица доменов  
- Пагинация  
- Кнопка «Run agent»  

## Slice 3 — Cron endpoint + sync stub-agent ✅
- `/api/cron/process-domains`
- Выбор доменов со статусом `queued`
- Синхронный фейковый агент (5 секунд обработки)
- Логика смены статусов: `queued → running → completed`  

## Slice 4 — Агент v1: сбор HTML
- Запрос к домену  
- Сохранение `rawHtml`  
- Статус: `html_fetched`  

## Slice 5 — Агент v2: LLM summary
- `llmSummary`  
- Вызов LLM  
- Генерация одного предложения  
- Статус: `completed`  

## Slice 6 — UI улучшения
- Чистые статусы  
- Цветные бейджи  
- Спиннеры  
- Красивый layout  

---

# 📁 Структура проекта

```
/
├─ prisma/
│   ├─ schema.prisma
│   └─ migrations/
├─ app/
│   ├─ page.tsx
│   ├─ api/
│   │   ├─ health/db/route.ts
│   │   ├─ domains/[id]/queue/route.ts
│   │   └─ cron/run-agent/route.ts
│   └─ components/
│       └─ DomainTable.tsx
├─ lib/
│   ├─ prisma.ts
│   └─ agent/
│       ├─ runAgent.ts
│       └─ fetchHtml.ts
├─ README.md
└─ .env (local)
```

---

# 🚀 Запуск локально

```
npm install
npx prisma migrate dev
npm run dev
```

---

# 🔑 Переменные окружения

```
DATABASE_URL="postgresql://... from Neon"
OPENAI_API_KEY="..."
```

---

# 📬 Деплой

Проект развёрнут на Vercel.  
Cron-обработку можно вызывать через Vercel Cron / GitHub Actions / curl.


# 📝 Лицензия

MIT — прототип сделан для технического задания.
