export function getServerStartOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getServerYearMonth(date = new Date()) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1, // 1–12
  }
}