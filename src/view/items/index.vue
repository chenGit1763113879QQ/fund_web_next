<template>
  <kline/>

  <simple-kline :code="G.code" :tail="60"/>

  <div v-if="predict.length" v-for="i in predict">
    <simple-kline :code="i.match_code._id" :days="i.period" :start_date="i.start_date"/>
  </div>
</template>

<script setup>
import { onMounted ,ref } from "vue";
import { useStore } from "vuex";
import Kline from "./kline.vue";
import SimpleKline from "./simpleKline.vue";

const store = useStore()
const S = store.state
const G = store.getters

const predict = ref([])

onMounted(() => {
  getPredictData()
})

const getPredictData = () => {
  S.axios({
    url: '/api/stock/predict',
    params: {
      code: G.code,
      period: 60
    }
  }).then(res => {
    predict.value = res.data.data.slice(0,5)
  })
}
</script>