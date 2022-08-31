import {createRouter, createWebHashHistory} from 'vue-router'
import market from '../view/market/index.vue'
import items from  '../view/items/index.vue'

const routes = [
    {path: '/', redirect: '/market'},
    {path: '/market', name: 'market', component: market},
    {path: '/items/:code', name: 'items', component: items},
]

const router = createRouter({
    history: createWebHashHistory(),
    routes: routes,
})

export default router
