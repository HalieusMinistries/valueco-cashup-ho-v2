import { useApp } from '../context/AppContext'
import { dateStr, R, diffLabel, matchSpeedPoints } from '../utils/calc'

interface Props { setTab: (t: any) => void }

export default function ReconPage({ setTab }: Props) {
  const app = useApp()

  const daysInMonth = new Date(app.year, app.month, 0).getDate()
  const days: number[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    if (app.kdRows.some(r => r.store === app.code && r.date === dateStr(app.year, app.month, d))) days.push(d)
  }

  if (!days.length) return (
    <div style={{color:'var(--txt2)',fontFamily:'var(--mono)',fontSize:11}}>Load KingDee CSV first</div>
  )

  let gKDC = 0, gKDD = 0, gKDE = 0, gKDV = 0, gKDL = 0, gSP = 0, gRep = 0, gPetty = 0

  // Build KD cards by date for SP matching
  const kdCardsByDate: Record<string, number> = {}
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = dateStr(app.year, app.month, d)
    const kdRows = app.kdRows.filter(r => r.store === app.code && r.date === ds)
    kdCardsByDate[ds] = kdRows.reduce((a, r) => a + r.card, 0)
  }

  const storeBankRows = app.bankRows.filter(r => r.account === app.bank)
  const spMatches = matchSpeedPoints(storeBankRows, app.sp, kdCardsByDate, app.year, app.month)

  const rows = days.map(day => {
    const ds = dateStr(app.year, app.month, day)
    const kdRows = app.kdRows.filter(r => r.store === app.code && r.date === ds)
    const inp = app.getDayInput(day)
    const kdC = kdRows.reduce((a, r) => a + r.cash, 0)
    const kdD = kdRows.reduce((a, r) => a + r.card, 0)
    const kdE = kdRows.reduce((a, r) => a + r.eft, 0)
    const kdV = kdRows.reduce((a, r) => a + r.voucher, 0)
    const kdL = kdRows.reduce((a, r) => a + r.loyalty, 0)
    const spT = spMatches.filter(m => m.coveredKDDay === ds).reduce((a, m) => a + m.bankAmount, 0)
    const repC = inp.fnb
    gKDC += kdC; gKDD += kdD; gKDE += kdE; gKDV += kdV; gKDL += kdL
    gSP += spT; gRep += repC; gPetty += inp.petty

    const cashDiff = diffLabel(kdC, repC)
    const cardDiff = diffLabel(kdD, spT)

    return (
      <tr key={day} className="clickable" onClick={() => { app.setCurrentDay(day); setTab('cashup') }}>
        <td style={{color:'var(--acc)',fontWeight:600}}>{String(day).padStart(2,'0')}</td>
        <td className="r" style={{color:'var(--acc)'}}>{R(kdC)}</td>
        <td className="r" style={{color:'var(--acc2)'}}>{R(repC)}</td>
        <td className="r" style={{color: cashDiff.ok ? 'var(--grn)' : 'var(--red)'}}>{cashDiff.text}</td>
        <td className="r" style={{color:'var(--acc)'}}>{R(kdD)}</td>
        <td className="r" style={{color:'var(--acc2)'}}>{R(spT)}</td>
        <td className="r" style={{color: cardDiff.ok ? 'var(--grn)' : 'var(--red)'}}>{cardDiff.text}</td>
        <td className="r">{R(kdE)}</td>
        <td className="r">{R(kdV)}</td>
        <td className="r">{R(kdL)}</td>
        <td className="r">{R(inp.petty)}</td>
      </tr>
    )
  })

  const totCashDiff = diffLabel(gKDC, gRep)
  const totCardDiff = diffLabel(gKDD, gSP)

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
                  const diff = diffLabel(m.bankAmount, m.kdTotal)
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