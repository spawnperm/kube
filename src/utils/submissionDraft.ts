/**
 * Модуль автосохранения и восстановления черновиков формы подачи решений
 */
export interface SubmissionDraft {
  teamId: string;
  stageId: string;
  title: string;
  summary: string;
  details: string;
  repoUrl: string;
  calcDeltaV: number;
  calcPower: number;
  calcMargin: number;
  uploadedFiles: Array<{ name: string; size: string; type: string }>;
  savedAt: string;
  timestamp: number;
}

const STORAGE_PREFIX = 'kosmos_draft_';

export function getDraftStorageKey(teamId: string, stageId: string): string {
  return `${STORAGE_PREFIX}${teamId}_${stageId}`;
}

/**
 * Сохраняет черновик решения в localStorage
 */
export function saveSubmissionDraft(
  teamId: string,
  stageId: string,
  data: Omit<SubmissionDraft, 'teamId' | 'stageId' | 'savedAt' | 'timestamp'>,
): SubmissionDraft | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const now = new Date();
    const savedAt = now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const draft: SubmissionDraft = {
      ...data,
      teamId,
      stageId,
      savedAt,
      timestamp: now.getTime(),
    };

    const key = getDraftStorageKey(teamId, stageId);
    window.localStorage.setItem(key, JSON.stringify(draft));
    return draft;
  } catch (e) {
    console.warn('Не удалось сохранить черновик в localStorage:', e);
    return null;
  }
}

/**
 * Загружает черновик решения из localStorage
 */
export function loadSubmissionDraft(teamId: string, stageId: string): SubmissionDraft | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const key = getDraftStorageKey(teamId, stageId);
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SubmissionDraft;
    if (parsed && parsed.stageId === stageId && parsed.teamId === teamId) {
      return parsed;
    }
    return null;
  } catch (e) {
    console.warn('Ошибка при чтении черновика из localStorage:', e);
    return null;
  }
}

/**
 * Удаляет сохраненный черновик из localStorage
 */
export function clearSubmissionDraft(teamId: string, stageId: string): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const key = getDraftStorageKey(teamId, stageId);
    window.localStorage.removeItem(key);
  } catch (e) {
    console.warn('Ошибка при удалении черновика из localStorage:', e);
  }
}

/**
 * Проверяет наличие черновика
 */
export function hasSubmissionDraft(teamId: string, stageId: string): boolean {
  return loadSubmissionDraft(teamId, stageId) !== null;
}
