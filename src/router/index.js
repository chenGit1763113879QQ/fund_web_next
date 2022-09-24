import {createRouter, createWebHashHistory} from 'vue-router'
import items from '../view/items/index.vue'
import map from '../view/market/panorama/map.vue'

const routes = [
    {path: '/', redirect: '/market/map'},
    {path: '/market/map', name: 'map', component: map},
    {path: '/items/:code', name: 'items', component: items},
]

const router = createRouter({
    history: createWebHashHistory(),
    routes: routes,
})

export default router
