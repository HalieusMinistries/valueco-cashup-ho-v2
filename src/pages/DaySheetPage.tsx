import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { dateStr, R, varianceLabel } from '../utils/calc'
import { MONTHS_S } from '../utils/stores'
import NumericInput from '../components/NumericInput'

export default function DaySheetPage() {
  const app = useApp()
  const [day, setDay] = useState<number | null>(null)
  const daysInMonth = new Date(app.year, app.month, 0).getDate()

  function hasContribs(d: number) {
    const ds = dateStr(app.year, app.month, d)
    return app.contributionRows.some(r => r.date === ds && r.store === app.code)
  }

  function handleDayClick(d: number) {
    app.addLog('DAY_SELECT', `Day Sheet day selected: ${String(d).padStart(2,'0')} ${MONTHS_S[app.month-1]} ${app.year}`)
    setDay(d)
  }

  return (
    <div>
      <div className="day-tabs">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1
          const has = hasContribs(d)
          const active = day === d
          return (
            <div
              key={d}
              className={`dt ${has ? 'has' : ''} ${active ? 'active' : ''}`}
              onClick={() => handleDayClick(d)}
            >
              {String(d).padStart(2, '0')}
            </div>
          )
        })}
      </div>

      {day
        ? <DaySheet key={day} day={day} />
        : <div style={{color:'var(--txt2)',fontFamily:'var(--mono)',fontSize:11}}>Select a day above</div>
      }
    </div>
  )
}

function DaySheet({ day }: { day: number }) {
  const app = useApp()
  const ds = dateStr(app.year, app.month, day)
  const dateLabel = `${String(day).padStart(2,'0')} ${MONTHS_S[app.month-1]} ${app.year}`

  const contribs = (() => {
    const rows = app.contributionRows.filter(r => r.date === ds && r.store === app.code)
    const map: Record<string, any> = {}
    rows.forEach(r => {
      if (!map[r.cashier]) map[r.cashier] = {
        name: r.cashier, cash: 0, card: 0, eft: 0, erase: 0,
        petty: r.petty, diff: 0, remark: r.remark || ''
      }
      if (r.mode === 'cash') map[r.cashier].cash = r.contribution
      else if (r.mode === 'bank card') map[r.cashier].card = r.contribution
      else if (r.mode === 'eft') { map[r.cashier].eft = r.contribution; console.log('EFT hit:', r.cashier, r.contribution, r.store, r.date) }
      else if (r.mode === 'erase') map[r.cashier].erase = r.contribution
      map[r.cashier].diff += r.diff
    })
    return Object.values(map)
  })()

  const inp = app.getDayInput(day)
  const storeConfig = app.stores.find(s => s.code === app.code)
  const defaultFloats = storeConfig?.floats ?? 0
  const defaultChange = storeConfig?.change ?? 0
  const effFloats = inp.floats || defaultFloats
  const effChange = inp.change || defaultChange

  const hasContribs = contribs.length > 0

  const tCash = contribs.reduce((a: number, r: any) => a + r.cash, 0)
  const tCard = contribs.reduce((a: number, r: any) => a + r.card, 0)
  const tErase = contribs.reduce((a: number, r: any) => a + r.erase, 0)
  const tPettyKD = contribs.reduce((a: number, r: any) => a + r.petty, 0)

  const cashInSafe = inp.fnb + effFloats + effChange + (inp.looseChange || 0) + (inp.cashOnHand || 0) - inp.petty + (inp.refundOfPayment || 0)

  function upd(field: string, val: string) {
    const parsed = parseFloat(val) || 0
    app.addLog('FIELD_CHANGE', `DaySheet day ${String(day).padStart(2,'0')} — ${field}: ${(inp as any)[field] ?? 0} → ${parsed}`)
    app.setDayInput(day, { [field]: parsed } as any)
  }

  function updNotes(val: string) {
    app.addLog('FIELD_CHANGE', `DaySheet day ${String(day).padStart(2,'0')} — notes updated`)
    app.setDayInput(day, { ...(inp as any), dayNotes: val })
  }

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,position:'sticky',top:0,zIndex:10,background:'var(--bg)',padding:'8px 0'}}>
        <div style={{fontFamily:'var(--mono)',fontSize:15,fontWeight:600}}>
          {dateLabel} — {app.name}
        </div>
        <span className={`badge ${hasContribs ? 'ok' : 'pend'}`}>
          {hasContribs ? '✓ Contributions' : '◦ No Contributions'}
        </span>
      </div>

      {/* Contributions Table */}
      <div className="section-lbl">Store Contributions (KingDee)</div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Cashier</th>
              <th className="r">Cash</th>
              <th className="r">Bank Card</th>
              <th className="r">EFT</th>
              <th className="r">Erase</th>
              <th className="r">Petty Cash</th>
              <th className="r">vs KD System</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            {hasContribs ? contribs.map((r: any) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td className="r">{R(r.cash)}</td>
                <td className="r">{R(r.card)}</td>
                <td className="r">{R(r.eft || 0)}</td>
                <td className="r">{R(r.erase)}</td>
                <td className="r">{R(r.petty)}</td>
                <td className="r" style={{color: Math.abs(r.diff) < 0.01 ? 'var(--grn)' : 'var(--red)'}}>
                  {varianceLabel(-r.diff, 0).ok ? '✓ R0,00' : varianceLabel(-r.diff, 0).text}
                </td>
                <td style={{fontSize:11,color:'var(--txt2)'}}>{r.remark || '—'}</td>
              </tr>
            )) : (
              <tr><td colSpan={8} style={{color:'var(--txt2)',textAlign:'center',padding:10}}>No contributions loaded for this day</td></tr>
            )}
            {hasContribs && (
              <tr className="sub">
                <td>TOTALS</td>
                <td className="r">{R(tCash)}</td>
                <td className="r">{R(tCard)}</td>
                <td className="r">{R(contribs.reduce((a: number, r: any) => a + (r.eft || 0), 0))}</td>
                <td className="r">{R(tErase)}</td>
                <td className="r">{R(contribs.reduce((a: number, r: any) => a + r.petty, 0))}</td>
                <td></td><td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Physical Cash Check */}
      <div className="section-lbl">Physical Cash Check</div>
      <div className="card">
        <div className="card-bd">
          <div className="frow">
            <span className="flbl">K4 — FNB Deposit (Cash Sales)</span>
            <NumericInput className="fi" value={inp.fnb} onChange={v => upd('fnb', String(v))} />
          </div>
          <div className="frow">
            <span className="flbl">K6 — Till Floats</span>
            <span className="fval">{R(effFloats)}</span>
          </div>
          <div className="frow">
            <span className="flbl">K7 — Change Boxes</span>
            <span className="fval">{R(effChange)}</span>
          </div>
          <div className="frow">
            <span className="flbl">Loose Change</span>
            <NumericInput className="fi" value={inp.looseChange ?? 0} onChange={v => upd('looseChange', String(v))} />
          </div>
          <div className="frow">
            <span className="flbl">Cash on Hand</span>
            <NumericInput className="fi" value={inp.cashOnHand ?? 0} onChange={v => upd('cashOnHand', String(v))} />
          </div>
          <div className="frow">
            <span className="flbl">Less: Petty Cash (manual)</span>
            <NumericInput className="fi" value={inp.petty} onChange={v => upd('petty', String(v))} />
          </div><div className="frow">
            <span className="flbl">Refund of Payment</span>
            <NumericInput className="fi" value={inp.refundOfPayment ?? 0} onChange={v => upd('refundOfPayment', String(v))} />
          </div>

          <div className="frow">
            <span className="flbl">Petty Cash per KD Contributions</span>
            <span className="fval" style={{color: Math.abs(inp.petty - tPettyKD) < 0.01 ? 'var(--grn)' : 'var(--red)'}}>
              {R(tPettyKD)} {Math.abs(inp.petty - tPettyKD) < 0.01 ? '✓' : '⚠ differs'}
            </span>
          </div>
          <div className="frow" style={{borderTop:'1px solid var(--brd)',marginTop:4,paddingTop:8}}>
            <span className="flbl" style={{fontWeight:700,color:'var(--txt)'}}>Cash in Safe</span>
            <span className="fval acc" style={{fontSize:14}}>{R(cashInSafe)}</span>
          </div>
        </div>
      </div>

      {/* EFT Details */}
      <div className="section-lbl">EFT Details</div>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <table>
          <thead>
            <tr>
              <th>Date of Payment</th>
              <th>Sales Order Nr</th>
              <th className="r">Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(inp.eftDetails || []).map((e, i) => (
              <tr key={i}>
                <td>
                  <input className="ti name" value={e.date} placeholder="Date"
                    onChange={ev => {
                      const updated = [...(inp.eftDetails || [])]
                      updated[i] = { ...updated[i], date: ev.target.value }
                      app.addLog('FIELD_CHANGE', `DaySheet day ${String(day).padStart(2,'0')} — EFT row ${i+1} date: ${ev.target.value}`)
                      app.setDayInput(day, { ...inp, eftDetails: updated })
                    }} />
                </td>
                <td>
                  <input className="ti name" value={e.soNr} placeholder="Sales order number"
                    onChange={ev => {
                      const updated = [...(inp.eftDetails || [])]
                      updated[i] = { ...updated[i], soNr: ev.target.value }
                      app.addLog('FIELD_CHANGE', `DaySheet day ${String(day).padStart(2,'0')} — EFT row ${i+1} SO nr: ${ev.target.value}`)
                      app.setDayInput(day, { ...inp, eftDetails: updated })
                    }} />
                </td>
                <td>
                  <NumericInput
                    className="ti"
                    value={e.amount || 0}
                    onChange={v => {
                      const updated = [...(inp.eftDetails || [])]
                      updated[i] = { ...updated[i], amount: v }
                      app.addLog('FIELD_CHANGE', `DaySheet day ${String(day).padStart(2,'0')} — EFT row ${i+1} amount: ${v}`)
                      app.setDayInput(day, { ...inp, eftDetails: updated })
                    }} />
                </td>
                <td>
                  <button className="btn sec" style={{fontSize:10,padding:'2px 8px'}}
                    onClick={() => {
                      const updated = (inp.eftDetails || []).filter((_, idx) => idx !== i)
                      app.addLog('EFT_ROW', `DaySheet day ${String(day).padStart(2,'0')} — EFT row ${i+1} removed`)
                      app.setDayInput(day, { ...inp, eftDetails: updated })
                    }}>✕</button>
                </td>
              </tr>
            ))}
            {(inp.eftDetails || []).length > 0 && (
              <tr className="sub">
                <td colSpan={2}><b>Total</b></td>
                <td className="r">{R((inp.eftDetails || []).reduce((a, e) => a + e.amount, 0))}</td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
        <div style={{padding:'8px 10px',borderTop:'1px solid var(--brd)'}}>
          <button className="btn sec" style={{fontSize:11,padding:'5px 10px'}}
            onClick={() => {
              const updated = [...(inp.eftDetails || []), { date: '', soNr: '', amount: 0 }]
              app.addLog('EFT_ROW', `DaySheet day ${String(day).padStart(2,'0')} — EFT row added`)
              app.setDayInput(day, { ...inp, eftDetails: updated })
            }}>+ Add EFT Row</button>
        </div>
      </div>

      {/* Notes */}
      <div className="section-lbl">Notes</div>
      <div className="card">
        <div className="card-bd">
          <textarea
            style={{width:'100%',padding:8,border:'1px solid var(--brd)',borderRadius:4,fontSize:12,fontFamily:'var(--sans)',resize:'vertical',minHeight:80}}
            placeholder="Cash up notes, comments..."
            value={inp.dayNotes || ''}
            onChange={e => updNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}