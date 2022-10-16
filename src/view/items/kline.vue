<template>
  <n-card size="small">
    <n-space size="large" style="float: left">
      <n-tag>
        K线图表
        <template #avatar>
          <img alt="icon" width="20" height="20" src="/favicon.ico">
        </template>
      </n-tag>
    </n-space>

    <n-space size="large" style="float: right; margin-top: 4px">
      <n-gradient-text type="info">
        周期
      </n-gradient-text>
      <span>
        <n-radio
            v-for="i in [['d','日'], ['w', '周'], ['m', '月'], ['y', '年']]"
            :checked="periodValue === i[0]"
            :value="i[0]" :label="i[1]"
            @click="periodValue = i[0]"/>
      </span>
      &emsp;
      <n-gradient-text type="error">
        主图
      </n-gradient-text>
      <span>
        <n-radio
            v-for="i in [['avg','均线'], ['boll', 'BOLL'], ['avgKline', '平均K线']]"
            :checked="plotValue === i[0]"
            :value="i[0]" :label="i[1]"
            @click="plotValue = i[0]"/>
      </span>
      &emsp;
      <n-gradient-text type="error">
        副图
      </n-gradient-text>
      <span>
        <n-radio
            v-for="i in [['vol','成交量'], ['amount', '成交额'], ['main_net', '大单净额'], ['macd', 'MACD'], ['winner_rate', '盈利筹码'], ['ratio', '港资持股']]"
            :checked="subplotValue === i[0]"
            :value="i[0]" :label="i[1]"
            @click="subplotValue = i[0]"/>
      </span>
    </n-space>
  </n-card>

  <div id="klineChart" style="margin-left: 5%"/>
</template>

<script setup>
import boll from 'bollinger-bands';
import {createChart} from "lightweight-charts";
import {ma} from 'moving-averages';
import {onMounted, ref, watch} from "vue";
import {useStore} from "vuex";
import {useMessage} from "naive-ui";

const store = useStore()
const msg = useMessage()
const G = store.getters
const S = store.state

const periodValue = ref('d')
const plotValue = ref('avg')
const subplotValue = ref('vol')

watch(periodValue, () => plot())
watch(plotValue, () => plotMain())
watch(subplotValue, () => plotSub())

let kline, myChart
let ma5, ma10, ma20, vol, vol1, vol2, area, klineData

onMounted(() => {
  initChart()
  plot()
})

// 绘制标签
const plotMarker = () => {
  return
  if (periodValue.value !== 'd') {
    kline.setMarkers([])
    return
  }

  S.axios({
    url: '/api/back/logs',
    params: {
      code: G.code,
      coll: 'win_rate',
    }
  }).then(res => {
    let logs = res.data.data['logs']
    logs = logs.filter(i => new Date(i.time) >= new Date('2020/01/01'))

    kline.setMarkers(logs.map(i => {
      if (i.type === 0) return {time: i.time, position: 'belowBar', color: '#e91e63', shape: 'arrowUp', text: '买'}
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

  switch (plotValue.value) {
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

  switch (plotValue.value) {
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

  let idc = subplotValue.value

  if (idc === 'vol' || idc === 'amount') {
    let bar = klineData.map(i => i[idc])
    let ma5 = ma(bar, 5)
    let ma10 = ma(bar, 10)

    klineData.forEach((i, idx) => {
      vol.update({time: i.time, value: i[idc], color: i.close >= i.open ? window.$lRed : window.$lGreen})
      vol1.update({time: i.time, value: ma5[idx]})
      vol2.update({time: i.time, value: ma10[idx]})
    })
  }
  // 红绿柱形图
  else if (idc === 'main_net' || idc === 'net') {
    klineData.forEach(i => {
      vol.update({time: i.time, value: i[idc], color: i[idc] >= 0 ? window.$lRed : window.$lGreen})
    })
  }
  // MACD
  else if (idc === 'macd') {
    klineData.forEach(i => {
      vol.update({time: i.time, value: i.macd, color: i.macd > 0 ? window.$lRed : window.$lGreen})
      vol1.update({time: i.time, value: i['macd_dea']})
      vol2.update({time: i.time, value: i['macd_dif']})
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
      period: periodValue.value,
    }
  }).then(res => {
    klineData = res.data.data
    if (!klineData) {
      msg.error('获取K线数据失败', G.msgOpt)
      return
    }
    plotMain()
    plotSub()
    plotMarker()

    myChart.timeScale().setVisibleLogicalRange({
      from: klineData.length - 200,
      to: klineData.length + 5
    })
  })
}

// 初始化
const initChart = () => {
  // 副图距离顶部距离
  let bottom = 0.76
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
      tickMarkFormatter: t => {
        return t.year + '-' + t.month
      }
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
    upColor: window.$red,
    downColor: window.$green,
    borderUpColor: window.$red,
    borderDownColor: window.$green,
    wickUpColor: window.$red,
    wickDownColor: window.$green,
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
  })
}
</script>
