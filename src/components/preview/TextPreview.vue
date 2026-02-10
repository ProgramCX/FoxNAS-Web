<template>
  <div class="text-preview" ref="containerRef">
    <div class="text-toolbar">
      <span class="file-label">{{ fileName }}</span>
      <n-tag size="small" :bordered="false">{{ language }}</n-tag>
    </div>
    <div class="editor-container" ref="editorContainerRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import * as monaco from 'monaco-editor'

const { t } = useI18n()

const props = defineProps<{
  src: string
  fileName: string
  mime?: string
}>()

const containerRef = ref<HTMLElement>()
const editorContainerRef = ref<HTMLElement>()
const loading = ref(true)
const content = ref('')

let editor: monaco.editor.IStandaloneCodeEditor | null = null

// Detect language from file extension or MIME type
const language = computed(() => {
  const ext = props.fileName.split('.').pop()?.toLowerCase() || ''
  const langMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    vue: 'html',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    markdown: 'markdown',
    py: 'python',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    bat: 'bat',
    ps1: 'powershell',
    dockerfile: 'dockerfile',
    toml: 'ini',
    ini: 'ini',
    conf: 'ini',
    txt: 'plaintext',
    log: 'plaintext',
    csv: 'plaintext',
    properties: 'ini',
    env: 'ini',
  }
  return langMap[ext] || 'plaintext'
})

async function loadContent() {
  loading.value = true
  try {
    const response = await fetch(props.src)
    if (!response.ok) throw new Error('Failed to load file')
    content.value = await response.text()
  } catch (error) {
    console.error('Failed to load text content:', error)
    content.value = t('preview.loadFailed')
  } finally {
    loading.value = false
  }
}

function initEditor() {
  if (!editorContainerRef.value) return

  // Detect dark mode
  const isDark = document.documentElement.classList.contains('dark') ||
    window.matchMedia?.('(prefers-color-scheme: dark)').matches

  editor = monaco.editor.create(editorContainerRef.value, {
    value: content.value,
    language: language.value,
    theme: isDark ? 'vs-dark' : 'vs',
    readOnly: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: 'on',
    wordWrap: 'on',
    automaticLayout: true,
    renderLineHighlight: 'all',
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    padding: { top: 12, bottom: 12 },
  })
}

onMounted(async () => {
  await loadContent()
  initEditor()
})

onUnmounted(() => {
  if (editor) {
    editor.dispose()
    editor = null
  }
})
</script>

<style scoped>
.text-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.text-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--n-color);
  border-bottom: 1px solid var(--n-border-color);
  flex-shrink: 0;
}

.file-label {
  font-size: 13px;
  color: var(--n-text-color-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-container {
  flex: 1;
  min-height: 0;
}
</style>
