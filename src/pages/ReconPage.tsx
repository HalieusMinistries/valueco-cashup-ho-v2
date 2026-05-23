import { useApp } from '../context/AppContext'
import { R, varianceLabel } from '../utils/calc'
import { useMonthReconciliation } from '../hooks/useMonthReconciliation'

interface Props { setTab: (t: any) => void }

export default function ReconPage({ setTab }: Props) {
  const app = useApp()
  const monthRecon = useMonthReconciliation()

  const activeDays = monthRecon.days.filter(d => d.kdCash > 0 || d.kdCard > 0 || d.kdEFT > 0)

  if (!activeDays.length) return (
    <div style={{color:'var(--txt2)',fontFamily:'var(--mono)',fontSize:11}}>Load KingDee CSV first</div>
  )

  const gKDC = monthRecon.totalKDCash
  const gKDD = monthRecon.totalKDCard
  const gKDE = monthRecon.totalKDEFT
  const gKDV = monthRecon.totalKDVoucher
  const gKDL = monthRecon.totalKDLoyalty
  const gSP = monthRecon.totalSP
  const gRep = monthRecon.totalRepCash
  const gPetty = monthRecon.totalPetty
  const spMatches = monthRecon.spMatches

  const rows = activeDays.map(d => {
    const inp = app.getDayInput(d.day)
    const cashDiff = varianceLabel(d.fnb !== 0 ? d.fnb : d.contribCash, d.kdCash)
    const cardDiff = varianceLabel(d.spTotal, d.kdCard)

    return (
      <tr key={d.day} className="clickable" onClick={() => { app.setCurrentDay(d.day); setTab('cashup') }}>
        <td style={{color:'var(--acc)',fontWeight:600}}>{String(d.day).padStart(2,'0')}</td>
        <td className="r" style={{color:'var(--acc)'}}>{R(d.kdCash)}</td>
        <td className="r" style={{color:'var(--acc2)'}}>{R(d.fnb !== 0 ? d.fnb : d.contribCash)}</td>
        <td className="r" style={{color: cashDiff.ok ? 'var(--grn)' : 'var(--red)'}}>{cashDiff.text}</td>
        <td className="r" style={{color:'var(--acc)'}}>{R(d.kdCard)}</td>
        <td className="r" style={{color:'var(--acc2)'}}>{R(d.spTotal)}</td>
        <td className="r" style={{color: cardDiff.ok ? 'var(--grn)' : 'var(--red)'}}>{cardDiff.text}</td>
        <td className="r">{R(d.kdEFT)}</td>
        <td className="r">{R(d.kdVoucher)}</td>
        <td className="r">{R(d.kdLoyalty)}</td>
        <td className="r">{R(inp.petty)}</td>
      </tr>
    )
  })

  const totCashDiff = varianceLabel(gRep, gKDC)
  const totCardDiff = varianceLabel(gSP, gKDD)
        
  return (
    <div>
      <div className="stats">
        <div className="stat"><div className="sl">Total KD Cash</div><div className="sv acc">{R(gKDC)}</div></div>
        <div className="stat"><div className="sl">Total KD Cards</div><div className="sv acc">{R(gKDD)}</div></div>
        <div className="stat"><div className="sl">Bank SpeedPoint</div><div className="sv">{R(gSP)}</div></div>
        <div className="stat">
          <div className="sl">Card Variance</div>
          <div className={`sv ${Math.abs(gKDD - gSP) < 0.01 ? 'pos' : 'neg'}`}>{R(Math.abs(gKDD - gSP))}</div>
        </div>
      </div>

      <div className="section-lbl">Day-by-Day — click row to open day sheet</div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th className="r" colSpan={3}>Cash</th>
              <th className="r" colSpan={3}>Cards</th>
              <th className="r">KD EFT</th>
              <th className="r">KD Voucher</th>
              <th className="r">KD Loyalty</th>
              <th className="r">Petty</th>
            </tr>
            <tr>
              <th></th>
              <th className="r" style={{color:'var(--acc)'}}>KingDee</th>
              <th className="r" style={{color:'var(--acc2)'}}>Reported</th>
              <th className="r">Diff</th>
              <th className="r" style={{color:'var(--acc)'}}>KingDee</th>
              <th className="r" style={{color:'var(--acc2)'}}>Bank SP</th>
              <th className="r">Diff</th>
              <th className="r"></th><th className="r"></th><th className="r"></th><th className="r"></th>
            </tr>
          </thead>
          <tbody>
            {rows}
            <tr className="sub">
              <td>TOTALS</td>
              <td className="r">{R(gKDC)}</td>
              <td className="r">{R(gRep)}</td>
              <td className="r" style={{color: totCashDiff.ok ? 'var(--grn)' : 'var(--red)'}}>{totCashDiff.text}</td>
              <td className="r">{R(gKDD)}</td>
              <td className="r">{R(gSP)}</td>
              <td className="r" style={{color: totCardDiff.ok ? 'var(--grn)' : 'var(--red)'}}>{totCardDiff.text}</td>
              <td className="r">{R(gKDE)}</td>
              <td className="r">{R(gKDV)}</td>
              <td className="r">{R(gKDL)}</td>
              <td className="r">{R(gPetty)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {spMatches.length > 0 && (
        <>
          <div className="section-lbl" style={{marginTop:16}}>SpeedPoint Settlement Matching</div>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Bank Date</th>
                  <th>Covers KD Day</th>
                  <th className="r">Bank SP Amount</th>
                  <th className="r">KD Cards</th>
                  <th className="r">Difference</th>
                  <th className="r">Status</th>
                </tr>
              </thead>
              <tbody>
                {spMatches.map((m, i) => {
                  const diff = varianceLabel(m.bankAmount, m.kdTotal)
                  return (
                    <tr key={`${m.bankDate}-${i}`}>
                      <td style={{color:'var(--acc)'}}>{m.bankDate}</td>
                      <td>{m.coveredKDDay}</td>
                      <td className="r">{R(m.bankAmount)}</td>
                      <td className="r">{R(m.kdTotal)}</td>
                      <td className="r" style={{color: diff.ok ? 'var(--grn)' : 'var(--red)'}}>{diff.text}</td>
                      <td className="r">
                        <span className={`badge ${m.matched ? 'ok' : 'err'}`}>
                          {m.matched ? '✓ Matched' : '⚠ Review'}
                        </span>
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