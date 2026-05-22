// South African Public Holidays
const SA_HOLIDAYS: Record<number, string[]> = {
  2026: [
    '2026-01-01', // New Year's Day
    '2026-03-21', // Human Rights Day
    '2026-04-03', // Good Friday
    '2026-04-06', // Family Day
    '2026-04-27', // Freedom Day
    '2026-05-01', // Workers Day
    '2026-05-25', // Africa Day
    '2026-06-16', // Youth Day
    '2026-08-09', // National Women's Day
    '2026-08-10', // National Women's Day observed
    '2026-09-24', // Heritage Day
    '2026-12-16', // Day of Reconciliation
    '2026-12-25', // Christmas Day
    '2026-12-26', // Day of Goodwill
  ],
  2027: [
    '2027-01-01',
    '2027-03-21',
    '2027-03-26', // Good Friday
    '2027-03-29', // Family Day
    '2027-04-27',
    '2027-05-01',
    '2027-06-16',
    '2027-08-09',
    '2027-09-24',
    '2027-12-16',
    '2027-12-25',
    '2027-12-26',
  ]
}

export function isPublicHoliday(date: Date): boolean {
  const year = date.getFullYear()
  const dateStr = date.toISOString().substring(0, 10)
  return (SA_HOLIDAYS[year] ?? []).includes(dateStr)
}

export function isSunday(date: Date): boolean {
  return date.getDay() === 0
}

export function isNonTradingDay(date: Date): boolean {
  return isSunday(date) || isPublicHoliday(date)
}

export function getPreviousTradingDay(bankDate: Date): string {
  // SpeedPoint settles for previous trading day
  // Skip Sundays and public holidays going backwards
  const d = new Date(bankDate)
  d.setDate(d.getDate() - 1)
  while (isNonTradingDay(d)) {
    d.setDate(d.getDate() - 1)
  }
  return d.toISOString().substring(0, 10)
}

export function getSpeedPointCoveredDays(bankDate: Date): string[] {
  // Returns the KD trading day(s) this bank date's SP settlement covers
  const covered: string[] = []
  const d = new Date(bankDate)
  d.setDate(d.getDate() - 1)

  // Always include the immediate previous trading day
  while (isNonTradingDay(d)) {
    d.setDate(d.getDate() - 1)
  }
  covered.push(d.toISOString().substring(0, 10))

  // If that day was a Monday, also check if Saturday is included
  // Saturday SpeedPoints settle on Monday bank date
  // But based on analysis — Tuesday bank = Monday KD only
  // Monday bank = Saturday KD only (Sunday has no SP)
  // So we only ever cover ONE trading day per bank entry

  return covered
}