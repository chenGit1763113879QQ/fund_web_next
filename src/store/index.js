import {createStore} from 'vuex'
import {useRouter} from "vue-router"
import axios from 'axios'
import {Decompress} from "../components/common/func.js";

export default createStore({
    state: {
        red1: 'rgba(252,58,62,0.95)',
        green1: 'rgba(10,185,100,0.95)',

        axios: null,
        router: null,
        msg: null,
        msgOpt: {duration: 1500},
    },
    getters: {
        is_login() {
            return localStorage.getItem('token')
        },
        code(state) {
            return state.router.currentRoute.params.code
        }
    },
    mutations: {
        // 初始化
        init(state) {
            state.router = useRouter()

            // 初始化token
            let token = localStorage.getItem('token')
            if (token) axios.defaults.headers['Authorization'] = token

            // 响应拦截器
            axios.interceptors.response.use(
                res => {
                    switch (res.status) {
                        case 200:
                            if (res.data.status) {
                                // 解压
                                if (res.data.data) res.data.data = Decompress(res.data.data)
                                return Promise.resolve(res)
                            } else {
                                return Promise.reject(res)
                            }

                        case 401:
                            localStorage.removeItem('token')
                            return Promise.reject(res)

                        default:
                            return Promise.reject(res)
                    }
                },
                err => {
                    console.error(err)
                },
            )
            state.axios = axios
        }
    },
    actions: {},
    modules: {}
})
