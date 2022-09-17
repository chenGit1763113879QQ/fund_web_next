<template>
  <n-card>
    <template #header>
      <kline-menu/>
    </template>
    <div id="klineChart"/>
  </n-card>
</template>

<script setup>
import {createChart} from "lightweight-charts";
import boll from 'bollinger-bands';
import {ma} from 'moving-averages';
import macd from 'macd';
import {computed, onMounted, ref} from "vue";
import {useStore} from "vuex";
import KlineMenu from "./klineMenu.vue";

const store = useStore()
const G = store.getters
const S = store.state

const period = ref('d')

// 主图指标
let main = 0
let mainOpt = ['avg', 'boll', 'avgKline', null]

// 副图指标
let indicate = 0
const indicateOpt = computed(() => {
  let marketType = G.marketType
  let type = G.type

  if (marketType !== 'CN') return ['vol', 'amount', 'macd']
  else if (type === 'stock') return ['vol', 'amount', 'main_net', 'macd', 'winner_rate', 'ratio', 'lrye']
  else if (['I1', 'I2', 'C'].includes(type)) return ['vol', 'main_net', 'macd', 'winner_rate', 'ratio']
  else return ['vol', 'amount', 'macd']
})

let kline, myChart
let ma5, ma10, ma20, vol, vol1, vol2, area, klineData

onMounted(() => {
  initChart()
  plot()
})

const plotMarker = () => {
  S.axios({
    url: '/api/back/logs',
    params: {
      code: G.code,
      coll: 'win_rate',
    }
  }).then(res => {
    let logs = res.data.data['logs']
    kline.setMarkers(logs.map(i => {
      if (i.type===0) return {time: i.time, position: 'belowBar', color: '#e91e63', shape: 'arrowUp', text: '买'}
      else return {time: i.time, position: 'aboveBar', color: '#2196F3', shape: 'arrowDown', text: '卖'}
    }))
  })
}

// 绘制主图
const plotMain = () => {
  ma5.setData([])
  ma10.setData([])
  ma20.setData([])

  let arr = [], arr2, arr3, avgKline
  let close = klineData.map(i => i.close)

  switch (mainOpt[main]) {
    case 'boll':
      if (close.length < 20) return

      arr = boll(close, 20, 2)
      ma5.setData(klineData.map((i, index) => {
        return {time: i.time, value: arr.upper[index]}
      }))
      ma10.setData(klineData.map((i, index) => {
        return {time: i.time, value: arr.lower[index]}
      }))
      ma20.setData(klineData.map((i, index) => {
        return {time: i.time, value: arr.mid[index]}
      }))
      break

    case 'avg':
      arr = ma(close, 5)
      arr2 = ma(close, 10)
      arr3 = ma(close, 20)

      ma5.setData(klineData.map((i, index) => {
        return {time: i.time, value: arr[index]}
      }))
      ma10.setData(klineData.map((i, index) => {
        return {time: i.time, value: arr2[index]}
      }))
      ma20.setData(klineData.map((i, index) => {
        return {time: i.time, value: arr3[index]}
      }))
  }

  switch (mainOpt[main]) {
    case 'avgKline':
      avgKline = JSON.parse(JSON.stringify(klineData))
      for (let i = 1; i < avgKline.length; i++) {
        let last = avgKline[i - 1]
        let now = avgKline[i]
        now.open = (last.open + last.close) / 2
        now.close = (now.open + now.high + now.high + now.low) / 4
        arr.push(now)
      }
      kline.setData(arr)
      break
    default:
      kline.setData(klineData)
  }
}

// 绘制副图
const plotSub = () => {
  vol.setData([])
  vol1.setData([])
  vol2.setData([])
  area.setData([])

  let idc = indicateOpt.value[indicate]
  let close = klineData.map(i => i.close)

  if (idc === 'vol' || idc === 'amount') {
    let bar = klineData.map(i => i[idc])
    let ma5 = ma(bar, 5)
    let ma10 = ma(bar, 10)

    klineData.forEach((i, idx) => {
      vol.update({time: i.time, value: i[idc], color: i.close >= i.open ? S.red1 : S.green1})
      vol1.update({time: i.time, value: ma5[idx]})
      vol2.update({time: i.time, value: ma10[idx]})
    })
  }
  // 红绿柱形图
  else if (['main_net'].includes(idc)) {
    klineData.forEach(i => {
      vol.update({time: i.time, value: i[idc], color: i[idc] >= 0 ? S.red1 : S.green1})
    })
  }
  // MACD
  else if (idc === 'macd') {
    let his = macd(close)
    klineData.forEach((i, idx) => {
      vol.update({time: i.time, value: his.histogram[idx], color: his.histogram[idx] > 0 ? S.red1 : S.green1})
      vol1.update({time: i.time, value: his.MACD[idx]})
      vol2.update({time: i.time, value: his.signal[idx]})
    })
  }
  // 面积图
  else if (['ratio', 'balance', 'winner_rate'].includes(idc)) {
    klineData.forEach(i => {
      if (i[idc]) area.update({
        time: i.time, value: idc === 'balance' ? i[idc] / 10 ** 8 : i[idc]
      })
    })
  }
}

const plot = () => {
  S.axios({
    url: '/api/stock/chart/kline',
    params: {
      code: G.code,
      period: period.value,
    }
  }).then(res => {
    klineData = res.data.data
    plotMain()
    plotSub()
    plotMarker()
  })
}

// 初始化
const initChart = () => {
  // 副图距离顶部距离
  let bottom = 0.8
  // 主图距离底部距离
  let top = 0.28

  myChart = createChart(document.getElementById('klineChart'), {
    width: document.body.clientWidth * 0.8,
    height: 620,
    rightPriceScale: {
      scaleMargins: {
        top: 0.05,
        bottom: top,
      },
      borderVisible: false,
    },
    handleScale: {
      axisPressedMouseMove: {
        price: false,
      }
    },
    timeScale: {
      fixLeftEdge: true,
      borderVisible: false,
    },
    grid: {
      horzLines: {
        color: 'rgba(140,140,140,0.1)',
      },
      vertLines: {
        color: 'rgba(140,140,140,0.1)',
      },
    }
  })

  let lineOptions = {
    lineWidth: 1,
    lastValueVisible: false,
    priceLineVisible: false,
  }

  // k线
  kline = myChart.addCandlestickSeries({
    upColor: S.red1,
    downColor: S.green1,
    borderUpColor: S.red1,
    borderDownColor: S.green1,
    wickUpColor: S.red1,
    wickDownColor: S.green1,
  })

  // 成交量
  vol = myChart.addHistogramSeries({
    priceScaleId: 'v1',
    scaleMargins: {
      top: bottom,
      bottom: 0,
    },
    lastValueVisible: false,
    priceLineVisible: false,
  })

  // 均线
  ma5 = myChart.addLineSeries(lineOptions)
  ma5.applyOptions({color: '#ff9900'})

  ma10 = myChart.addLineSeries(lineOptions)
  ma10.applyOptions({color: '#a460b4'})

  ma20 = myChart.addLineSeries(lineOptions)
  ma20.applyOptions({color: window.$primary})

  // 副图的两条均线
  vol1 = myChart.addLineSeries(lineOptions)
  vol1.applyOptions({
    color: '#2db7f5',
    priceScaleId: 'v1',
    scaleMargins: {
      top: bottom,
      bottom: 0,
    },
  })
  vol2 = myChart.addLineSeries(lineOptions)
  vol2.applyOptions({
    color: '#ff9900',
    priceScaleId: 'v1',
    scaleMargins: {
      top: bottom,
      bottom: 0,
    },
  })

  // 面积图
  area = myChart.addAreaSeries({
    priceScaleId: 'l1',
    scaleMargins: {
      top: bottom,
      bottom: 0,
    },
    lineWidth: 1.3,
    lineColor: window.$primary,
    topColor: 'rgba(0,120,255,0.05)',
    bottomColor: 'rgba(0,120,255,0.05)',
    priceLineVisible: false,
  })
}
</script>
