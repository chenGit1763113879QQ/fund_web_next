import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import NaiveUi from 'naive-ui'

const app = createApp(App)

// websocket地址
// window.$WS_URL = 'ws://lucario.ltd/ws'
window.$WS_URL = 'ws://127.0.0.1:10888/ws'

// 颜色
window.$red = 'rgb(250,68,68)'
window.$green = 'rgb(0,185,100)'
window.$lRed = 'rgba(250,68,68,0.9)'
window.$lGreen = 'rgba(0,185,100,0.9)'
window.$gray = 'rgb(150,150,150)'
window.$primary = 'rgb(64,158,255)'
window.$orange = 'rgb(250,150,60)'
window.$seconText = 'rgb(100,100,100)'
window.$mainText = 'rgb(65,65,65)'

app.use(store).use(router).use(NaiveUi)
app.mount('#app')
