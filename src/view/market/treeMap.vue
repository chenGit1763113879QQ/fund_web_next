<template>
  <div id="treeMap" style="height: 830px"/>
</template>

<script setup>
import {onMounted, ref, watch} from "vue";
import * as echarts from 'echarts';
import {useRouter} from "vue-router";
import {useStore} from "vuex";

let myChart
const data = ref([])

const router = useRouter()
const store = useStore()

onMounted(() => {
  initChart()
  getData()
})

watch(data, () => plot())

const getData = () => {
  store.state.axios({
    url: '/api/market/bkpro',
  }).then(res => {
    data.value = res.data.data
  })
}

// 获取板块背景颜色
const getColor = (pct) => {
  let red = 'rgba(250,65,65,'
  let green = 'rgba(0,185,100,'
  if (pct >= 5) return red + '0.6)'
  else if (pct >= 3) return red + '0.5)'
  else if (pct > 0) return red + '0.4)'
  else if (pct === 0) return 'rgba(140,140,140,0.5)'
  else if (pct <= -5) return green + '0.6)'
  else if (pct <= -3) return green + '0.5)'
  else if (pct < 0) return green + '0.4)'
}

// 绘制
const plot = () => {
  let series = []

  data.value.forEach(i => {
    let children = []
    i['children'].forEach((j) => {
      if (j.amount > 3 * i['amount'] / i['count']) children.push({
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
    title: {
      left: 'center', text: '沪深板块',
    },
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
        left: 10, right: 10, top: 35, bottom: 0,
        label: {
          fontSize: 13, color: 'black',
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