export function calculateProgress(totalTasks: number, completedTasks: number): number {
  if (totalTasks <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completedTasks / totalTasks) * 100)));
}
