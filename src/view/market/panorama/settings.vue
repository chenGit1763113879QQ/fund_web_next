<template>
  <n-alert type="info">
    更改配置后刷新生效
  </n-alert>
  <br>
  <n-form label-placement="left"
          require-mark-placement="right-hanging">

    <n-form-item label="动画效果">
      <n-switch size="small" v-model:value="enableAnimate"/>
    </n-form-item>

    <n-form-item label="简略图表">
      <n-dropdown size="small"
                  @select="handleSelect" :options="[
                        {label: '分时行情', key: 'minute'},
                        {label: '60日', key: '60day'},
                        {label: '100日', key: '100day'}]">
        <n-button size="small">{{ {'minute': '分时行情', '60day': '60日', '100day': '100日'}[simpleChart] }}</n-button>
      </n-dropdown>
    </n-form-item>
  </n-form>
</template>

<script setup>
import {ref, watch} from "vue";

const enableAnimate = ref(localStorage.getItem('enableAnimate') > 0)
watch(enableAnimate, () => {
  localStorage.setItem('enableAnimate', enableAnimate.value ? '1' : '0')
})

if (!localStorage.getItem('simpleChart')) localStorage.setItem('simpleChart', 'minute')
const simpleChart = ref(localStorage.getItem('simpleChart'))
const handleSelect = (i) => {
  simpleChart.value = i
  localStorage.setItem('simpleChart', i)
}
</script>