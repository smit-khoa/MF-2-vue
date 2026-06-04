import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount(container);
