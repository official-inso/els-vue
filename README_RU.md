# @inso_web/els-vue

[![npm version](https://img.shields.io/npm/v/@inso_web/els-vue.svg)](https://www.npmjs.com/package/@inso_web/els-vue)
[![npm downloads](https://img.shields.io/npm/dm/@inso_web/els-vue.svg)](https://www.npmjs.com/package/@inso_web/els-vue)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![license MIT](https://img.shields.io/npm/l/@inso_web/els-vue.svg)](./LICENSE)

Vue 3 plugin для **Inso Error Logs Service (ELS)** — управляемого SaaS централизованного сбора событий (от debug до fatal) с AI-диагностикой ошибок. Глобальная регистрация клиента через `app.use(ELSPlugin)`, composable `useELS()` и опциональный hook `app.config.errorHandler`, авто-захватывающий ошибки render-фазы.

> 🇬🇧 [English version → README.md](README.md)

---

## Содержание

- [Что вы получаете](#что-вы-получаете)
- [Установка](#установка)
- [Быстрый старт](#быстрый-старт)
- [Когда что использовать](#когда-что-использовать)
- [Ключевые концепции](#ключевые-концепции)
- [Конфигурация](#конфигурация)
- [Миграция](#миграция)
  - [С @sentry/vue](#с-sentryvue)
- [Версионирование](#версионирование)
- [Quick reference](#quick-reference)
- [Почему ELS](#почему-els)
- [API](#api)
- [FAQ](#faq)
- [Другие ELS SDK](#другие-els-sdk)
- [Тарифы](#тарифы)
- [Лицензия](#лицензия)

---

## Что вы получаете

ELS из коробки даёт встроенную админ-панель. Каждое событие, отправленное этим SDK, попадает туда — с полнотекстовым поиском, фасетной фильтрацией, AI-диагностикой и обнаружением регрессий по версиям.

| | |
|---|---|
| ![Список логов](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/01-error-logs-list.png) | ![Карточка события](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/02-event-detail-info.png) |
| Виртуальная таблица с фасетным сайдбаром (приложение, окружение, **версия**, источник, уровень, браузер, IP, категория). Live-режим обновляет данные каждые 5с. | Полные метаданные события: время, гео, окружение, **версия приложения**, fingerprint, session, карточки повторений, корреляция в рамках сессии. |
| ![AI-диагностика](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/03-error-detail-ai.png) | ![Аналитика](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/04-analytics-dashboard.png) |
| Распарсенный stack trace + AI-анализ: что сломалось, где, как чинить. | Timeline, donut'ы, топ URL/IP, тепловая карта по часам, **виджет регрессий по версиям**. |

---

## Установка

```bash
npm install @inso_web/els-client @inso_web/els-vue
```

**Требования:** Vue 3, Node.js 18+ на этапе сборки. Работает с Vite, Quasar, Nuxt 3.

---

## Быстрый старт

### 1. Подключите plugin

`main.ts`:

```ts
import { createApp } from 'vue';
import { ELSClient } from '@inso_web/els-client';
import { ELSPlugin } from '@inso_web/els-vue';
import App from './App.vue';

const client = new ELSClient({
  endpoint: import.meta.env.VITE_ELS_URL,
  apiKey: import.meta.env.VITE_ELS_API_KEY,
  appSlug: 'my-vue-app',
  serviceName: 'web',
  deploymentEnv: import.meta.env.PROD ? 'PRODUCTION' : 'DEV',
  appVersion: import.meta.env.VITE_BUILD_VERSION,
  minLevel: 'info',
});

const app = createApp(App);
app.use(ELSPlugin, { client, attachVueErrorHandler: true });
app.mount('#app');
```

`attachVueErrorHandler: true` устанавливает `app.config.errorHandler` — render-ошибки автоматически уходят в ELS.

Ещё нет API-ключа? **[Зарегистрируйтесь на lk.insoweb.ru](https://lk.insoweb.ru)** — займёт минуту.

### 2. Логируйте через `useELS()`

```vue
<script setup lang="ts">
import { useELS } from '@inso_web/els-vue';

const log = useELS();

async function checkout() {
  log.info('Checkout started');
  try {
    await fetch('/api/checkout', { method: 'POST' });
  } catch (err) {
    log.error(err as Error, 'Checkout failed');
  }
}
</script>

<template>
  <button @click="checkout">Pay</button>
</template>
```

### 3. Глобальные обработчики (опционально)

```ts
window.addEventListener('error', (e) => client.error(e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => client.error(e.reason));
```

### 4. Nuxt 3

```ts
// plugins/els.client.ts
import { ELSClient } from '@inso_web/els-client';
import { ELSPlugin } from '@inso_web/els-vue';

export default defineNuxtPlugin((nuxtApp) => {
  const client = new ELSClient({
    endpoint: useRuntimeConfig().public.elsUrl,
    apiKey: useRuntimeConfig().public.elsApiKey,
    appSlug: 'my-nuxt-app',
  });
  nuxtApp.vueApp.use(ELSPlugin, { client, attachVueErrorHandler: true });
});
```

---

## Когда что использовать

| Сценарий | Что брать |
|---|---|
| Авто-захват render-ошибок | `app.use(ELSPlugin, { client, attachVueErrorHandler: true })` |
| Ручное логирование в компонентах | `const log = useELS()` |
| Логирование в Pinia store | Импорт клиента напрямую или чтение из inject |
| Suspense / async-ошибки | `try/catch` вокруг await + `log.error(...)` |
| Window-уровень | Один раз `window.addEventListener('error', ...)` |
| Уже есть `errorHandler` | `attachVueErrorHandler: false`, вызывайте SDK сами |

---

## Ключевые концепции

### Интеграция с `app.config.errorHandler`

При `attachVueErrorHandler: true` плагин устанавливает:

```ts
app.config.errorHandler = (err, instance, info) => {
  client.error(err as Error, info, { meta: { componentName: instance?.$options.name } });
};
```

Render-ошибки идут в ELS без явного захвата. Если `errorHandler` у вас уже есть — передайте `false` и зовите `client.error(...)` сами.

### Composable `useELS()`

Возвращает `Logger` (`info`, `warn`, `error`, `debug`, `fatal`, `child`, `flush`). Используйте внутри `<script setup>` или composable. Вне Vue-контекста — читайте через injection-ключ или импортируйте клиент.

### Bindings и child-логгеры

```ts
const log = useELS();
const tenantLog = log.child({ tenant: 'acme' });
tenantLog.info('viewed dashboard');
```

---

## Конфигурация

`ELSConfig` совпадает с базовым клиентом — см. [@inso_web/els-client](https://github.com/official-inso/els-client). Ключевые поля:

| Опция | Описание |
|---|---|
| `endpoint` | URL ELS (обязательно) |
| `apiKey` | API-ключ (обязательно) |
| `appSlug` | Slug приложения (обязательно) |
| `serviceName` | Имя сервиса / модуля |
| `deploymentEnv` | `DEV` / `STAGING` / `PRODUCTION` |
| `appVersion` | Версия (≤128 символов) |
| `minLevel` | Минимальный уровень для отправки |

Опции плагина:

| Опция | По умолчанию | Описание |
|---|---|---|
| `client` | — | Экземпляр `ELSClient` (обязательно) |
| `attachVueErrorHandler` | `true` | Установить `app.config.errorHandler` |

---

## Миграция

### С @sentry/vue

**Было:**

```ts
import { createApp } from 'vue';
import * as Sentry from '@sentry/vue';
import App from './App.vue';
import router from './router';

const app = createApp(App);

Sentry.init({
  app,
  dsn: 'https://public@sentry.example.com/1',
  environment: process.env.NODE_ENV,
  release: import.meta.env.VITE_BUILD_VERSION,
  integrations: [new Sentry.BrowserTracing({ router })],
});

app.use(router).mount('#app');
```

```vue
<script setup lang="ts">
import * as Sentry from '@sentry/vue';

function onClick() {
  Sentry.captureMessage('clicked');
  doStuff().catch(Sentry.captureException);
}
</script>
```

**Стало:**

```ts
import { createApp } from 'vue';
import { ELSClient } from '@inso_web/els-client';
import { ELSPlugin } from '@inso_web/els-vue';
import App from './App.vue';
import router from './router';

const client = new ELSClient({
  endpoint: import.meta.env.VITE_ELS_URL,
  apiKey: import.meta.env.VITE_ELS_API_KEY,
  appSlug: 'my-vue-app',
  deploymentEnv: import.meta.env.PROD ? 'PRODUCTION' : 'DEV',
  appVersion: import.meta.env.VITE_BUILD_VERSION,
});

const app = createApp(App);
app.use(ELSPlugin, { client, attachVueErrorHandler: true });
app.use(router).mount('#app');
```

```vue
<script setup lang="ts">
import { useELS } from '@inso_web/els-vue';
const log = useELS();

function onClick() {
  log.info('clicked');
  doStuff().catch((err) => log.error(err, 'click failed'));
}
</script>
```

| Sentry | ELS | Заметки |
|---|---|---|
| `Sentry.init({ app, dsn })` | `app.use(ELSPlugin, { client })` | Один Vue-plugin |
| `Sentry.captureException(err)` | `log.error(err)` | Через `useELS()` |
| `Sentry.captureMessage(msg, level)` | `log.<level>(msg)` | |
| `Sentry.setUser({ id, email })` | `log.child({ user: { id, email } })` | Или через `loggerDefaults` |
| `release` | `appVersion` | Любая строка ≤128 |
| `environment` | `deploymentEnv` | Фиксированный enum |
| `BrowserTracing` / router instrumentation | не предоставляется | Sentry оставляйте, если нужно |
| `Sentry.attachErrorHandler: true` | `attachVueErrorHandler: true` | Тот же эффект на `errorHandler` |
| Source maps upload | не предоставляется | Парьте с другим инструментом |

**Подводные камни:**

- Instrumentation для `vue-router` в Sentry ловит навигации. ELS — нет; если зависите, оставьте Sentry Performance.
- Sentry breadcrumbs автоматически захватывает клики и fetch. ELS захватывает только то, что вы логируете — используйте `log.child({ route })` per page.
- Для Pinia добавьте плагин: логируйте `action.type` через `pinia.subscribe`.

---

## Версионирование

Vite инлайнит `import.meta.env.VITE_*` на этапе build. Прокидывайте через Dockerfile:

```Dockerfile
ARG VITE_BUILD_VERSION=dev
ENV VITE_BUILD_VERSION=$VITE_BUILD_VERSION
RUN npm run build
```

```yaml
# .gitlab-ci.yml
- export BUILD_VERSION=$(date -u +%Y%m%d%H%M%S)
- docker build --build-arg VITE_BUILD_VERSION="$BUILD_VERSION" ...
```

```ts
new ELSClient({ ..., appVersion: import.meta.env.VITE_BUILD_VERSION });
```

ELS принимает любой формат ≤128 символов: semver, CalVer, date-compact, git SHA, opaque. Сервер автоматически распознаёт тип.

---

## Quick reference

| Нужно | Делайте |
|---|---|
| Авто-захват render-ошибок | `attachVueErrorHandler: true` |
| Логгер в `<script setup>` | `const log = useELS()` |
| Логгер в Pinia / utility | Импорт клиента напрямую |
| Window-ошибки | `window.addEventListener('error', ...)` |
| Per-route контекст | `log.child({ route: route.name })` в layout |
| Identify пользователя | `log.child({ user: { id, email } })` |
| Подавить шумные уровни | `minLevel: 'warn'` |

---

## Почему ELS

ELS для Node.js — сфокусированный SaaS для логирования, а не observability-комбайн. Оптимизирован под скорость захвата, AI-диагностику и дешевизну интеграции.

- **Меньше веса.** ~3 KB gzip в браузере, без транзитивных зависимостей.
- **Ноль внешних API.** Только `POST /errors[/batch]` и `GET /health`.
- **AI-диагностика** на каждом stack trace.
- **5 минут интеграции.** `app.use(ELSPlugin)` + `useELS()` — готово.
- **Прозрачные тарифы.** Цены в личном кабинете.

### Подробное сравнение

| Категория | ELS | Sentry | Datadog / New Relic | Grafana Loki | LogRocket / Logtail / BetterStack |
|---|---|---|---|---|---|
| Модель хостинга | Managed SaaS | SaaS или self-hosted | Только SaaS | Self-hosted / Grafana Cloud | SaaS |
| Runtime-зависимости SDK | Ноль | Средне (саб-SDK, интеграции) | Тяжёлый агент + tracing | Promtail / агент | Средне |
| Время интеграции | ~5 мин | 10–20 мин | 30–60 мин | Часы — дни | 10–20 мин |
| AI-диагностика | Встроена | Платный аддон | Платный аддон | Нет | Нет |
| Группировка / fingerprint | Да | Да | Да | Вручную через LogQL | Частично |
| Source-map upload | Нет | Да | Да | н/п | Частично |
| Session replay (frontend) | Нет | Платно | Платно | н/п | Да (core) |
| Distributed tracing / APM | Нет | Частично | Да (core) | Да с Tempo | Нет |
| Метрики инфраструктуры | Нет | Нет | Да (core) | Да с Mimir | Нет |
| Хранение на free-тарифе | 24 часа | 30 дней (лимит объёма) | Только триал | Self-cost | 3–30 дней |
| Поддержка / документация на русском | Нативно | Сообщество | Ограничено | Сообщество | Нет |

### Когда ELS — неподходящий выбор

- Нужен один вендор на **APM + логи + метрики** одним счётом — берите Datadog или New Relic.
- Триаж фронтенда строится вокруг **DOM session replay** — LogRocket или Sentry Replay.
- Публичное мобильное приложение, нужны symbolication и ANR-детект — Firebase Crashlytics or Sentry Mobile.

Во всех остальных сценариях — backend-ошибки, JS-ошибки фронта, request-логи, структурированные события с version-aware-аналитикой — ELS даёт самый короткий путь до рабочей панели.

→ **Регистрация на [lk.insoweb.ru](https://lk.insoweb.ru)** для API-ключа.

---

## API

```ts
const ELSPlugin: Plugin<{ client: ELSClient; attachVueErrorHandler?: boolean }>;

function useELS(): Logger;
```

Полный `ELSConfig` reference — см. [@inso_web/els-client](https://github.com/official-inso/els-client).

---

## FAQ

**Vue 2?** Не поддерживается — только Vue 3. Для Vue 2 используйте базовый [`@inso_web/els-client`](https://github.com/official-inso/els-client) и `client.error(...)` вручную.

**Nuxt 3?** Да, регистрируйте через `defineNuxtPlugin` (см. Быстрый старт).

**Безопасно ли держать API-ключ в клиентском бандле?** Да. ELS-ключи scoped — write-ключ только пишет. Та же модель что и у Sentry public DSN.

---

## Другие ELS SDK

Тот же wire-формат, та же панель — выбирайте по стеку.

**Node.js**
- [`@inso_web/els-client`](https://github.com/official-inso/els-client) — базовый TS / Node / browser клиент
- [`@inso_web/els-express`](https://github.com/official-inso/els-express) — Express middleware
- [`@inso_web/els-next`](https://github.com/official-inso/els-next) — хелперы для Next.js (App + Pages router)
- [`@inso_web/els-nest`](https://github.com/official-inso/els-nest) — NestJS module
- [`@inso_web/els-react`](https://github.com/official-inso/els-react) — React Provider, hooks, ErrorBoundary
- [`@inso_web/els-vue`](https://github.com/official-inso/els-vue) — Vue 3 plugin (этот репо)

**Другие стеки**
- [`Inso.Els`](https://github.com/official-inso/els-csharp) — .NET (Core + ASP.NET Core + ILogger)
- [`io.github.official-inso:els-core`](https://github.com/official-inso/els-java) — Java + Spring Boot starter + SLF4J
- [`github.com/official-inso/els-go`](https://github.com/official-inso/els-go) — Go

---

## Тарифы

Free-тариф — **хранение логов 24 часа**. Полный прайс на **[lk.insoweb.ru](https://lk.insoweb.ru)**.

---

## Лицензия

[MIT](./LICENSE) © INSOWEB
