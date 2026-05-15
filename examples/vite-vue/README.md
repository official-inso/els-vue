# vite-vue

Vite + Vue 3 + TypeScript starter для `@inso_web/els-vue`.

## Запуск

```bash
npm install
VITE_ELS_API_KEY=els_live_xxxxxxxx npm run dev
```

Затем открой `http://localhost:5173/`.

Environment:
- `VITE_ELS_API_KEY` — API ключ ELS
- `VITE_ELS_URL` — URL ELS API (default: `https://api.insoweb.ru/els`)

## Что демонстрирует

- Установка `ELSPlugin` через `app.use()`
- `useELS()` composable для ручной отправки ошибок (`els.report(err)`)
- Автоматический перехват ошибок Vue через `app.config.errorHandler`
- Авто-перехват глобальных `window.error` и `unhandledrejection`
