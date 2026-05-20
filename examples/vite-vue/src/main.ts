import { createApp } from 'vue';
import { ELSPlugin } from '@inso_web/els-vue';
import App from './App.vue';
import './styles.css';

const app = createApp(App);

app.use(ELSPlugin, {
  config: {
    apiKey: import.meta.env.VITE_ELS_API_KEY || 'els_live_xxxxxxxx',
    appSlug: 'examples',
    deploymentEnv: 'DEV',
    serviceName: 'vite-vue-example',
  },
});

app.mount('#app');
