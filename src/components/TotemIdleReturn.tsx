/**
 * Totem: após `idleMs` sem interação, volta para a página inicial.
 * Eventos em capture para incluir toques/scroll em elementos internos.
 */

import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const DEFAULT_IDLE_MS = 20_000

type TotemIdleReturnProps = {
  idleMs?: number
}

export function TotemIdleReturn({ idleMs = DEFAULT_IDLE_MS }: TotemIdleReturnProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathnameRef = useRef(location.pathname)
  pathnameRef.current = location.pathname

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
