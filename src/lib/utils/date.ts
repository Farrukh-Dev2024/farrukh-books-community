// src/lib/utils/date.ts
export function formatDate(date: string | Date) {
  const d = new Date(date)
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
