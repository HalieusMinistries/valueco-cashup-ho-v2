import { useApp } from '../context/AppContext'
import { dateStr, R, N, varianceLabel } from '../utils/calc'
import { MONTHS_S } from '../utils/stores'
import NumericInput from '../components/NumericInput'

export default function CashReconPage() {
  const app = useApp()
  const daysInMonth = new Date(app.year, app.month, 0).getDate()

  const bankEntryKey = (r: { statDate: string; amount: number; desc: string }) =>
    `${r.statDate}|${r.amount}|${r.desc.substring(0, 20)}`

  let runningBalance = 0

  function getDayCashDeposits(day: number) {
    const dn = `${app.year}${String(app.month).padStart(2,'0')}${String(day).padStart(2,'0')}`
    const bankDeposits = app.bankRows.filter(r =>
      r.account === app.bank &&
      String(r.statDate) === dn && r.amount > 0 &&
      (r.desc.includes('ADT') || r.desc.includes('CASH DEPO') || r.desc.includes('CASH DEP') || r.desc.includes('BULK'))
    )
    const manualDeposits = (app.getDayInput(day).manualDeposits || []).map(m => ({
      statDate: dn, effDate: dn, desc: m.desc, amount: m.amount, account: app.bank
    }))
    return [...bankDeposits, ...manualDeposits]
  }

  function upd(day: number, field: string, val: number) {
    app.setDayInput(day, { [field]: val } as any)
  }

  const rows = Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
    const inp = app.getDayInput(day)
    const ds = dateStr(app.year, app.month, day)
    const deposits = getDayCashDeposits(day)
    const bankTotal = deposits.reduce((a, r) => a + r.amount, 0)
    const kdCash = app.contributionRows
      .filter(r => r.store === app.code && r.date === ds && r.mode === 'cash')
      .reduce((a, r) => a + r.contribution, 0)
    const fnbValue = N(inp.fnb) !== 0 ? N(inp.fnb) : kdCash
    const systemTotal = fnbValue + N(inp.surrender) // + N(inp.petty) — excluded per Elmarie 2026-05-18
    runningBalance += systemTotal
    const diff = systemTotal - bankTotal
    return { day, inp, deposits, bankTotal, systemTotal, runningBalance, diff, kdCash }
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