<template>
  <n-modal
    v-model:show="visible"
    preset="card"
    :title="t('preview.transcodingProgress')"
    :mask-closable="false"
    :close-on-esc="false"
    :closable="true"
    style="max-width: 480px;"
    @close="handleMinimize"
  >
    <div class="transcode-progress" v-if="task">
      <!-- 文件名 -->
      <div class="file-info">
        <n-ellipsis :line-clamp="1" :tooltip="{ width: 300 }">
          {{ task.fileName }}
        </n-ellipsis>
      </div>

      <!-- 状态 -->
      <div class="status-section">
        <template v-if="task.state === 'pending'">
          <n-alert type="info" :bordered="false">{{ t('preview.waitingTranscode') }}</n-alert>
        </template>

        <template v-else-if="task.state === 'processing'">
          <div class="stage-info" v-if="task.stages && task.stages > 1">
            <n-text depth="3">
              {{ currentStageName }} ({{ task.currentStage }}/{{ task.stages }})
            </n-text>
          </div>
          <n-progress
            type="line"
            :percentage="task.progress"
            :indicator-placement="'inside'"
            processing
          />
        </template>

        <template v-else-if="task.state === 'completed'">
          <n-result status="success" :title="t('preview.transcodeComplete')" size="small">
            <template #footer>
              <n-button type="primary" @click="handlePlay">
                {{ t('preview.playNow') }}
              </n-button>
            </template>
          </n-result>
        </template>

        <template v-else-if="task.state === 'failed'">
          <n-result status="error" :title="t('preview.transcodeFailed')" size="small">
            <template #footer>
              <n-text depth="3" v-if="task.message">{{ task.message }}</n-text>
            </template>
          </n-result>
        </template>

        <template v-else-if="task.state === 'cancelled'">
          <n-result status="warning" :title="t('preview.transcodeCancelled')" size="small" />
        </template>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import type { TranscodeTask } from '@/stores/transcodeProgress'

const { t } = useI18n()
const message = useMessage()

const visible = defineModel<boolean>('show', { default: false })

const props = defineProps<{
  task: TranscodeTask | null
}>()

const emit = defineEmits<{
  play: [jobId: string, hlsPath: string]
  minimize: []
}>()

const currentStageName = computed(() => {
  if (!props.task) return ''
  if (props.task.currentStage === 1) return t('preview.stageAudioExtract')
  if (props.task.currentStage === 2) return t('preview.stageHLSPackage')
  return `Stage ${props.task.currentStage}`
})

function handlePlay() {
  if (props.task?.id && props.task?.hlsPath) {
    emit('play', props.task.id, props.task.hlsPath)
    visible.value = false
  }
}

function handleMinimize() {
  emit('minimize')
  message.info(t('preview.minimized'))
}
</script>

<style scoped>
.transcode-progress {
  padding: 4px 0;
}

.file-info {
  margin-bottom: 16px;
  font-weight: 500;
}

.status-section {
  min-height: 60px;
}

.stage-info {
  margin-bottom: 8px;
}
</style>
