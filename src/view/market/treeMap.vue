<template>
  <n-card size="small">
    <n-tag @click="msg.info('点我干嘛', {duration: 1500})">
      市场全景图
      <template #avatar>
        <img width="20" height="20" src="../../../public/favicon.ico">
      </template>
    </n-tag>

    <n-space style="float: right">
      <n-gradient-text type="danger">
        面积选择
      </n-gradient-text>
      |
      <n-radio
          v-for="i in [['amount','成交额'], ['mc', '市值'], ['followers', '关注数']]"
          :checked="areaValue === i[0]"
          :value="i[0]" :label="i[1]"
          @click="areaValue = i[0]"/>

      &emsp;
      <n-gradient-text type="info">
        市场选择
      </n-gradient-text>
      |
      <n-radio
          v-for="i in [[code.MARKET_CN, '沪深'], [code.MARKET_HK, '港股'], [code.MARKET_US, '美股']]"
          :checked="marketValue === i[0]"
          :value="i[0]" :label="i[1]"
          @change="marketValue = i[0]"/>

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
                      {label: '>100亿', key: 100},
                      {label: '>50亿', key: 50},
                      {label: '全部', key: 0}]">
        <n-tag size="small" :bordered="false">>{{ mcValue }}亿</n-tag>
      </n-dropdown>
    </n-space>
  </n-card>
  <div id="treeMap" style="height: 800px"/>
</template>

<script setup>
import {onMounted, ref, watch} from "vue";
import * as echarts from 'echarts';
import {useRouter} from "vue-router";
import {useMessage} from "naive-ui";
import {useStore} from "vuex";
import * as code from "../../components/common/code.js";

let myChart
const data = ref([])
const areaValue = ref('amount')
const marketValue = ref(1)
const mcValue = ref(100)

const handleSelect = (i) => {
  mcValue.value = i
}

const router = useRouter()
const store = useStore()
const msg = useMessage()

onMounted(() => {
  initChart()
  getData()
  setInterval(() => {
    getData()
  }, 3000)
})

watch([data, areaValue, mcValue], () => plot())
watch(marketValue, () => getData())

const getData = () => {
  store.state.axios({
    url: '/api/market/bkpro',
    params: {
      market: marketValue.value,
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
      if (j.mc > mcValue.value * 10 ** 8 && j.amount > 0) children.push({
        code: j._id,
        name: j.name,
        value: j[areaValue.value],
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
      value: i[areaValue.value],
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
        left: 15, right: 15, top: 0, bottom: 5,
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