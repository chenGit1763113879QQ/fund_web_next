import {createStore} from 'vuex'
import {useRouter} from "vue-router"
import axios from 'axios'
// import {useMessage} from "naive-ui"

export default createStore({
    state: {
        items: {},
        ticks: [],
        pankou: {},
        chart: [],

        red1: 'rgba(252,58,62,0.95)',
        green1: 'rgba(10,185,100,0.95)',

        axios: null,
        router: null,
        msg: null,
        msgOpt: {duration: 1500},
    },
    getters: {
        items(state) {
            return state.items
        },
        routeName(state) {
            return state.router.currentRoute.name
        },
        is_login() {
            return localStorage.getItem('token')
        },
        code(state) {
            return state.router.currentRoute.params.code
        },
        type(state) {
            return state.items.type
        },
        marketType(state) {
            return state.items['marketType']
        },
        isCN(state) {
            return state.items['marketType'] === 'CN'
        },
        isCNStock(state) {
            return state.items['marketType'] === 'CN' && state.items.type === 'stock'
        }
    },
    mutations: {
        // 初始化
        init(state) {
            state.router = useRouter()
            // state.msg = useMessage()

            // 初始化token
            let token = localStorage.getItem('token')
            if (token) axios.defaults.headers['Authorization'] = token

            // 响应拦截器
            axios.interceptors.response.use(
                res => {
                    switch (res.status) {
                        case 200:
                            if (res.data.status) {
                                return Promise.resolve(res)
                            } else {
                                // 警告消息
                                // state.msg.warning(res.data.msg, state.msgOpt)
                                return Promise.reject(res)
                            }

                        case 401:
                            // state.msg.warning(res.data.msg, state.msgOpt)
                            localStorage.removeItem('token')
                            return Promise.reject(res)

                        default:
                            return Promise.reject(res)
                    }
                },
                err => {
                    console.error(err)
                    // state.msg.error('服务器内部错误', state.msgOpt)
                },
            )
            state.axios = axios
        }
    },
    actions: {},
    modules: {}
})
