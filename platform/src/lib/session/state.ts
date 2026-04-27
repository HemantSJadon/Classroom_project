export interface SessionState {
  sessionId: string;
  classroomId: string;
  scrollPosition: number;
  lastMessageId: string | null;
  contextSummary: string | null;
}

export function getLocalSessionDraft(classroomId: string): Partial<SessionState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`session_draft_${classroomId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalSessionDraft(classroomId: string, state: Partial<SessionState>): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`session_draft_${classroomId}`, JSON.stringify(state));
}

export function clearLocalSessionDraft(classroomId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(`session_draft_${classroomId}`);
}
