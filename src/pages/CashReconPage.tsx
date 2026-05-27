import { useApp } from '../context/AppContext'
import { R, varianceLabel } from '../utils/calc'
import { MONTHS_S } from '../utils/stores'
import NumericInput from '../components/NumericInput'
import { useMonthReconciliation } from '../hooks/useMonthReconciliation'

export default function CashReconPage() {
  const app = useApp()

  const monthRecon = useMonthReconciliation()

  const bankEntryKey = (r: { statDate: string; amount: number; desc: string }) =>
    `${r.statDate}|${r.amount}|${r.desc.substring(0, 20)}`

  function upd(day: number, field: string, val: number) {
    app.setDayInput(day, { [field]: val } as any)
  }

  function exportFNBDeposits() {
    const lines = ['Date,FNB Deposit']
    monthRecon.days.forEach(d => {
      const inp = app.getDayInput(d.day)
      const val = inp.fnb !== 0 ? inp.fnb : d.contribCash
      lines.push(`${String(d.day).padStart(2,'0')} ${MONTHS_S[app.month-1]} ${app.year},${val.toFixed(2)}`)
    })
    const total = monthRecon.days.reduce((a, d) => {
      const inp = app.getDayInput(d.day)
      return a + (inp.fnb !== 0 ? inp.fnb : d.contribCash)
    }, 0)
    lines.push(`TOTAL,${total.toFixed(2)}`)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
    a.download = `FNB_Deposits_${app.code}_${app.year}${String(app.month).padStart(2,'0')}.csv`
    a.click()
  }
  
  let runningBalance = 0
  const rows = monthRecon.days.map(d => {
    const inp = app.getDayInput(d.day)
    runningBalance += d.systemTotal
    return {
      day: d.day, inp,
      deposits: d.cashDeposits,
      bankTotal: d.bankCashTotal,
      systemTotal: d.systemTotal,
      runningBalance,
      diff: d.systemTotal - d.bankCashTotal,
      kdCash: d.contribCash
    }
  })

  // Build recon nr summary — for each unique cashReconNr, sum system totals
  // For each unique bankReconNr, sum bank deposits
  // Then match and show difference
  const reconSummary: Record<string, { systemTotal: number; bankTotal: number }> = {}
  rows.forEach(({ inp, systemTotal, deposits }) => {
    const nr = inp.cashReconNr?.trim()
    if (!nr) return
    if (!reconSummary[nr]) reconSummary[nr] = { systemTotal: 0, bankTotal: 0 }
    reconSummary[nr].systemTotal += systemTotal
  })
  rows.forEach(({ inp, deposits }) => {
    deposits.forEach(d => {
      const nr = inp.bankReconNr?.trim()
      if (!nr) return
      if (!reconSummary[nr]) reconSummary[nr] = { systemTotal: 0, bankTotal: 0 }
      reconSummary[nr].bankTotal += d.amount
    })
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
        Cash Recon — {MONTHS_S[app.month - 1]} {app.year} — {app.name}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="btn" onClick={exportFNBDeposits}>⬇ Export FNB Deposits</button>
      </div>
      <div className="card" style={{ overflowX: 'auto', maxHeight: '70vh', overflowY: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              <th className="r" style={thStyle}>FNB Deposit</th>
              <th className="r" style={thStyle}>Cash Surrender</th>
              <th className="r" style={thStyle}>Petty Cash</th>
              <th className="r" style={thStyle}>Change</th>
              <th className="r" style={thStyle}>Floats</th>
              <th style={thStyle}>Recon Nr</th>
              <th className="r" style={thStyle}>System Total</th>
              <th className="r" style={thStyle}>Running Balance</th>
              <th className="r" style={thStyle}>Bank Total</th>
              <th style={thStyle}>Bank Recon Nr</th>
              <th className="r" style={thStyle}>Difference</th>
              <th style={thStyle}>Bank Entries</th>
              <th style={thStyle}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ day, inp, deposits, bankTotal, systemTotal, runningBalance: rb, diff, kdCash }) => (
              <tr key={day}>
                <td style={{ color: 'var(--txt2)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
                  {String(day).padStart(2, '0')} {MONTHS_S[app.month - 1]}
                </td>
                <td className="r">
                  <NumericInput className="ti" style={{ width: 90 }} value={inp.fnb !== 0 ? inp.fnb : kdCash} onChange={v => upd(day, 'fnb', v)} />
                </td>
                <td className="r">
                  <NumericInput className="ti" style={{ width: 90 }} value={inp.surrender} onChange={v => upd(day, 'surrender', v)} />
                </td>
                <td className="r">
                  <NumericInput className="ti" style={{ width: 80 }} value={inp.petty} onChange={v => upd(day, 'petty', v)} />
                </td>
                <td className="r">
                  <NumericInput className="ti" style={{ width: 80 }} value={inp.change} onChange={v => upd(day, 'change', v)} />
                </td>
                <td className="r">
                  <NumericInput className="ti" style={{ width: 80 }} value={inp.floats} onChange={v => upd(day, 'floats', v)} />
                </td>
                <td>
                  <input
                    type="text"
                    className="ti"
                    style={{ width: 60, fontSize: 11, textAlign: 'center' }}
                    value={inp.cashReconNr || ''}
                    onChange={e => app.setDayInput(day, { cashReconNr: e.target.value })}
                    placeholder="Nr"
                  />
                </td>
                <td className="r">{R(systemTotal)}</td>
                <td className="r">{R(rb)}</td>
                <td className="r">{R(bankTotal)}</td>
                <td>
                  <input
                    type="text"
                    className="ti"
                    style={{ width: 60, fontSize: 11, textAlign: 'center' }}
                    value={inp.bankReconNr || ''}
                    onChange={e => app.setDayInput(day, { bankReconNr: e.target.value })}
                    placeholder="Nr"
                  />
                </td>
                <td className="r" style={{ color: Math.abs(diff) < 0.01 ? 'var(--grn)' : 'var(--red)' }}>
                  {varianceLabel(systemTotal, bankTotal).ok ? '✓ R0,00' : varianceLabel(systemTotal, bankTotal).text}
                </td>
                <td style={{ fontSize: 9, color: 'var(--txt2)', whiteSpace: 'nowrap' }}>
                  {deposits.map((d, i) => {
                    const key = bankEntryKey(d)
                    const isDuplicate = deposits.some((other, j) => j !== i && bankEntryKey(other) === key)
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, color: isDuplicate ? 'var(--red)' : 'var(--txt2)' }}>
                        {isDuplicate && <span title="Possible duplicate">⚠</span>}
                        <span>{d.desc.substring(0, 25)} {R(d.amount)}</span>
                        {isDuplicate && (
                          <button
                            onClick={() => app.removeBankEntry(key)}
                            style={{ border: 'none', background: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 10, padding: '0 2px', fontWeight: 700 }}
                            title="Remove duplicate entry"
                          >✕</button>
                        )}
                      </div>
                    )
                  })}
                </td>
                <td>
                  <input
                    type="text"
                    className="ti"
                    style={{ width: 200, fontSize: 11 }}
                    value={inp.notes || ''}
                    onChange={e => app.setDayInput(day, { notes: e.target.value })}
                    placeholder="Add note..."
                  />
                </td>
              </tr>
            ))}
          <tr style={{ borderTop: '2px solid var(--brd)', fontWeight: 700 }}>
              <td style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt)' }}>TOTALS</td>
              <td className="r">{R(rows.reduce((a, { inp, kdCash }) => a + (inp.fnb !== 0 ? inp.fnb : kdCash), 0))}</td>
              <td className="r">{R(rows.reduce((a, { inp }) => a + inp.surrender, 0))}</td>
              <td className="r">{R(rows.reduce((a, { inp }) => a + inp.petty, 0))}</td>
              <td className="r">{R(rows.reduce((a, { inp }) => a + inp.change, 0))}</td>
              <td className="r">{R(rows.reduce((a, { inp }) => a + inp.floats, 0))}</td>
              <td></td>
              <td className="r">{R(rows.reduce((a, { systemTotal }) => a + systemTotal, 0))}</td>
              <td></td>
              <td className="r">{R(rows.reduce((a, { bankTotal }) => a + bankTotal, 0))}</td>
              <td></td>
              <td className="r" style={{ color: Math.abs(rows.reduce((a, { diff }) => a + diff, 0)) < 0.01 ? 'var(--grn)' : 'var(--red)' }}>
                {R(Math.abs(rows.reduce((a, { diff }) => a + diff, 0)))}
              </td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {Object.keys(reconSummary).length > 0 && (
        <>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, marginTop: 20, marginBottom: 8 }}>
            Recon Summary
          </div>
          <div className="card">
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Recon Nr</th>
                  <th className="r" style={thStyle}>System Total</th>
                  <th className="r" style={thStyle}>Bank Deposit</th>
                  <th className="r" style={thStyle}>Difference</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(reconSummary).sort().map(([nr, { systemTotal, bankTotal }]) => {
                  const diff = bankTotal - systemTotal
                  return (
                    <tr key={nr}>
                      <td style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{nr}</td>
                      <td className="r">{R(systemTotal)}</td>
                      <td className="r">{R(bankTotal)}</td>
                      <td className="r" style={{ color: Math.abs(diff) < 0.01 ? 'var(--grn)' : 'var(--red)' }}>
                        {varianceLabel(bankTotal, systemTotal).ok ? '✓ R0,00' : varianceLabel(bankTotal, systemTotal).text}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}