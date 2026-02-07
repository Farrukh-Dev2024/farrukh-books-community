interface Props {
  dailyUsage: number
  dailyLimit: number | null
  monthlyBackup: number
  monthlyLimit: number | null
}

export function UsageProgressBars({ dailyUsage, dailyLimit, monthlyBackup, monthlyLimit }: Props) {
  const dailyPercent = dailyLimit ? Math.min((dailyUsage / dailyLimit) * 100, 100) : 0
  const monthlyPercent = monthlyLimit ? Math.min((monthlyBackup / monthlyLimit) * 100, 100) : 0

  return (
    <div className="space-y-2">
      {dailyLimit && (
        <div>
          <label>Daily Journal Entries: {dailyUsage}/{dailyLimit}</label>
          <progress value={dailyPercent} max={100} />
        </div>
      )}
      {monthlyLimit && (
        <div>
          <label>Monthly Backups: {monthlyBackup}/{monthlyLimit}</label>
          <progress value={monthlyPercent} max={100} />
        </div>
      )}
    </div>
  )
}
