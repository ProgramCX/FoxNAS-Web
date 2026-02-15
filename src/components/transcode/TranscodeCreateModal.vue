<template>
  <n-modal
    :show="show"
    preset="card"
    :title="t('transcode.createTask')"
    :style="{ width: '90vw', maxWidth: '560px' }"
    @update:show="$emit('update:show', $event)"
  >
    <n-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-placement="left"
      :label-width="isMobile ? undefined : 140"
      require-mark-placement="right-hanging"
    >
      <n-form-item :label="t('transcode.videoPathLabel')" path="videoPath">
        <n-input
          v-model:value="formData.videoPath"
          :placeholder="t('transcode.videoPathPlaceholder')"
          clearable
        />
      </n-form-item>

      <n-form-item :label="t('transcode.audioTrackLabel')" path="audioTrackIndex">
        <n-input-number
          v-model:value="formData.audioTrackIndex"
          :min="0"
          :max="99"
          style="width: 100%"
        />
      </n-form-item>

      <n-form-item :label="t('transcode.subtitleTrackLabel')" path="subtitleTrackIndex">
        <n-input-number
          v-model:value="formData.subtitleTrackIndex"
          :min="-1"
          :max="99"
          style="width: 100%"
        />
      </n-form-item>

      <n-form-item :label="t('transcode.immediateLabel')" path="immediate">
        <n-switch v-model:value="formData.immediate" />
        <span style="margin-left: 8px; font-size: 12px; color: var(--text-color-tertiary)">
          {{ t('transcode.immediateHint') }}
        </span>
      </n-form-item>

      <n-form-item :label="t('transcode.fingerprintLabel')" path="fingerprint">
        <n-input
          v-model:value="formData.fingerprint"
          :placeholder="t('transcode.fingerprintPlaceholder')"
          clearable
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="$emit('update:show', false)">{{ t('common.cancel') }}</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit">
          {{ t('common.submit') }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInst, FormRules } from 'naive-ui'
import type { CreateTranscodeJobRequest } from '@/types'

const props = defineProps<{
  show: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
  (e: 'submit', data: CreateTranscodeJobRequest): void
}>()

const { t } = useI18n()
const formRef = ref<FormInst | null>(null)
const isMobile = ref(window.innerWidth <= 768)

const formData = reactive<CreateTranscodeJobRequest>({
  videoPath: '',
  audioTrackIndex: 0,
  subtitleTrackIndex: -1,
  immediate: false,
  fingerprint: '',
})

const rules: FormRules = {
  videoPath: {
    required: true,
    trigger: 'blur',
    message: () => t('transcode.videoPathPlaceholder'),
  },
}

function handleSubmit() {
  formRef.value?.validate((errors) => {
    if (!errors) {
      emit('submit', { ...formData })
    }
  })
}

function handleResize() {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
</script>
