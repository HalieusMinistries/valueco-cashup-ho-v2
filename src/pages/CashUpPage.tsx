import { useApp } from '../context/AppContext'
import { R, dateStr, varianceLabel } from '../utils/calc'
import { useReconciliation } from '../hooks/useReconciliation'
import { MONTHS_S } from '../utils/stores'
import NumericInput from '../components/NumericInput'

interface Props { setTab: (t: any) => void }

export default function CashUpPage({ setTab: _setTab }: Props) {
  const app = useApp()
  const daysInMonth = new Date(app.year, app.month, 0).getDate()

  function getDayKD(day: number) {
    const ds = dateStr(app.year, app.month, day)
    return app.kdRows.filter(r => r.store === app.code && r.date === ds)
  }

  function hasData(day: number) {
    return getDayKD(day).length > 0 ||
      app.storeRows.some(r => r.date === dateStr(app.year, app.month, day))
  }

  function handleDayClick(d: number) {
    app.addLog('DAY_SELECT', `Cash Up day selected: ${String(d).padStart(2,'0')} ${MONTHS_S[app.month-1]} ${app.year}`)
    app.setCurrentDay(d)
  }

  return (
    <div>
      <div className="day-tabs">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1
          const has = hasData(d)
          const active = app.currentDay === d
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

      {app.currentDay
        ? <DaySheet day={app.currentDay} />
        : <div style={{color:'var(--txt2)',fontFamily:'var(--mono)',fontSize:11}}>Select a day above</div>
      }
    </div>
  )
}

function DaySheet({ day }: { day: number }) {
  const app = useApp()
  const ds = dateStr(app.year, app.month, day)
  const dn = `${app.year}${String(app.month).padStart(2,'0')}${String(day).padStart(2,'0')}`

  const recon = useReconciliation(day)
  const inp = app.getDayInput(day)
  const {
    kdCash, kdCard, kdEFT, kdVoucher, kdLoyalty, kdStoreTotal,
    repCash, spTotal, cashDepTotal,
    contribCash, contribCard, contribEFT, contribs,
    effFloats, effChange,
    physicalCashTotal, cashierTotal,
    grandTotal,
    cashVariance, cardVariance, eftVariance, voucherVariance, loyaltyVariance, grandVariance, physVariance,
    spEntries, cashDepEntries,
    hasKD, hasSP, hasCashDep, hasContribs, hasStoreData
  } = recon
  const storeTotal = kdStoreTotal
  const cashDiff = cashVariance
  const cardDiff = cardVariance
  const eftDiff = eftVariance
  const grandDiff = grandVariance
  const physDiff = physVariance
  const tC = recon.kdCash
  const tD = recon.kdCard
  const tE = contribEFT
  const sp = recon.spEntries
  const bc = recon.cashDepEntries
  const cashiers = app.kdRows.filter(r => r.store === app.code && r.date === ds && r.cashier.toUpperCase() !== 'STORE SUBTOTAL')
  const storeCashiers = app.storeRows.filter(r => r.date === ds)
  const stC = storeCashiers.reduce((a, r) => a + r.cash, 0)
  const stD = storeCashiers.reduce((a, r) => a + r.card, 0)
  const stE = storeCashiers.reduce((a, r) => a + r.eft, 0)
  const stRt = storeCashiers.reduce((a, r) => a + r.returns, 0)
  const stGift = storeCashiers.reduce((a, r) => a + r.gift, 0)
  const stL = storeCashiers.reduce((a, r) => a + r.loyalty, 0)

  const tRn = app.kdRows.filter(r => r.store === app.code && r.date === ds && r.cashier.toUpperCase() !== 'STORE SUBTOTAL').reduce((a, r) => a + r.rounding, 0)
  const tG = app.kdRows.filter(r => r.store === app.code && r.date === ds && r.cashier.toUpperCase() !== 'STORE SUBTOTAL').reduce((a, r) => a + r.gross, 0)
  const tRt = app.kdRows.filter(r => r.store === app.code && r.date === ds && r.cashier.toUpperCase() !== 'STORE SUBTOTAL').reduce((a, r) => a + r.returns, 0)
  const tV = app.kdRows.filter(r => r.store === app.code && r.date === ds && r.cashier.toUpperCase() !== 'STORE SUBTOTAL').reduce((a, r) => a + r.voucher, 0)
  const tL = app.kdRows.filter(r => r.store === app.code && r.date === ds && r.cashier.toUpperCase() !== 'STORE SUBTOTAL').reduce((a, r) => a + r.loyalty, 0)

  const stCoupon = app.storeRows.filter(r => r.date === ds).reduce((a, r) => a + r.coupon, 0)

  function upd(field: string, val: string) {
    const parsed = parseFloat(val) || 0
    app.addLog('FIELD_CHANGE', `CashUp day ${String(day).padStart(2,'00')} — ${field}: ${(inp as any)[field] ?? 0} → ${parsed}`)
    app.setDayInput(day, { [field]: parsed } as any)
  }

  if (cashiers.length === 0 && storeCashiers.length === 0) {
    return (
      <div className="card">
        <div className="card-bd" style={{color:'var(--txt2)',fontFamily:'var(--mono)',fontSize:11}}>
          No data for {ds}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,position:'sticky',top:0,zIndex:10,background:'var(--bg)',padding:'8px 0'}}>
        <div style={{fontFamily:'var(--mono)',fontSize:15,fontWeight:600}}>
          {String(day).padStart(2,'0')} {MONTHS_S[app.month-1]} {app.year} — {app.name}
        </div>
        <div style={{display:'flex',gap:6}}>
          <span className={`badge ${cashiers.length > 0 ? 'ok' : 'pend'}`}>{cashiers.length > 0 ? '✓ KD' : '◦ No KD'}</span>
          <span className={`badge ${sp.length > 0 ? 'ok' : 'pend'}`}>{sp.length > 0 ? '✓ SpeedPoint' : '◦ No SP'}</span>
          <span className={`badge ${bc.length > 0 ? 'ok' : 'pend'}`}>{bc.length > 0 ? '✓ Cash Dep' : '◦ No Cash'}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="stat"><div className="sl">KD Cash</div><div className="sv acc">{R(kdCash)}</div></div>
        <div className="stat"><div className="sl">KD Cards</div><div className="sv acc">{R(kdCard)}</div></div>
        <div className="stat"><div className="sl">KD EFT</div><div className="sv acc">{R(kdEFT)}</div></div>
        <div className="stat"><div className="sl">KD Store Total</div><div className="sv">{R(storeTotal)}</div></div>
      </div>

      {/* KD Cashier Table */}
      <div className="section-lbl">KingDee Cashier Totals</div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Cashier</th><th className="r">Cash</th><th className="r">Cards</th>
              <th className="r">EFT</th><th className="r">Rounding</th><th className="r">Gross</th>
              <th className="r">Returns</th><th className="r">Voucher</th><th className="r">Loyalty</th>
            </tr>
          </thead>
          <tbody>
            {cashiers.map(r => (
              <tr key={r.cashier}>
                <td>{r.cashier}</td>
                <td className="r">{R(r.cash)}</td><td className="r">{R(r.card)}</td>
                <td className="r">{R(r.eft)}</td><td className="r">{R(r.rounding)}</td>
                <td className="r">{R(r.gross)}</td><td className="r">{R(r.returns)}</td>
                <td className="r">{R(r.voucher)}</td><td className="r">{R(r.loyalty)}</td>
              </tr>
            ))}
            <tr className="sub">
              <td>TOTALS</td>
              <td className="r">{R(tC)}</td><td className="r">{R(tD)}</td>
              <td className="r">{R(tE)}</td><td className="r">{R(tRn)}</td>
              <td className="r">{R(tG)}</td><td className="r">{R(tRt)}</td>
              <td className="r">{R(tV)}</td><td className="r">{R(tL)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Store Cashier Table — hidden, kept for fallback */}
      <div style={{display:'none'}}>
        <div className="section-lbl">
          Store Reported Cashier Totals
          <span className={`badge ${hasStoreData ? 'ok' : 'pend'}`}>{hasStoreData ? '✓ From Store CSV' : '◦ No Store CSV'}</span>
        </div>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Cashier</th><th className="r">Cash</th><th className="r">Cards</th>
                <th className="r">EFT</th><th className="r">Erase</th><th className="r">Total</th>
                <th className="r">Returns</th><th className="r">Gift Vch</th>
                <th className="r">Coupon Vch</th><th className="r">Loyalty</th>
              </tr>
            </thead>
            <tbody>
              {hasStoreData ? storeCashiers.map(r => (
                <tr key={r.cashier}>
                  <td>{r.cashier}</td>
                  <td className="r">{R(r.cash)}</td><td className="r">{R(r.card)}</td>
                  <td className="r">{R(r.eft)}</td><td className="r">{R(r.erase)}</td>
                  <td className="r">{R(r.total)}</td><td className="r">{R(r.returns)}</td>
                  <td className="r">{R(r.gift)}</td><td className="r">{R(r.coupon)}</td>
                  <td className="r">{R(r.loyalty)}</td>
                </tr>
              )) : (
                <tr><td colSpan={10} style={{color:'var(--txt2)',textAlign:'center',padding:10}}>No store CSV loaded for this day</td></tr>
              )}
              {hasStoreData && (
                <tr className="sub">
                  <td>TOTALS</td>
                  <td className="r">{R(stC)}</td><td className="r">{R(stD)}</td>
                  <td className="r">{R(stE)}</td><td className="r">—</td>
                  <td className="r">{R(stC+stD+stE)}</td><td className="r">{R(stRt)}</td>
                  <td className="r">{R(stGift)}</td><td className="r">{R(stCoupon)}</td>
                  <td className="r">{R(stL)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contributions */}
      <div className="section-lbl">
        Store Contributions (KingDee)
        <span className={`badge ${hasContribs ? 'ok' : 'pend'}`}>{hasContribs ? '✓ Loaded' : '◦ Not loaded'}</span>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Cashier</th><th className="r">Cash (Reported)</th>
              <th className="r">Bank Card (Reported)</th><th className="r">Erase</th>
              <th className="r">vs KD System</th>
            </tr>
          </thead>
          <tbody>
            {hasContribs ? contribs.map((r: any) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td className="r">{R(r.cash)}</td><td className="r">{R(r.card)}</td>
                <td className="r">{R(r.erase)}</td>
                <td className="r" style={{color: Math.abs(r.diff) < 0.01 ? 'var(--grn)' : 'var(--red)'}}>
                  {varianceLabel(-r.diff, 0).ok ? '✓ R0,00' : varianceLabel(-r.diff, 0).text}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} style={{color:'var(--txt2)',textAlign:'center',padding:10}}>No contributions data for this day</td></tr>
            )}
            {hasContribs && (
              <tr className="sub">
                <td>TOTALS</td>
                <td className="r">{R(contribs.reduce((a: number, r: any) => a + r.cash, 0))}</td>
                <td className="r">{R(contribs.reduce((a: number, r: any) => a + r.card, 0))}</td>
                <td className="r">{R(contribs.reduce((a: number, r: any) => a + r.erase, 0))}</td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* K Column + Bank */}
      <div className="g2">
        <div>
          <div className="section-lbl">
            Cash Office Totals (K Column)
            {hasStoreData && <span className="badge ok" style={{fontSize:8}}>auto-populated</span>}
          </div>
          <div className="card">
            <div className="card-bd">
              {[
                { label: 'K4 — FNB Deposit',    field: 'fnb',        val: inp.fnb !== 0 ? inp.fnb : contribCash },
                { label: 'K5 — Cash Surrender',  field: 'surrender',  val: inp.surrender },
                { label: 'K6 — Till Floats',     field: 'floats',     val: effFloats },
                { label: 'K7 — Change Boxes',    field: 'change',     val: effChange },
                { label: 'K8 — Petty Cash',      field: 'petty',      val: inp.petty },
                { label: 'K9 — Cash on Hand',    field: 'cashOnHand', val: inp.cashOnHand ?? 0 },
              ].map(({ label, field, val }) => (
                <div key={field} className="frow">
                  <span className="flbl">{label}</span>
                  <NumericInput
                    className="fi"
                    value={val}
                    onChange={v => upd(field, String(v))}
                  />
                </div>
              ))}
              <div className="frow"><span className="flbl">K10 — EFT</span><span className="fval acc">{R(tE)}</span></div>
              <div className="frow"><span className="flbl">K11 — Return Vouchers</span><span className="fval">{R(tRt)}</span></div>
              <div className="frow"><span className="flbl">K12 — Gift Vouchers</span><span className="fval">{R(tV)}</span></div>
              <div className="frow"><span className="flbl">K13 — Coupon Vouchers</span><span className="fval">{R(tV)}</span></div>
              <div className="frow"><span className="flbl">K14 — Loyalty Points</span><span className="fval">{R(tL)}</span></div>
              <div className="frow"><span className="flbl">K15 — Speed Points (Cards)</span><span className="fval acc">{R(tD)}</span></div>
              <div className="frow" style={{borderTop:'1px solid var(--brd)',marginTop:4,paddingTop:8}}>
                <span className="flbl" style={{color:'var(--txt)'}}>K16 — Store Total</span>
                <span className="fval acc" style={{fontSize:14}}>
                  {R(inp.fnb+inp.surrender+effFloats+effChange+inp.petty+(inp.cashOnHand??0)+tE+tRt+tV+tL+tD)}
                </span>
              </div>
            </div>
          </div>

          <div className="section-lbl">Physical Cash Check</div>
          <div className="card">
            <div className="card-bd">
              <div className="frow"><span className="flbl">Total G4S Deposits (K4)</span><span className="fval">{R(inp.fnb !== 0 ? inp.fnb : contribCash)}</span></div>
              <div className="frow"><span className="flbl">Loose Change / Surrender (K5)</span><span className="fval">{R(inp.surrender)}</span></div>
              <div className="frow">
                <span className="flbl">K9 — Cash on Hand</span>
                <NumericInput
                  className="ti"
                  style={{width:120}}
                  value={inp.cashOnHand ?? 0}
                  onChange={v => {
                    app.addLog('FIELD_CHANGE', `CashUp day ${String(day).padStart(2,'0')} — cashOnHand: ${inp.cashOnHand ?? 0} → ${v}`)
                    app.setDayInput(day, { ...inp, cashOnHand: v })
                  }}
                />
              </div>
              <div className="frow"><span className="flbl">Total Cash per Summary</span><span className="fval">{R((inp.fnb !== 0 ? inp.fnb : contribCash) + inp.surrender + (inp.cashOnHand || 0))}</span></div>
              <div className="frow"><span className="flbl">Total Cash per Cashier (C47)</span><span className="fval">{R(hasStoreData ? stC : tC)}</span></div>
              <div className="frow" style={{borderTop:'1px solid var(--brd)',marginTop:4,paddingTop:8}}>
                <span className="flbl" style={{color:'var(--txt)'}}>Difference</span>
                <span className="fval" style={{color: physDiff.ok ? 'var(--grn)' : 'var(--red)'}}>{physDiff.text}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="section-lbl">Bank Transactions</div>
          <div className="card">
            <div className="card-bd">
              <div className="frow"><span className="flbl">SpeedPoint entries</span><span className="fval acc">{sp.length}</span></div>
              <div className="frow"><span className="flbl">SpeedPoint total</span><span className="fval acc">{R(spTotal)}</span></div>
              {sp.map((r, i) => (
                <div key={i} className="frow" style={{paddingLeft:10}}>
                  <span className="flbl" style={{fontSize:9}}>{r.desc.substring(0,35)}</span>
                  <span className="fval" style={{fontSize:10}}>{R(r.amount)}</span>
                </div>
              ))}
              <div className="frow" style={{borderTop:'1px solid var(--brd)',marginTop:4,paddingTop:8}}>
                <span className="flbl">Cash deposit entries</span><span className="fval">{bc.length}</span>
              </div>
              <div className="frow"><span className="flbl">Cash deposit total</span><span className="fval">{R(cashDepTotal)}</span></div>
              {bc.map((r, i) => (
                <div key={i} className="frow" style={{paddingLeft:10}}>
                  <span className="flbl" style={{fontSize:9}}>{r.desc.substring(0,35)}</span>
                  <span className="fval" style={{fontSize:10}}>{R(r.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recon Table */}
      <div className="section-lbl">KingDee vs Reported Reconciliation</div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th className="r" style={{color:'var(--acc)'}}>KingDee</th>
              <th className="r" style={{color:'var(--acc2)'}}>Reported</th>
              <th className="r">Difference</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={{color:'var(--txt2)'}}>SUMMARY TOTAL</td><td className="r" style={{color:'var(--acc)'}}>{R(storeTotal)}</td><td></td><td></td></tr>
            <tr>
              <td>Cash</td>
              <td className="r" style={{color:'var(--acc)'}}>{R(kdCash)}</td>
              <td className="r" style={{color:'var(--acc2)'}}>{R(repCash)}</td>
              <td className="r" style={{color: cashDiff.ok ? 'var(--grn)' : 'var(--red)'}}>{cashDiff.text}</td>
            </tr>
            <tr>
              <td>Cards</td>
              <td className="r" style={{color:'var(--acc)'}}>{R(kdCard)}</td>
              <td className="r" style={{color:'var(--acc2)'}}>{R(spTotal)}</td>
              <td className="r" style={{color: cardDiff.ok ? 'var(--grn)' : 'var(--red)'}}>{cardDiff.text}</td>
            </tr>
            <tr>
              <td>EFT</td>
              <td className="r" style={{color:'var(--acc)'}}>{R(kdEFT)}</td>
              <td className="r" style={{color:'var(--acc2)'}}>{R(tE)}</td>
              <td className="r" style={{color: eftDiff.ok ? 'var(--grn)' : 'var(--red)'}}>{eftDiff.text}</td>
            </tr>
            <tr>
              <td>Vouchers</td>
              <td className="r" style={{color:'var(--acc)'}}>{R(kdVoucher)}</td>
              <td className="r" style={{color:'var(--acc2)'}}>{R(stCoupon)}</td>
              <td className="r" style={{color: varianceLabel(stCoupon,kdVoucher).ok ? 'var(--grn)' : 'var(--red)'}}>{varianceLabel(stCoupon,kdVoucher).text}</td>
            </tr>
            <tr>
              <td>Loyalty</td>
              <td className="r" style={{color:'var(--acc)'}}>{R(kdLoyalty)}</td>
              <td className="r" style={{color:'var(--acc2)'}}>{R(tL)}</td>
              <td className="r" style={{color: varianceLabel(tL,kdLoyalty).ok ? 'var(--grn)' : 'var(--red)'}}>{varianceLabel(tL,kdLoyalty).text}</td>
            </tr>
            <tr>
              <td>Petty Cash</td>
              <td className="r" style={{color:'var(--acc)'}}>—</td>
              <td className="r" style={{color:'var(--acc2)'}}>{R(inp.petty)}</td>
              <td></td>
            </tr>
            <tr className="sub">
              <td>GRAND TOTAL</td>
              <td className="r">{R(storeTotal)}</td>
              <td className="r">{R(grandTotal)}</td>
              <td className="r" style={{color: grandDiff.ok ? 'var(--grn)' : 'var(--red)'}}>{grandDiff.text}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grand-row">
        <span className="gl">Store Variance (Grand Total − Store Total)</span>
        <span className="gv" style={{color: grandDiff.ok ? 'var(--grn)' : 'var(--red)'}}>{grandDiff.text}</span>
      </div>
    </div>
  )
}