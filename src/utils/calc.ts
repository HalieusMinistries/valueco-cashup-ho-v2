export function N(s: unknown): number {
  const v = parseFloat(String(s ?? 0).replace(/[^0-9.\-]/g, ''))
  return isNaN(v) ? 0 : v
}

export function fmt(n: number): string {
  return Math.abs(n).toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    .replace('.', ',')
}

export function R(n: number): string {
  return 'R' + fmt(n)
}

export function Rsigned(n: number): string {
  const v = parseFloat(String(n)) || 0
  const s = fmt(Math.abs(v))
  if (v < 0) return `R${s} SHORT`
  if (v > 0) return `R${s} OVER`
  return 'R0,00'
}

export function diffLabel(a: number, b: number): { text: string; ok: boolean; over: boolean } {
  const d = N(a) - N(b)
  if (Math.abs(d) < 0.01) return { text: '✓ R0,00', ok: true, over: false }
  const abs = fmt(Math.abs(d))
  if (d > 0) return { text: `▲ OVER R${abs}`, ok: false, over: true }
  return { text: `▼ SHORT R${abs}`, ok: false, over: false }
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function dateNum(year: number, month: number, day: number): string {
  return `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`
}

export function matchSpeedPoints(
  bankRows: { statDate: string; desc: string; amount: number }[],
  sp: string,
  kdCardsByDate: Record<string, number>,
  year: number,
  month: number
): {
  bankDate: string
  coveredKDDay: string
  bankAmount: number
  kdTotal: number
  diff: number
  matched: boolean
}[] {
  function prevDays(bankDateStr: string, count: number): string[] {
    const days: string[] = []
    const d = new Date(bankDateStr + 'T00:00:00Z')
    for (let i = 0; i < count; i++) {
      d.setUTCDate(d.getUTCDate() - 1)
      days.push(d.toISOString().substring(0, 10))
    }
    return days
  }

  // Group SP entries by bank date
  const spByDate: Record<string, number[]> = {}
  bankRows.forEach(r => {
    if (!(r.desc.includes('SPEEDPOINT') || r.desc.includes(sp))) return
    const raw = String(r.statDate).substring(0, 8)
    const bankDateStr = `${raw.substring(0,4)}-${raw.substring(4,6)}-${raw.substring(6,8)}`
    if (!spByDate[bankDateStr]) spByDate[bankDateStr] = []
    spByDate[bankDateStr].push(r.amount)
  })

  const results: ReturnType<typeof matchSpeedPoints> = []
  // Global set — each KD day can only be assigned once across all bank dates
  const globalUsedDays = new Set<string>()

  // Process bank dates in chronological order
  Object.keys(spByDate).sort().forEach(bankDateStr => {
    const entries = spByDate[bankDateStr]
    const candidates = prevDays(bankDateStr, entries.length)
    const usedDaysThisBatch = new Set<string>()

    // First pass — exact amount match across all entry/candidate combinations
    for (const day of candidates) {
      if (globalUsedDays.has(day) || usedDaysThisBatch.has(day)) continue
      const kdAmt = kdCardsByDate[day]
      if (kdAmt === undefined) continue
      for (let i = 0; i < entries.length; i++) {
        if (usedDaysThisBatch.has(day)) continue
        if (Math.abs(entries[i] - kdAmt) < 0.01) {
          usedDaysThisBatch.add(day)
          globalUsedDays.add(day)
          results.push({
            bankDate: bankDateStr,
            coveredKDDay: day,
            bankAmount: entries[i],
            kdTotal: kdAmt,
            diff: 0,
            matched: true
          })
          break
        }
      }
    }

    // Second pass — remaining unmatched entries assigned to remaining candidates
    const matchedAmounts = new Set(results.filter(r => r.bankDate === bankDateStr).map(r => r.bankAmount))
    const remainingEntries = entries.filter(e => !matchedAmounts.has(e))
    const remainingCandidates = candidates.filter(d => !globalUsedDays.has(d)).reverse()

    remainingEntries.forEach((bankAmt, i) => {
      const day = remainingCandidates[i]
      if (!day) return
      globalUsedDays.add(day)
      const kdTotal = kdCardsByDate[day] ?? 0
      results.push({
        bankDate: bankDateStr,
        coveredKDDay: day,
        bankAmount: bankAmt,
        kdTotal,
        diff: bankAmt - kdTotal,
        matched: Math.abs(bankAmt - kdTotal) < 0.01
      })
    })
  })

  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  return results
    .filter(r => r.coveredKDDay.startsWith(monthStr))
    .sort((a, b) =>
      a.coveredKDDay.localeCompare(b.coveredKDDay) || a.bankDate.localeCompare(b.bankDate)
    )
}