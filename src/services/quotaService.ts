// Real-time Firestore Quota & Database Usage Tracker
// Firebase Spark Plan Limits:
// - Storage: 1 GB (1024 MB)
// - Document Writes: 20,000 / day
// - Document Reads: 50,000 / day
// - Document Deletes: 20,000 / day

export interface QuotaStats {
  date: string; // YYYY-MM-DD
  writesToday: number;
  readsToday: number;
  deletesToday: number;
  estimatedStorageBytes: number;
  lastUpdated: string;
}

const STORAGE_KEY = 'kreasi_firestore_quota_metrics';
const MAX_STORAGE_BYTES = 1024 * 1024 * 1024; // 1 GB in bytes
const MAX_WRITES_DAILY = 20000;
const MAX_READS_DAILY = 50000;
const MAX_DELETES_DAILY = 20000;

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getQuotaStats(): QuotaStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const today = getTodayString();
    if (raw) {
      const parsed: QuotaStats = JSON.parse(raw);
      if (parsed.date === today) {
        return parsed;
      }
    }
    // New day or first run
    const initial: QuotaStats = {
      date: today,
      writesToday: 0,
      readsToday: 0,
      deletesToday: 0,
      estimatedStorageBytes: 15400, // estimated base metadata
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  } catch (_) {
    return {
      date: getTodayString(),
      writesToday: 0,
      readsToday: 0,
      deletesToday: 0,
      estimatedStorageBytes: 15400,
      lastUpdated: new Date().toISOString(),
    };
  }
}

function saveQuotaStats(stats: QuotaStats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    window.dispatchEvent(new CustomEvent('quota_stats_updated', { detail: stats }));
  } catch (_) {}
}

export function recordQuotaUsage(delta: {
  writes?: number;
  reads?: number;
  deletes?: number;
  storageBytes?: number;
}) {
  const stats = getQuotaStats();
  if (delta.writes) stats.writesToday = (stats.writesToday || 0) + delta.writes;
  if (delta.reads) stats.readsToday = (stats.readsToday || 0) + delta.reads;
  if (delta.deletes) stats.deletesToday = (stats.deletesToday || 0) + delta.deletes;
  if (delta.storageBytes !== undefined) stats.estimatedStorageBytes = delta.storageBytes;
  stats.lastUpdated = new Date().toISOString();
  saveQuotaStats(stats);
}

export function calculateRealtimeStorageSize(
  studentsCount: number,
  classesCount: number,
  teacherCodesCount: number
): number {
  // Approximate document size in Firestore:
  // - Base document overhead: ~32 bytes + field names + content
  // - Student doc: ~280 bytes
  // - Class doc: ~180 bytes
  // - Teacher code doc: ~150 bytes
  const studentsBytes = studentsCount * 280;
  const classesBytes = classesCount * 180;
  const teachersBytes = teacherCodesCount * 150;
  const settingsBytes = 500;
  const indexOverhead = (studentsBytes + classesBytes + teachersBytes) * 0.4;
  return Math.round(studentsBytes + classesBytes + teachersBytes + settingsBytes + indexOverhead);
}

export const FIREBASE_LIMITS = {
  MAX_STORAGE_BYTES,
  MAX_WRITES_DAILY,
  MAX_READS_DAILY,
  MAX_DELETES_DAILY,
};
