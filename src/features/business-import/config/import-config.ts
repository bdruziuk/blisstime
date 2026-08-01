export const IMPORT_CONFIG = {
  maxGridDepth: 5,
  minCellSizeKm: 1,
  concurrency: 3,
  maxActiveJobs: 1,
  maxAttempts: 3,
  retryBaseDelayMs: 1000,
  taskLockTimeoutMs: 10 * 60 * 1000,
  detailsRefreshDays: 30,
  initialGridRows: 2,
  initialGridColumns: 2,
  maxSearchPages: 3,
} as const;
