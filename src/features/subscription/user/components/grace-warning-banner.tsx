interface Props { endsAt: Date; graceEndsAt?: Date }

export function GraceWarningBanner({ endsAt, graceEndsAt }: Props) {
  const now = new Date()
  if (graceEndsAt && now < graceEndsAt) {
    return <div className="bg-yellow-200 p-2 rounded">Your subscription is in grace period until {graceEndsAt.toDateString()}</div>
  }
  if (now > endsAt) {
    return <div className="bg-red-200 p-2 rounded">Your subscription has expired</div>
  }
  return null
}
