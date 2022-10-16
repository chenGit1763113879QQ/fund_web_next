<template>
  <div :id="id" style="margin-left: 5%"/>
</template>

<script setup>
import {createChart} from "lightweight-charts";
import {onMounted, ref} from "vue";
import {useStore} from "vuex";
import {useMessage} from "naive-ui";

const store = useStore()
const msg = useMessage()
const S = store.state
const id = ref(new Date().toDateString())

const props = defineProps({
  code: String,
  start_date: String,
  days: Number,
  tail: Number,
})

let kline, myChart, klineData

onMounted(() => {
  initChart()
  getData()
})

const getData = () => {
  S.axios({
    url: '/api/stock/chart/kline',
    params: {
      code: props.code,
      period: 'd',
      start_date: props.start_date,
      head: props.days ? props.days + 20 : null,
      tail: props.tail ? props.tail : null,
    }
  }).then(res => {
    klineData = res.data.data
    if (!klineData) {
      msg.error('获取K线数据失败', G.msgOpt)
      return
    }

    kline.setData(klineData)
    kline.setMarkers([
      {time: klineData[60-1].time, position: 'belowBar', color: window.$primary, shape: 'circle'}
    ])

    myChart.timeScale().setVisibleLogicalRange({
      from: klineData.length - 80,
      to: klineData.length - 1
    })
  })
}

// 初始化
const initChart = () => {
  myChart = createChart(document.getElementById(id.value), {
    width: document.body.clientWidth * 0.32,
    height: 200,
    rightPriceScale: {
      scaleMargins: {
        top: 0,
        bottom: 0,
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

  // k线
  kline = myChart.addCandlestickSeries({
    upColor: window.$red,
    downColor: window.$green,
    borderUpColor: window.$red,
    borderDownColor: window.$green,
    wickUpColor: window.$red,
    wickDownColor: window.$green,
    priceLineVisible: false,
    lastValueVisible: false,
  })
}
</script>
