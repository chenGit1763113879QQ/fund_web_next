<template>
  <n-menu v-model:value="activeKey" mode="horizontal" :options="menuOptions"/>
</template>

<script setup>
import {h, ref} from "vue";
import {NIcon} from "naive-ui";
import {BookOutline as BookIcon} from "@vicons/ionicons5"

const activeKey = ref(null)

function renderIcon(icon) {
  return () => h(NIcon, null, {default: () => h(icon)})
}

const menuOptions = [
  {
    label: "周期",
    key: "period",
    icon: renderIcon(BookIcon),
    children: [
      {
        label: "日K", key: "d"
      },
      {
        label: "周K", key: "w"
      },
      {
        label: "月K", key: "m"
      }
    ]
  },
  {
    label: "1973年的弹珠玩具",
    key: "pinball-1973",
    icon: renderIcon(BookIcon),
    children: [
      {
        label: "鼠",
        key: "rat"
      }
    ]
  }
]
</script>