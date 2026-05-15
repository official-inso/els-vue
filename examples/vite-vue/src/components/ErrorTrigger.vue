<script setup lang="ts">
import { useELS } from '@inso_web/els-vue';

const els = useELS();

const sendManualError = () => {
  try {
    throw new Error('Manual error from Vue useELS');
  } catch (e) {
    els.report(e);
    alert('Sent to ELS!');
  }
};

const triggerCrash = () => {
  // Эта ошибка будет поймана app.config.errorHandler из ELSPlugin.
  throw new Error('Auto-caught Vue error from errorHandler');
};
</script>

<template>
  <div class="card">
    <button @click="sendManualError">Send error via useELS().report()</button>
    <button @click="triggerCrash">Throw error (caught by errorHandler)</button>
  </div>
</template>
