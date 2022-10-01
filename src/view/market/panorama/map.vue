<template>
  <n-card size="small">
    <n-space size="large" style="float: left">
      <n-tag>
        市场板块全景图
        <template #avatar>
          <img alt="icon" width="20" height="20" src="/favicon.ico">
        </template>
      </n-tag>

      <div style="margin-top: 4px">
        <n-time v-if="market.TradeTime" :time="market.TradeTime"/>
      </div>
    </n-space>

    <n-space size="large" style="float: right; margin-top: 4px">
      <n-popover trigger="hover">
        <template #trigger>
          <n-gradient-text type="error">
            指标选择
          </n-gradient-text>
        </template>
        代表树图的面积大小
      </n-popover>
      <span>
        <n-radio
            v-for="i in [['amount','成交额'], ['mc', '市值'], ['followers', '关注数']]"
            :checked="areaValue === i[0]"
            :value="i[0]" :label="i[1]"
            @click="areaValue = i[0]"/>
      </span>
      &emsp;
      <n-popover trigger="hover">
        <template #trigger>
          <n-gradient-text type="info">
            市场选择
          </n-gradient-text>
        </template>
        仅展示具有代表性的板块及股票
      </n-popover>
      <span>
        <n-radio
            v-for="i in [[code.MARKET_CN, '沪深'], [code.MARKET_HK, '港股'], [code.MARKET_US, '美股']]"
            :checked="marketValue === i[0]"
            :value="i[0]" :label="i[1]"
            @change="marketValue = i[0]"/>
      </span>
      &ensp;
      <n-icon size="18" @click="active=true" style="margin-top: 2px">
        <SettingsOutline/>
      </n-icon>
    </n-space>
  </n-card>

  <div id="treeMap"/>

  <n-drawer v-model:show="active" default-width="380" placement="right" resizable>
    <n-drawer-content title="设置">
      <settings/>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup>
import {onMounted, ref, watch} from "vue";
import * as echarts from 'echarts';
import {useRouter} from "vue-router";
import {useStore} from "vuex";
import * as code from "../../../components/common/code.js";
import {createChart} from "lightweight-charts";
import * as chartOpt from "../../../components/common/chart.js";
import {formatNumber, NewWebSocket} from "../../../components/common/func.js";
import {SettingsOutline} from '@vicons/ionicons5';
import Settings from "./settings.vue";

let chart, lineChart, lineSeries, zeroLine, uniqueCode, ws

const data = ref([])
let chartData = {}

const areaValue = ref('amount')
const marketValue = ref(1)
const active = ref(false)

let tradeTimer
const market = ref({
  TradeTime: null,
  Status: false,
  StatusName: '',
})

const router = useRouter()
const store = useStore()

onMounted(() => {
  initChart()
  initWebsocket()
  getData()
  setInterval(() => {
    if (market.value.Status) getData()
  }, 3000)
})

watch([marketValue, areaValue], () => {
  ws.send(JSON.stringify({market: marketValue.value}))
  getData()
})
watch(data, () => plot())

const getData = () => {
  store.state.axios({
    url: '/api/market/bk',
    params: {
      market: marketValue.value,
      sort: areaValue.value,
    }
  }).then(res => {
    data.value = res.data.data
  })
}

// 获取板块涨幅背景颜色
const getColor = (pct) => {
  if (pct >= 8) return 'rgba(250,65,65,0.7)'
  if (pct >= 6) return 'rgba(250,65,65,0.6)'
  if (pct >= 4) return 'rgba(250,65,65,0.5)'
  if (pct >= 2) return 'rgba(250,65,65,0.4)'
  if (pct > 0) return 'rgba(250,65,65,0.3)'

  if (pct === 0) return 'rgb(210,210,210)'

  if (pct <= -8) return 'rgba(0,185,100,0.8)'
  if (pct <= -6) return 'rgba(0,185,100,0.7)'
  if (pct <= -4) return 'rgba(0,185,100,0.6)'
  if (pct <= -2) return 'rgba(0,185,100,0.5)'
  if (pct < 0) return 'rgba(0,185,100,0.4)'
}

// 行业涨幅背景颜色
const getBKColor = (pct) => {
  if (pct > 0) return 'rgba(235,65,65,0.8)'
  if (pct === 0) return 'rgb(210,210,210)'
  if (pct < 0) return 'rgb(38,168,138)'
}

const initWebsocket = () => {
  ws = NewWebSocket('/notify')
  ws.onopen = () => {
    ws.send(JSON.stringify({market: marketValue.value}))
  }
  ws.onmessage = (i) => {
    let res = JSON.parse(i.data)
    switch (res.type) {
      case 'minute':
        chartData = res.data
        break

      case 'status':
        market.value = res.data
        if (market.value.Status) tradeTimer = setInterval(() => {
          market.value.TradeTime = new Date()
        }, 100)
        else {
          market.value.TradeTime = new Date(market.value.TradeTime)
          clearInterval(tradeTimer)
        }
    }
  }
}

// 绘制
const plot = () => {
  let series = []

  data.value.forEach(i => {
    let children = i['children'].map(j => {
      return {
        code: j._id,
        name: j.name,
        mc: j.mc,
        value: j[areaValue.value],
        amount: j.amount,
        pct_chg: j.pct_chg,
        price: j.price,
        itemStyle: {
          color: getColor(j['pct_chg']),
        }
      }
    })

    // 过滤子节点
    children = children.filter(i => i.amount > 0)
    children = children.sort((i, j) => {
      return j.mc - i.mc
    }).slice(0, 8)

    series.push({
      code: i['_id'],
      name: i.name,
      pct_chg: i['pct_chg'],
      value: i[areaValue.value],
      children: children,
      itemStyle: {
        color: getColor(i['pct_chg']),
        borderColor: getBKColor(i['pct_chg']),
      }
    })
  })
  chart.setOption({
    series: [{data: series}]
  })
}

let timer
const plotSimpleChart = (data) => {
  let pct = data.pct_chg
  let id = data.code

  if (uniqueCode !== id) {
    chartData = {}
    uniqueCode = id

    clearTimeout(timer)
    timer = setTimeout(() => {
      ws.send(JSON.stringify({code: id, market: marketValue.value, chart: localStorage.getItem('simpleChart')}))
    }, 10)
  }

  let elem = document.createElement('div')

  let color = pct > 0 ? 'red' : (pct < 0 ? 'green' : 'gray')

  elem.innerHTML = `${data.name}&ensp;<span style="color: darkgray; font-size: 0.5rem">${id ? id : ''}</span><br>
    <span style="color:${color}">${data.price ? data.price.toFixed(2) : '-- --'}</span>&nbsp;
    <span style="color:${color}">${pct > 0 ? '+' : ''}${pct !== undefined ? pct.toFixed(2) : '-- --'}%</span>
    <div style="color: darkgray; font-size: 0.5rem">${formatNumber(data.value)}</div>
    <div style="height: 5px"/>`

  // 图表实例
  lineChart = createChart(elem, chartOpt.chartOptions)
  lineChart.applyOptions({
    width: 110, height: 42,
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
      top: 0.02,
      bottom: 0.02,
    }
  })

  if (chartData && chartData.value) {
    // 零轴
    zeroLine = lineSeries.createPriceLine({
      color: 'rgb(210,210,210)',
      price: chartData.open,
      lineWidth: 1.2,
    })

    // 数据项
    lineSeries.setData(chartData.value)

    // 时间轴范围
    lineChart.timeScale().setVisibleLogicalRange({
      from: -1, to: chartData.total,
    })

    let bool = pct > 0
    let arr = chartData.value.map(i => {
      return i.value
    })

    // 图表颜色
    let red = 'rgba(255,65,65,'
    let green = 'rgba(0,180,100,'
    let gray = 'rgba(140,140,140,'
    lineSeries.applyOptions({
      // 红色比较靠上，需要更浅一些
      topColor: bool ? red + '0.25)' : (!bool ? green + '0.25)' : gray + '0.25)'),
      bottomColor: bool ? red + '0)' : (!bool ? green + '0)' : gray + '0)'),
      lineColor: bool ? red + '1)' : (!bool ? green + '1)' : gray + '1)'),
      // 范围
      autoscaleInfoProvider: () => ({
        priceRange: {
          maxValue: Math.max(...arr),
          minValue: Math.min(...arr),
        }
      })
    })
  }
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
        animation: localStorage.getItem('enableAnimate') > 0,
        animationDurationUpdate: 500,
        name: '板块',
        type: 'treemap',
        left: 15, right: 15, top: 0, bottom: 15,
        label: {color: 'black'},
        upperLabel: {show: true},
        levels: [
          {
            itemStyle: {gapWidth: 1},
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
    router.push({name: 'items', params: {code: e.data.code}})
  })

  // resize
  chart.resize({
    height: 790,
    width: document.body.clientWidth
  })
}
</script>