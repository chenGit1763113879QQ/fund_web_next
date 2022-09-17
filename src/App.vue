<template>
  <n-message-provider>
    <router-view/>
  </n-message-provider>
</template>

<script setup>
import {useStore} from "vuex";

const store = useStore()
store.commit('init')
</script>