import { onMounted, onUnmounted, ref, readonly, type Ref, watch } from 'vue'

export interface FocusableElement {
  element: HTMLElement
  priority: number
  selector: string
}

export function useFocusManager() {
  const focusStack = ref<HTMLElement[]>([])
  const lastFocusedElement = ref<HTMLElement | null>(null)

  function pushFocus(element: HTMLElement) {
    lastFocusedElement.value = document.activeElement as HTMLElement
    focusStack.value.push(element)
    element.focus()
  }

  function popFocus() {
    const element = focusStack.value.pop()
    if (element) {
      element.blur()
    }
    if (lastFocusedElement.value) {
      lastFocusedElement.value?.focus()
      lastFocusedElement.value = null
    }
  }

  function clearFocusStack() {
    focusStack.value = []
  }

  return {
    focusStack: readonly(focusStack),
    pushFocus,
    popFocus,
    clearFocusStack,
  }
}

export function useSkipLink(items: Ref<Array<{ target: string; label: string }>>) {
  const skipLinks = ref<HTMLElement[]>([])

  onMounted(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id')
            const link = skipLinks.value.find(l => l.getAttribute('href') === `#${id}`)
            link?.setAttribute('aria-hidden', 'true')
            link?.classList.add('sr-only')
          } else {
            const id = entry.target.getAttribute('id')
            const link = skipLinks.value.find(l => l.getAttribute('href') === `#${id}`)
            link?.removeAttribute('aria-hidden')
            link?.classList.remove('sr-only')
          }
        })
      },
      { threshold: 0.1 }
    )

    items.value.forEach((item) => {
      const target = document.getElementById(item.target)
      if (target) {
        observer.observe(target)
      }
    })

    return () => observer.disconnect()
  })

  return { skipLinks }
}

export function useTrapFocus(containerRef: Ref<HTMLElement | null>, active: Ref<boolean> = ref(true)) {
  const previousActiveElement = ref<HTMLElement | null>(null)

  function getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(
      container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
      )
    ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-disabled'))
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!active.value || !containerRef.value) return

    if (event.key !== 'Tab') return

    const focusableElements = getFocusableElements(containerRef.value)
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey) {
      if (document.activeElement === firstElement || !containerRef.value.contains(document.activeElement)) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement || !containerRef.value.contains(document.activeElement)) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  watch(active, (newVal) => {
    if (newVal && containerRef.value) {
      previousActiveElement.value = document.activeElement as HTMLElement
      const focusableElements = getFocusableElements(containerRef.value)
      focusableElements[0]?.focus()
    }
  }, { immediate: true })

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
    if (previousActiveElement.value) {
      previousActiveElement.value.focus()
    }
  })

  return { previousActiveElement }
}

export function useAriaLive() {
  const liveRegion = ref<HTMLElement | null>(null)

  function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (liveRegion.value) {
      liveRegion.value.textContent = ''
      setTimeout(() => {
        if (liveRegion.value) {
          liveRegion.value.setAttribute('aria-live', priority)
          liveRegion.value.textContent = message
        }
      }, 100)
    }
  }

  onMounted(() => {
    liveRegion.value = document.createElement('div')
    liveRegion.value.setAttribute('role', 'status')
    liveRegion.value.setAttribute('aria-live', 'polite')
    liveRegion.value.setAttribute('aria-atomic', 'true')
    liveRegion.value.className = 'sr-only'
    liveRegion.value.style.cssText = 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;'
    document.body.appendChild(liveRegion.value)
  })

  onUnmounted(() => {
    if (liveRegion.value) {
      document.body.removeChild(liveRegion.value)
    }
  })

  return { announce, liveRegion }
}

export function useRovingTabIndex(containerRef: Ref<HTMLElement | null>, selector: string = '[tabindex]') {
  function updateTabIndexes() {
    if (!containerRef.value) return

    const items = containerRef.value.querySelectorAll<HTMLElement>(selector)
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1')
    })
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!containerRef.value) return

    const items = Array.from(containerRef.value.querySelectorAll<HTMLElement>(selector))
    const currentIndex = items.findIndex(item => item === document.activeElement)

    let newIndex = currentIndex
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault()
        newIndex = (currentIndex + 1) % items.length
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault()
        newIndex = (currentIndex - 1 + items.length) % items.length
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = items.length - 1
        break
    }

    if (newIndex !== currentIndex) {
      items[newIndex].setAttribute('tabindex', '0')
      items[newIndex].focus()
      items[currentIndex].setAttribute('tabindex', '-1')
    }
  }

  onMounted(() => {
    updateTabIndexes()
    containerRef.value?.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    containerRef.value?.removeEventListener('keydown', handleKeyDown)
  })

  watch(() => containerRef.value?.childNodes, () => {
    updateTabIndexes()
  }, { deep: true })

  return { updateTabIndexes }
}
