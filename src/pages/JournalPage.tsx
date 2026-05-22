import { useApp } from '../context/AppContext'
import { dateStr, R, diffLabel } from '../utils/calc'

interface Props { setTab: (t: any) => void }

export default function JournalPage({ setTab }: Props) {
  const app = useApp()

  const storeRows = app.journalRows.filter(r => r.account === app.code)
  const journalData = storeRows.length > 0 ? storeRows : app.journalRows
  const journalOpeningBal = journalData[0]?.prevBal ?? 0
  const openingBal = journalOpeningBal !== 0 ? journalOpeningBal : app.closingBalance

  let totalRev = 0, totalExp = 0, totalCashKD = 0
  let runningBal = openingBal

  const rows = app.journalRows.filter(r => r.account === app.code).map(r => {
    const day = parseInt(r.date.split('-')[2])
    const ds = dateStr(app.year, app.month, day)
    const kdRows = app.kdRows.filter(row => row.store === app.code && row.date === ds)
    const inp = app.getDayInput(day)
    const kdCash = kdRows.reduce((a, r) => a + r.cash, 0)
    const revDiff = diffLabel(r.revenueToday, kdCash)
    const expDiff = r.expenseToday > 0 ? diffLabel(r.expenseToday, inp.surrender) : null
    runningBal += r.revenueToday - r.expenseToday
    const balDiff = null
    totalRev += r.revenueToday
    totalExp += r.expenseToday
    totalCashKD += kdCash

    return (
      <tr key={r.date} className="clickable" onClick={() => { app.setCurrentDay(day); setTab('cashup') }}>
        <td style={{color:'var(--acc)',fontWeight:600}}>{r.date.substring(8)}</td>
        <td className="r">{R(r.prevBal !== 0 ? r.prevBal : openingBal)}</td>
        <td className="r" style={{color:'var(--grn)'}}>{R(r.revenueToday)}</td>
        <td className="r" style={{color:'var(--red)'}}>{r.expenseToday ? R(r.expenseToday) : '—'}</td>
        <td className="r" style={{color:'var(--acc)'}}>{r.balanceToday !== 0 ? R(r.balanceToday) : '—'}</td>
        <td className="r" style={{color:'var(--acc2)'}}>{R(kdCash)}</td>
        <td className="r" style={{color: revDiff.ok ? 'var(--grn)' : 'var(--red)'}}>
          {revDiff.text}
        </td>
        <td className="r" style={{color:'var(--acc2)'}}>{R(inp.surrender)}</td>
        <td className="r" style={{color: expDiff ? (expDiff.ok ? 'var(--grn)' : 'var(--red)') : 'var(--txt2)'}}>
          {expDiff ? expDiff.text : '—'}
        </td>
        <td className="r" style={{fontWeight:600}}>{r.balanceToday !== 0 ? R(r.balanceToday) : R(runningBal)}</td>
        <td className="r" style={{fontWeight:600, color:'var(--acc)'}}>
          {R(runningBal)}
        </td>
      </tr>
    )
  })

  const storeJournalRows = app.journalRows.filter(r => r.account === app.code)
  const lastRow = storeJournalRows[storeJournalRows.length - 1]
  const closingBal = runningBal

  const totRevDiff = diffLabel(totalRev, totalCashKD)

  if (!app.journalRows.length) return (
    <div style={{color:'var(--txt2)',fontFamily:'var(--mono)',fontSize:11}}>Load Cash Journal CSV first</div>
  )

  return (
    <div>
      <div className="stats">
        <div className="stat">
          <div className="sl">Opening Balance</div>
          <div className="sv acc" style={{display:'flex',alignItems:'center',gap:8}}>
            {R(openingBal)}
            <input
              type="number"
              style={{width:120,fontSize:11,padding:'2px 6px',border:'1px solid var(--brd)',borderRadius:4,background:'var(--sur)',color:'var(--txt)',fontFamily:'var(--mono)'}}
              placeholder="Override..."
              onBlur={e => {
                const val = parseFloat(e.target.value)
                if (!isNaN(val)) app.setOpeningBalance(val)
                e.target.value = ''
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = parseFloat((e.target as HTMLInputElement).value)
                  if (!isNaN(val)) app.setOpeningBalance(val)
                  ;(e.target as HTMLInputElement).value = ''
                  ;(e.target as HTMLInputElement).blur()
                }
              }}
            />
          </div>
        </div>
        <div className="stat">
          <div className="sl">Total Revenue</div>
          <div className="sv pos">{R(totalRev)}</div>
        </div>
        <div className="stat">
          <div className="sl">Total Expenses</div>
          <div className="sv neg">{R(totalExp)}</div>
        </div>
        <div className="stat">
          <div className="sl">Closing Balance</div>
          <div className={`sv ${closingBal >= 0 ? 'acc' : 'neg'}`}>{R(closingBal)}</div>
        </div>
      </div>

      {openingBal === 0 && (
        <div className="msg" style={{marginBottom:12,fontSize:11,color:'var(--txt2)',fontFamily:'var(--mono)'}}>
          ⚠ Opening balance is zero. Enter the closing balance from the previous month in the override field above.
        </div>
      )}

      <div className="section-lbl">Cash Journal vs CashUp — click row to open day sheet</div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th className="r">Prev Balance</th>
              <th className="r" style={{color:'var(--grn)'}}>Revenue</th>
              <th className="r" style={{color:'var(--red)'}}>Expense</th>
              <th className="r" style={{color:'var(--acc)'}}>Jnl Balance</th>
              <th className="r" style={{color:'var(--acc2)'}}>KD Cash</th>
              <th className="r">Rev Diff</th>
              <th className="r" style={{color:'var(--acc2)'}}>Surrender</th>
              <th className="r">Exp Diff</th>
              <th className="r">KD Closing</th>
              <th className="r">Cash on Hand</th>
            </tr>
          </thead>
          <tbody>
            {rows}
            <tr className="sub">
              <td>TOTALS</td>
              <td className="r">—</td>
              <td className="r">{R(totalRev)}</td>
              <td className="r">{R(totalExp)}</td>
              <td className="r">—</td>
              <td className="r">{R(totalCashKD)}</td>
              <td className="r" style={{color: totRevDiff.ok ? 'var(--grn)' : 'var(--red)'}}>{totRevDiff.text}</td>
              <td className="r">—</td>
              <td className="r">—</td>
              <td className="r">{R(closingBal)}</td>
              <td className="r">—</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grand-row">
        <span className="gl">Cash on Hand (Closing Balance)</span>
        <span className="gv">{R(closingBal)}</span>
      </div>
    </div>
  )
}