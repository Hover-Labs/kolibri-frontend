import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'
import clickoutEvent from 'clickout-event'

const app = createApp(App)

app.config.globalProperties.$store = store
// app.config.globalProperties.$eventBus = app

// Enable/disable logging
// app.config.globalProperties.$log = message => console.log(message)
app.config.globalProperties.$log = () => {}

app.directive('focus', {
  mounted(el) {
    el.focus()
  }
})

window.ctx = store

import VueSweetalert2 from 'vue-sweetalert2';
app.use(VueSweetalert2);

import PortalVue from 'portal-vue'
app.use(PortalVue)

import PrimeVue from 'primevue/config';
app.use(PrimeVue, { /* options */ });

app.use(router).mount('#app')
