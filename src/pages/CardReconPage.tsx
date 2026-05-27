import { useApp } from '../context/AppContext'
import { R, varianceLabel } from '../utils/calc'
import { MONTHS_S } from '../utils/stores'
import { useMonthReconciliation } from '../hooks/useMonthReconciliation'

export default function CardReconPage() {
  const app = useApp()
  const monthRecon = useMonthReconciliation()

  
  function exportSpeedPoints() {
    const lines = ['Date,Bank SpeedPoint']
    monthRecon.days.forEach(d => {
      const matched = monthRecon.spMatches.filter(m => m.coveredKDDay === d.ds)
      const bankTotal = matched.reduce((a, m) => a + m.bankAmount, 0)
      lines.push(`${String(d.day).padStart(2,'0')} ${MONTHS_S[app.month-1]} ${app.year},${bankTotal.toFixed(2)}`)
    })
    const total = monthRecon.spMatches.reduce((a, m) => a + m.bankAmount, 0)
    lines.push(`TOTAL,${total.toFixed(2)}`)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
    a.download = `SpeedPoints_${app.code}_${app.year}${String(app.month).padStart(2,'0')}.csv`
    a.click()
  }
  const rows = monthRecon.days.map(d => {
    const matched = monthRecon.spMatches.filter(m => m.coveredKDDay === d.ds)
    const kdTotal = d.kdCard
    const bankTotal = d.spTotal
    const diff = bankTotal - kdTotal
    return { day: d.day, kdTotal, matched, bankTotal, diff }
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="btn" onClick={exportSpeedPoints}>⬇ Export SpeedPoints</button>
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
          <tr style={{ borderTop: '2px solid var(--brd)', fontWeight: 700 }}>
              <td style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt)' }}>TOTALS</td>
              <td className="r" style={{ color: 'var(--acc)' }}>{R(rows.reduce((a, { kdTotal }) => a + kdTotal, 0))}</td>
              <td className="r" style={{ color: 'var(--acc2)' }}>{R(rows.reduce((a, { bankTotal }) => a + bankTotal, 0))}</td>
              <td className="r" style={{ color: Math.abs(rows.reduce((a, { diff }) => a + diff, 0)) < 0.01 ? 'var(--grn)' : 'var(--red)' }}>
                {varianceLabel(rows.reduce((a, { bankTotal }) => a + bankTotal, 0), rows.reduce((a, { kdTotal }) => a + kdTotal, 0)).text}
              </td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}