import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

export interface Shortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  handler: () => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  function handleKeydown(event: KeyboardEvent) {
    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
      const altMatch = shortcut.alt ? event.altKey : !event.altKey

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault()
        event.stopPropagation()
        shortcut.handler()
        return
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
}

export function useGlobalShortcuts() {
  const shortcuts: Shortcut[] = [
    {
      key: 'Escape',
      handler: () => {
        const activeModals = document.querySelectorAll('.n-dialog, .n-modal, .n-message-box')
        if (activeModals.length > 0) {
          const closeBtn = activeModals[activeModals.length - 1]?.querySelector('.n-dialog__close, .n-modal-close, .n-base-close') as HTMLElement | null
          closeBtn?.click()
        }
      },
      description: 'Close dialog/modal',
    },
    {
      key: 's',
      ctrl: true,
      handler: () => {
        const activeElement = document.activeElement as HTMLElement
        const isInput = activeElement?.tagName === 'INPUT' ||
                       activeElement?.tagName === 'TEXTAREA' ||
                       activeElement?.hasAttribute('contenteditable')
        if (!isInput) {
          const saveBtn = document.querySelector('[data-save-button], .save-btn, button[type="submit"]') as HTMLElement
          saveBtn?.click()
        }
      },
      description: 'Save (when not in input)',
    },
    {
      key: '/',
      ctrl: true,
      handler: () => {
        const searchInput = document.querySelector('input[type="search"], .search-input, [placeholder*="搜索"], [placeholder*="Search"]') as HTMLInputElement
        searchInput?.focus()
      },
      description: 'Focus search input',
    },
    {
      key: 'g',
      ctrl: true,
      handler: () => {
        const searchInput = document.querySelector('input[type="search"], .search-input') as HTMLInputElement
        searchInput?.focus()
        searchInput?.select()
      },
      description: 'Focus and select search',
    },
    {
      key: 'h',
      ctrl: true,
      handler: () => {
        window.location.href = '/'
      },
      description: 'Go to home',
    },
    {
      key: 'f',
      ctrl: true,
      handler: () => {
        window.location.href = '/files'
      },
      description: 'Go to files',
    },
    {
      key: 'u',
      ctrl: true,
      handler: () => {
        window.location.href = '/users'
      },
      description: 'Go to users',
    },
    {
      key: 'd',
      ctrl: true,
      handler: () => {
        window.location.href = '/ddns'
      },
      description: 'Go to DDNS',
    },
    {
      key: ',',
      ctrl: true,
      handler: () => {
        window.location.href = '/settings'
      },
      description: 'Go to settings',
    },
  ]

  return useKeyboardShortcuts(shortcuts)
}

export function useFocusTrap(containerRef: Ref<HTMLElement | null>, enabled: Ref<boolean> = ref<boolean>(true)) {
  function handleKeydown(event: KeyboardEvent) {
    if (!enabled.value || !containerRef.value) return

    if (event.key !== 'Tab') return

    const focusableElements = containerRef.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement?.focus()
      }
    }
  }

  onMounted(() => {
    if (enabled.value && containerRef.value) {
      const firstFocusable = containerRef.value.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    }
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  watch(enabled, (newVal: boolean) => {
    if (newVal && containerRef.value) {
      const firstFocusable = containerRef.value.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    }
  }, { immediate: true })
}

export function useFocusOnShow(triggerRef: Ref<HTMLElement | null>, targetRef: Ref<HTMLElement | null>) {
  watch(triggerRef, (newVal: HTMLElement | null) => {
    if (newVal) {
      const observer = new MutationObserver(() => {
        if (newVal.getAttribute('aria-expanded') === 'true' || newVal.getAttribute('aria-expanded') === 'true') {
          setTimeout(() => {
            targetRef.value?.focus()
          }, 100)
        }
      })
      observer.observe(newVal, { attributes: true, attributeFilter: ['aria-expanded', 'style'] })
      return () => observer.disconnect()
    }
  })
}

export function useEnterKeyBlur() {
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === 'NumpadEnter') {
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (!target.hasAttribute('multiline') && target.getAttribute('type') !== 'search') {
          target.blur()
        }
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown, true)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown, true)
  })
}

