<script setup lang="ts">
import ErrorTrigger from './components/ErrorTrigger.vue';
</script>

<template>
  <main>
    <h1>@inso_web/els-vue — Vite example</h1>
    <p>
      Этот пример демонстрирует <code>ELSPlugin</code> и composable <code>useELS()</code>.
      Все Vue ошибки автоматически отправляются через <code>app.config.errorHandler</code>.
    </p>
    <ErrorTrigger />
  </main>
</template>
