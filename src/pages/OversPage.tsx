import { useApp } from '../context/AppContext'
import { R, varianceLabel } from '../utils/calc'
import { useMonthReconciliation } from '../hooks/useMonthReconciliation'

interface Props { setTab: (t: any) => void }

export default function OversPage({ setTab }: Props) {
  
  const app = useApp()
  const monthRecon = useMonthReconciliation()

  const activeDays = monthRecon.days.filter(d => d.kdCash > 0 || d.kdCard > 0 || d.kdEFT > 0)

  if (!activeDays.length) return (
    <div style={{color:'var(--txt2)',fontFamily:'var(--mono)',fontSize:11}}>Load data first</div>
  )

  let runBal = 0

  const rows = activeDays.map(d => {
    const inp = app.getDayInput(d.day)
    const dayTotal = inp.fnb + inp.floats + inp.change
    runBal += dayTotal - inp.surrender - inp.petty

    const cardDiff = varianceLabel(d.spTotal, d.kdCard)
    const eftDiff = varianceLabel(d.kdEFT, d.kdEFT)
    const runBalOk = Math.abs(runBal) < 0.01

    return (
      <tr key={d.day} className="clickable" onClick={() => { app.setCurrentDay(d.day); setTab('cashup') }}>
        <td style={{color:'var(--acc)',fontWeight:600}}>{d.day}</td>
        <td className="r">{R(inp.fnb)}</td>
        <td className="r">{R(inp.surrender)}</td>
        <td className="r">{R(inp.petty)}</td>
        <td className="r">{R(inp.change)}</td>
        <td className="r">{R(inp.floats)}</td>
        <td className="r">{R(dayTotal)}</td>
        <td className="r" style={{color: runBalOk ? 'var(--txt)' : 'var(--red)'}}>{R(runBal)}</td>
        <td className="r" style={{color:'var(--acc)'}}>{R(d.kdCard)}</td>
        <td className="r" style={{color:'var(--acc2)'}}>{R(d.spTotal)}</td>
        <td className="r" style={{color: cardDiff.ok ? 'var(--grn)' : 'var(--red)'}}>{cardDiff.text}</td>
        <td className="r" style={{color:'var(--acc)'}}>{R(d.kdEFT)}</td>
        <td className="r" style={{color:'var(--acc2)'}}>{R(d.kdEFT)}</td>
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