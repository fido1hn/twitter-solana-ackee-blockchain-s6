import { Buffer } from 'buffer'
globalThis.Buffer = Buffer

// CSS
import 'solana-wallets-vue/styles.css'
import './assets/main.css'

// Day.js
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(localizedFormat)
dayjs.extend(relativeTime)

// Routing.
import { createRouter, createWebHashHistory } from 'vue-router'
import routes from './route'
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// Create the app
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).use(router).mount('#app')
