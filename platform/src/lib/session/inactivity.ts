const IDLE_TIMEOUT_MS = 90_000;
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll'] as const;

export function initInactivityDetection(onInactive: () => void): () => void {
  let idleTimer: ReturnType<typeof setTimeout>;

  const resetTimer = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(onInactive, IDLE_TIMEOUT_MS);
  };

  const handleVisibilityChange = () => {
    if (document.hidden) onInactive();
    else resetTimer();
  };

  ACTIVITY_EVENTS.forEach((event) => {
    window.addEventListener(event, resetTimer, { passive: true });
  });
  document.addEventListener('visibilitychange', handleVisibilityChange);

  resetTimer();

  return () => {
    clearTimeout(idleTimer);
    ACTIVITY_EVENTS.forEach((event) => {
      window.removeEventListener(event, resetTimer);
    });
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
