# @inso_web/els-vue

[![npm version](https://img.shields.io/npm/v/@inso_web/els-vue.svg)](https://www.npmjs.com/package/@inso_web/els-vue)
[![npm downloads](https://img.shields.io/npm/dm/@inso_web/els-vue.svg)](https://www.npmjs.com/package/@inso_web/els-vue)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![license MIT](https://img.shields.io/npm/l/@inso_web/els-vue.svg)](./LICENSE)

Vue 3 plugin для **Error Logs Service (ELS)**: глобальная регистрация клиента + composable `useELS()` + автоматический `app.config.errorHandler` для перехвата render-ошибок.

## Что внутри

- `app.use(ELSPlugin, { client })` — регистрирует клиент глобально и навешивает `app.config.errorHandler`.
- `useELS()` — composable для использования логгера в `<script setup>`.
- Автоматический `errorHandler` Vue: render-ошибки → ELS со stack trace и информацией о компоненте.

---

## UI: что вы получаете

ELS из коробки даёт админ-панель — все события из вашего Vue приложения попадают в неё.

### Список логов с фильтрами

![Список логов](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/01-error-logs-list.png)

Виртуальная таблица всех событий: trace ID, приложение, источник (client/server), уровень, сообщение, страница, IP. Левый сайдбар — фасеты по приложению, окружению, **версии**, источнику, уровню, браузеру, языку, IP, категории ошибки.

### Детальная карточка с метаданными

![Детальная карточка](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/02-event-detail-info.png)

Время сервера/клиента, IP с гео, окружение, **версия приложения**, fingerprint, session ID. Карточки повторений и корреляция событий справа.

### AI-диагностика ошибок

![AI диагностика](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/03-error-detail-ai.png)

Stack trace с распарсенными фреймами + AI-анализ что именно сломалось и как чинить.

### Аналитика и регрессии по версиям

![Аналитика](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/04-analytics-dashboard.png)

Total / critical+errors / warnings / error rate. AI-обзор слева, timeline в центре, donut'ы по приложению/источнику/уровню. **Виджет «Регрессии»**: какие fingerprint'ы появились впервые в свежей версии и какие пропали.

### Управление API-ключами

![API ключи](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/05-api-keys.png)
![Действия с ключом](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/06-api-key-actions.png)

Scoped-ключи (write/read/read-any), live/test environments, ротация без даунтайма.

### Избранные события

![Избранные](https://raw.githubusercontent.com/official-inso/els-go/main/docs/screenshots/07-favorites.png)

Закладки на конкретные trace ID — для расследований, не теряются между сессиями.

---

## Установка

```bash
npm install @inso_web/els-client @inso_web/els-vue
```

---

## Quick Start

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

`attachVueErrorHandler: true` — устанавливает `app.config.errorHandler`, render-ошибки автоматически шлют в ELS.

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

ELS принимает любой формат до 128 символов: semver, CalVer, date-compact, git SHA, opaque.

---

## API

```ts
const ELSPlugin: Plugin<{ client: ELSClient; attachVueErrorHandler?: boolean }>;

function useELS(): Logger;
```

---

## FAQ

**Совместимо с Nuxt 3?** Да, регистрируйте plugin через `defineNuxtPlugin`:

```ts
// plugins/els.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  const client = new ELSClient({ /* ... */ });
  nuxtApp.vueApp.use(ELSPlugin, { client });
});
```

**А `apiKey` для клиентского bundle — это безопасно?** Да, ELS-ключи scoped (только write для приложения), и они всё равно видны в bundle (как у Sentry public DSN).

---

## License

[MIT](./LICENSE) © INSOWEB
