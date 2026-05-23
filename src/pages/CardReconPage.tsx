import { useApp } from '../context/AppContext'
import { dateStr, R, matchSpeedPoints, varianceLabel } from '../utils/calc'
import { MONTHS_S } from '../utils/stores'

export default function CardReconPage() {
  const app = useApp()
  const daysInMonth = new Date(app.year, app.month, 0).getDate()

  const storeBankRows = app.bankRows.filter(r => r.account === app.bank)

  const kdCardsByDate: Record<string, number> = {}
  app.contributionRows
    .filter(r => r.store === app.code && r.mode === 'bank card')
    .forEach(r => { kdCardsByDate[r.date] = (kdCardsByDate[r.date] || 0) + r.contribution })

  const spMatches = matchSpeedPoints(storeBankRows, app.sp, kdCardsByDate, app.year, app.month)

  const rows = Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
    const ds = dateStr(app.year, app.month, day)
    const kdTotal = kdCardsByDate[ds] || 0
    const matched = spMatches.filter(m => m.coveredKDDay === ds)
    const bankTotal = matched.reduce((a, m) => a + m.bankAmount, 0)
    const diff = bankTotal - kdTotal
    return { day, ds, kdTotal, matched, bankTotal, diff }
  })

  const thStyle = {
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
    background: 'var(--sur)',
    whiteSpace: 'nowrap' as const
  }

  return (
    <div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
        Card Recon — {MONTHS_S[app.month - 1]} {app.year} — {app.name}
      </div>
      <div className="card" style={{ overflowX: 'auto', maxHeight: '70vh', overflowY: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              <th className="r" style={thStyle}>SC Card Total</th>
              <th className="r" style={thStyle}>Bank SpeedPoint</th>
              <th className="r" style={thStyle}>Difference</th>
              <th style={thStyle}>Bank Entries</th>
              <th style={thStyle}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ day, kdTotal, matched, bankTotal, diff }) => (
              <tr key={day} style={{ opacity: kdTotal === 0 && matched.length === 0 ? 0.4 : 1 }}>
                <td style={{ color: 'var(--txt2)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
                  {String(day).padStart(2, '0')} {MONTHS_S[app.month - 1]}
                </td>
                <td className="r" style={{ color: 'var(--acc)' }}>{R(kdTotal)}</td>
                <td className="r" style={{ color: 'var(--acc2)' }}>{R(bankTotal)}</td>
                <td className="r" style={{ color: Math.abs(diff) < 0.01 ? 'var(--grn)' : 'var(--red)' }}>
                  {kdTotal === 0 && matched.length === 0 ? '—' : varianceLabel(bankTotal, kdTotal).ok ? '✓ R0,00' : varianceLabel(bankTotal, kdTotal).text}
                </td>
                <td style={{ fontSize: 9, color: 'var(--txt2)', whiteSpace: 'nowrap' }}>
                  {matched.map((m, i) => (
                    <div key={i}>Bank {m.bankDate} → {R(m.bankAmount)}</div>
                  ))}
                </td>
                <td>
                  <input
                    type="text"
                    className="ti"
                    style={{ width: 200, fontSize: 11 }}
                    value={app.getDayInput(day).cardNotes || ''}
                    onChange={e => app.setDayInput(day, { cardNotes: e.target.value })}
                    placeholder="Add note..."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}