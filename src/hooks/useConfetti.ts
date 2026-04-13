import { useCallback } from 'react'
import { triggerConfetti } from '@/lib/confetti'

/**
 * React hook for confetti functionality.
 * Returns memoized triggerConfetti function.
 */
export function useConfetti() {
  const handleTriggerConfetti = useCallback(() => {
    triggerConfetti()
  }, [])

  return { triggerConfetti: handleTriggerConfetti }
}
