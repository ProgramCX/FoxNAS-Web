<template>
  <div class="not-found">
    <div class="not-found-content">
      <n-icon size="120" :depth="1">
        <AlertCircleOutline />
      </n-icon>
      <h1>404</h1>
      <p>页面未找到</p>
      <n-button type="primary" @click="router.push('/')">
        返回首页
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { AlertCircleOutline } from '@vicons/ionicons5'

const router = useRouter()
</script>

<style scoped lang="css">
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--bg-color-secondary);
}

.not-found-content {
  text-align: center;
  padding: 48px;
}

.not-found-content h1 {
  font-size: 72px;
  font-weight: 700;
  color: var(--text-color-base);
  margin: 24px 0;
}

.not-found-content p {
  font-size: 18px;
  color: var(--text-color-secondary);
  margin-bottom: 32px;
}
</style>
