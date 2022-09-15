<template>
  <n-space>
    <n-radio v-for="i in [
        {code: code.MARKET_CN, label: '沪深'},
        {code: code.MARKET_HK, label: '香港'},
        {code: code.MARKET_US, label: '美股'}
      ]"
             :checked="checkedValue === i.code"
             :value="i.code"
             :label="i.label"
             @change="handleChange"/>
  </n-space>

  <div id="treeMap" style="height: 820px"/>
</template>

<script setup>
import {onMounted, ref, watch} from "vue";
import * as echarts from 'echarts';
import {useRouter} from "vue-router";
import {useStore} from "vuex";
import * as code from "../../components/common/code.js";

let myChart
const data = ref([])
const checkedValue = ref(1)

const router = useRouter()
const store = useStore()

const handleChange = (e) => {
  checkedValue.value = Number(e.target.value)
}

onMounted(() => {
  initChart()
  getData()
  setInterval(() => {
    getData()
  }, 3000)
})

watch(data, () => plot())
watch(checkedValue, () => getData())

const getData = () => {
  store.state.axios({
    url: '/api/market/bkpro',
    params: {
      market: checkedValue.value,
    }
  }).then(res => {
    data.value = res.data.data
  })
}

// 获取板块背景颜色
const getColor = (pct) => {
  if (pct >= 8) return 'rgba(250,65,65,0.7)'
  if (pct >= 6) return 'rgba(250,65,65,0.65)'
  if (pct >= 4) return 'rgba(250,65,65,0.6)'
  if (pct >= 2) return 'rgba(250,65,65,0.5)'
  if (pct > 0) return 'rgba(250,65,65,0.4)'
  if (pct === 0) return 'rgb(210,210,210)'
  if (pct <= -8) return 'rgba(0,185,100,0.7)'
  if (pct <= -6) return 'rgba(0,185,100,0.65)'
  if (pct <= -4) return 'rgba(0,185,100,0.6)'
  if (pct <= -2) return 'rgba(0,185,100,0.5)'
  if (pct < 0) return 'rgba(0,185,100,0.4)'
}

// 绘制
const plot = () => {
  let series = []

  data.value.forEach(i => {
    let children = []
    i['children'].forEach((j) => {
      if (j.mc > 100 * 10 ** 8) children.push({
        code: j._id,
        name: j.name,
        value: j.amount,
        pct_chg: j.pct_chg,
        itemStyle: {
          color: getColor(j['pct_chg']),
        }
      })
    })

    series.push({
      code: i['_id'],
      name: i.name,
      pct_chg: i['pct_chg'],
      value: i['amount'],
      children: children,
      itemStyle: {
        color: getColor(i['pct_chg']),
        borderColor: getColor(i['pct_chg']),
      }
    })
  })
  myChart.setOption({
    series: [{data: series}]
  })
}

// 初始化图表
const initChart = () => {
  myChart = echarts.init(document.getElementById('treeMap'))
  myChart.setOption({
    tooltip: {
      formatter: function (v) {
        return v.name + '\n' + Number(v.data.pct_chg).toFixed(2) + '%'
      }
    },
    series: [
      {
        animationDuration: 0,
        animationDelay: 0,
        animationDurationUpdate: 500,
        name: '板块',
        type: 'treemap',
        left: 10, right: 10, top: 25, bottom: 0,
        label: {
          color: 'black',
        },
        upperLabel: {
          show: true
        },
        levels: [
          {
            itemStyle: {
              borderColor: 'rgb(155,155,155)',
              borderWidth: 0,
              gapWidth: 1,
            },
            upperLabel: {
              show: false
            }
          },
          {
            itemStyle: {
              borderWidth: 5,
              gapWidth: 1,
            }
          }
        ]
      }
    ]
  })
  myChart.on('dblclick', (params) => {
    let i = params.data
    if (!i) return
    router.push({name: 'items', params: {code: i.code}})
  })
}
</script>