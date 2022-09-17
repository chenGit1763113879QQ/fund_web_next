<template>
  <n-card size="small">
    <n-tag>
      市场板块全景图
      <template #avatar>
        <img width="20" height="20" src="../../../public/favicon.ico">
      </template>
    </n-tag>

    <n-space style="float: right">
      <n-gradient-text type="danger">
        面积选择
      </n-gradient-text>
      |
      <span>
        <n-radio
            v-for="i in [['amount','成交额'], ['mc', '市值'], ['followers', '关注数']]"
            :checked="areaValue === i[0]"
            :value="i[0]" :label="i[1]"
            @click="areaValue = i[0]"/>
      </span>

      &emsp;
      <n-gradient-text type="info">
        市场选择
      </n-gradient-text>
      |
      <span>
        <n-radio
            v-for="i in [[code.MARKET_CN, '沪深'], [code.MARKET_HK, '港股'], [code.MARKET_US, '美股']]"
            :checked="marketValue === i[0]"
            :value="i[0]" :label="i[1]"
            @change="marketValue = i[0]"/>
      </span>

      &emsp;
      <n-popover trigger="hover">
        <template #trigger>
          <n-gradient-text type="info">
            范围筛选
          </n-gradient-text>
        </template>
        范围过大会造成图表卡顿
      </n-popover>
      |
      <n-dropdown size="small"
                  @select="handleSelect" :options="[
                      {label: '>200亿', key: 200},
                      {label: '>150亿', key: 150},
                      {label: '>100亿', key: 100},
                      {label: '>50亿', key: 50}]">
        <n-tag size="small" :bordered="false">>{{ mcValue }}亿</n-tag>
      </n-dropdown>
    </n-space>
  </n-card>

  <div id="treeMap"/>
</template>

<script setup>
import {onMounted, ref, watch} from "vue";
import * as echarts from 'echarts';
import {useRouter} from "vue-router";
import {useStore} from "vuex";
import * as code from "../../components/common/code.js";
import {createChart} from "lightweight-charts";
import * as chartOpt from "../../components/common/chart.js";
import {NewWebSocket} from "../../components/common/func.js";

let chart, lineChart, lineSeries, zeroLine, uniqueCode
let ws

const data = ref([])
const lineData = ref([])

const areaValue = ref('amount')
const marketValue = ref(1)
const mcValue = ref(100)

const handleSelect = (i) => {
  mcValue.value = i
}

const router = useRouter()
const store = useStore()

onMounted(() => {
  initChart()
  initWebsocket()
  getData()
  setInterval(() => {
    getData()
  }, 3000)
})

watch(marketValue, () => getData())
watch([data, areaValue, mcValue], () => plot())

const getData = () => {
  store.state.axios({
    url: '/api/market/bkpro',
    params: {market: marketValue.value}
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

const initWebsocket = () => {
  ws = NewWebSocket('/notify')
  ws.onmessage = (i) => {
    let data = JSON.parse(i.data)
    lineData.value = data.data
  }
}

// 绘制
const plot = () => {
  let series = []
  let count = 0

  data.value.forEach(i => {
    let children = []
    i['children'].forEach((j) => {
      if (j.mc > mcValue.value * 10 ** 8 && j.amount > 0) children.push({
        code: j._id,
        name: j.name,
        value: j[areaValue.value],
        pct_chg: j.pct_chg,
        price: j.price,
        itemStyle: {
          color: getColor(j['pct_chg']),
        }
      })
    })

    count += children.length

    series.push({
      code: i['_id'],
      name: i.name,
      pct_chg: i['pct_chg'],
      value: i[areaValue.value],
      price: i['price'],
      children: children,
      itemStyle: {
        color: getColor(i['pct_chg']),
        borderColor: i['pct_chg'] > 0 ? 'rgba(235,65,65,0.9)' : 'rgb(38,168,138)',
      }
    })
  })
  chart.setOption({
    series: [{data: series}]
  })
  console.log('渲染股票总数:', count)
}

const plotSimpleChart = (data) => {
  let pct = data.pct_chg
  let price = data.price
  let name = data.name
  let id = data.code

  let elem = document.createElement('div')

  let color = pct > 0 ? 'red' : (pct < 0 ? 'green' : 'gray')

  elem.innerHTML = `${name}&ensp;<span style="color: darkgray; font-size: 0.5rem">${id ? id : ''}</span><br>
    <span style="color:${color}">${price !== undefined ? price.toFixed(2) : '-- --'}</span>&nbsp;
    <span style="color:${color}">${pct > 0 ? '+' : ''}${pct !== undefined ? pct.toFixed(2) : '-- --'}%</span>
    <div style="height: 5px"/>`

  if (uniqueCode !== id) {
    lineData.value = []
    uniqueCode = id
  }

  // 图表实例
  lineChart = createChart(elem, chartOpt.chartOptions)
  lineChart.applyOptions({
    width: 100, height: 40,
    timeScale: {visible: false},
    grid: {
      vertLines: {visible: false}
    }
  })
  // 面积图组件
  lineSeries = lineChart.addAreaSeries(chartOpt.lineOptions)
  lineSeries.applyOptions({
    lineWidth: 1,
    scaleMargins: {
      top: 0.01,
      bottom: 0.01,
    }
  })
  // 零轴
  zeroLine = lineSeries.createPriceLine(chartOpt.priceLine)

  // 时间轴范围
  lineChart.timeScale().setVisibleLogicalRange({
    from: -1, to: 60,
  })

  // 图表颜色
  let red = 'rgba(250,68,68,'
  let green = 'rgba(20,185,100,'
  let gray = 'rgba(140,140,140,'
  lineSeries.applyOptions({
    // 红色比较靠上，需要更浅一些
    topColor: pct > 0 ? red + '0.2)' : (pct < 0 ? green + '0.25)' : gray + '0.25)'),
    bottomColor: pct > 0 ? red + '0)' : (pct < 0 ? green + '0)' : gray + '0)'),
    lineColor: pct > 0 ? red + '1)' : (pct < 0 ? green + '1)' : gray + '1)'),
  })

  if (!lineData.value) lineSeries.setData([])
  else lineSeries.setData(lineData.value.map(i => {
    return {time: i['time'], value: i['pct_chg']}
  }))
  return elem
}

// 初始化图表
const initChart = () => {
  chart = echarts.init(document.getElementById('treeMap'))
  chart.setOption({
    tooltip: {
      formatter: v => plotSimpleChart(v.data)
    },
    series: [
      {
        animationDurationUpdate: 500,
        name: '板块',
        type: 'treemap',
        left: 15, right: 15, top: 0, bottom: 0,
        label: {
          color: 'black',
        },
        upperLabel: {show: true},
        levels: [
          {
            itemStyle: {
              gapWidth: 1,
            },
            upperLabel: {show: false}
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

  // events
  chart.on('dblclick', e => {
    let i = e.data
    if (!i) return
    router.push({name: 'items', params: {code: i.code}})
  })

  let timer
  chart.on('mouseover',e => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      ws.send(JSON.stringify({code: e.data.code}))
    }, 30)
  })

  // resize
  chart.resize({
    height: 790,
    width: document.body.clientWidth
  })
}
</script>