import { useApp } from '../context/AppContext'
import { dateStr, R, diffLabel, matchSpeedPoints } from '../utils/calc'

interface Props { setTab: (t: any) => void }

export default function OversPage({ setTab }: Props) {
  const app = useApp()

  const daysInMonth = new Date(app.year, app.month, 0).getDate()
  const days: number[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    if (app.kdRows.some(r => r.store === app.code && r.date === dateStr(app.year, app.month, d))) days.push(d)
  }

  if (!days.length) return (
    <div style={{color:'var(--txt2)',fontFamily:'var(--mono)',fontSize:11}}>Load data first</div>
  )

  // Build KD cards by date for SP matching
  const kdCardsByDate: Record<string, number> = {}
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = dateStr(app.year, app.month, d)
    const kdRows = app.kdRows.filter(r => r.store === app.code && r.date === ds)
    kdCardsByDate[ds] = kdRows.reduce((a, r) => a + r.card, 0)
  }
  const storeBankRows = app.bankRows.filter(r => r.account === app.bank)
  const spMatches = matchSpeedPoints(storeBankRows, app.sp, kdCardsByDate, app.year, app.month)

  let runBal = 0

  const rows = days.map(day => {
    const ds = dateStr(app.year, app.month, day)
    const kdRows = app.kdRows.filter(r => r.store === app.code && r.date === ds)
    const cashiers = kdRows.filter(r => r.cashier.toUpperCase() !== 'STORE SUBTOTAL')
    const inp = app.getDayInput(day)
    const kdD = kdRows.reduce((a, r) => a + r.card, 0)
    const kdE = kdRows.reduce((a, r) => a + r.eft, 0)
    const tE = cashiers.reduce((a, r) => a + r.eft, 0)
    const spT = spMatches.filter(m => m.coveredKDDay === ds).reduce((a, m) => a + m.bankAmount, 0)
    const dayTotal = inp.fnb + inp.floats + inp.change
    runBal += dayTotal - inp.surrender - inp.petty

    const cardDiff = diffLabel(spT, kdD)
    const eftDiff = diffLabel(tE, kdE)
    const runBalOk = Math.abs(runBal) < 0.01

    return (
      <tr key={day} className="clickable" onClick={() => { app.setCurrentDay(day); setTab('cashup') }}>
        <td style={{color:'var(--acc)',fontWeight:600}}>{day}</td>
        <td className="r">{R(inp.fnb)}</td>
        <td className="r">{R(inp.surrender)}</td>
        <td className="r">{R(inp.petty)}</td>
        <td className="r">{R(inp.change)}</td>
        <td className="r">{R(inp.floats)}</td>
        <td className="r">{R(dayTotal)}</td>
        <td className="r" style={{color: runBalOk ? 'var(--txt)' : 'var(--red)'}}>{R(runBal)}</td>
        <td className="r" style={{color:'var(--acc)'}}>{R(kdD)}</td>
        <td className="r" style={{color:'var(--acc2)'}}>{R(spT)}</td>
        <td className="r" style={{color: cardDiff.ok ? 'var(--grn)' : 'var(--red)'}}>{cardDiff.text}</td>
        <td className="r" style={{color:'var(--acc)'}}>{R(kdE)}</td>
        <td className="r" style={{color:'var(--acc2)'}}>{R(tE)}</td>
        <td className="r" style={{color: eftDiff.ok ? 'var(--grn)' : 'var(--red)'}}>{eftDiff.text}</td>
      </tr>
    )
  })

  return (
    <div>
      <div className="section-lbl">Overs and Unders — click row to open day sheet</div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th className="r">FNB Dep</th>
              <th className="r">Surrender</th>
              <th className="r">Petty</th>
              <th className="r">Change</th>
              <th className="r">Floats</th>
              <th className="r">Day Total</th>
              <th className="r">Running Bal</th>
              <th className="r" colSpan={3}>Cards</th>
              <th className="r" colSpan={3}>EFT</th>
            </tr>
            <tr>
              <th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th>
              <th className="r" style={{color:'var(--acc)'}}>KD</th>
              <th className="r" style={{color:'var(--acc2)'}}>Bank</th>
              <th className="r">Diff</th>
              <th className="r" style={{color:'var(--acc)'}}>KD</th>
              <th className="r" style={{color:'var(--acc2)'}}>Cashiers</th>
              <th className="r">Diff</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </div>
  )
}