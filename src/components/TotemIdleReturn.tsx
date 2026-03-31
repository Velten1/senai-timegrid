/**
 * Totem: após `idleMs` sem interação, volta para a página inicial.
 * Eventos em capture para incluir toques/scroll em elementos internos.
 */

import { useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const DEFAULT_IDLE_MS = 20_000

/** Garante topo da página (navbar visível) após ir para a home. */
function scrollToTopOfPage() {
  const root = document.getElementById('root')
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
  if (root) root.scrollTop = 0
}

type TotemIdleReturnProps = {
  idleMs?: number
}

export function TotemIdleReturn({ idleMs = DEFAULT_IDLE_MS }: TotemIdleReturnProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathnameRef = useRef(location.pathname)
  pathnameRef.current = location.pathname

  // Ao entrar na home (timer ou qualquer navegação para `/`), sobe o scroll antes da pintura
  useLayoutEffect(() => {
    if (location.pathname !== '/') return
    scrollToTopOfPage()
    const id = requestAnimationFrame(() => scrollToTopOfPage())
    return () => cancelAnimationFrame(id)
  }, [location.pathname])

  useEffect(() => {
    const clear = () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    const schedule = () => {
      clear()
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null
        if (pathnameRef.current !== '/') {
          navigate('/', { replace: true })
          scrollToTopOfPage()
        }
      }, idleMs)
    }

    const onActivity = () => {
      schedule()
    }

    schedule()

    const eventOptions: AddEventListenerOptions = { capture: true, passive: true }
    const events: (keyof DocumentEventMap)[] = [
      'pointerdown',
      'touchmove',
      'keydown',
      'wheel',
      'scroll',
    ]

    for (const evt of events) {
      document.addEventListener(evt, onActivity, eventOptions)
    }

    return () => {
      for (const evt of events) {
        document.removeEventListener(evt, onActivity, eventOptions)
      }
      clear()
    }
  }, [navigate, idleMs])

  return null
}
