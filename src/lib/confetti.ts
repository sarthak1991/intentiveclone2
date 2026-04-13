import confetti from 'canvas-confetti'

/**
 * Trigger confetti celebration with ADHD-friendly colors.
 * Uses gentle colors (no harsh reds/blues) and disables for reduced motion preference.
 */
export function triggerConfetti(): void {
  // Check for reduced motion preference
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffd93d']

  // Main burst from center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors,
    zIndex: 100,
    disableForReducedMotion: true,
  })

  // Side cannons for extra celebration
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors,
      zIndex: 100,
    })
  }, 200)

  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors,
      zIndex: 100,
    })
  }, 400)
}

/**
 * React hook for confetti functionality.
 */
export function useConfetti() {
  return { triggerConfetti }
}
