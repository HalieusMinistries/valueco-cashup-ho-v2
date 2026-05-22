import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { R } from '../utils/calc'
import { MONTHS } from '../utils/stores'
import { fetchStores, fetchMonthData, deleteMonthData } from '../api/client'
import type { LiveStore, LiveDay } from '../api/client'

type View = 'feed' | 'detail' | 'floats'

export default function LiveFeedPage() {
  const app = useApp()
  const [view, setView] = useState<View>('feed')
  const [stores, setStores] = useState<LiveStore[]>([])
  const [results, setResults] = useState<{ store: LiveStore; days: LiveDay[] }[]>([])
  const [detailStore, setDetailStore] = useState<string>('')
  const [detailDays, setDetailDays] = useState<LiveDay[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState('')
  const [floatEdits, setFloatEdits] = useState<Record<string, { floats: number; change: number }>>({})

  useEffect(() => {
    loadFeed()
    const timer = setInterval(loadFeed, 30000)
    return () => clearInterval(timer)
  }, [app.month, app.year])

  async function loadFeed() {
    setLoading(true)
    try {
      const s = await fetchStores()
      setStores(s)
      const r = await Promise.all(s.map(async store => {
        try {
          const days = await fetchMonthData(store.storeCode, app.year, app.month)
          return { store, days }
        } catch { return { store, days: [] } }
      }))
      setResults(r)
      setLastRefresh(new Date().toLocaleTimeString('en-ZA'))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadDetail(storeCode: string) {
    setDetailStore(storeCode)
    const days = await fetchMonthData(storeCode, app.year, app.month)
    setDetailDays(days)
    setView('detail')
  }

  async function resetMonth() {
    if (!confirm(`⚠ DANGER\n\nDelete ALL data for ${app.code} — ${MONTHS[app.month-1]} ${app.year}?\n\nThis cannot be undone.`)) return
    if (!confirm(`Second confirmation — delete ALL data for ${app.code}?`)) return
    try {
      const msg = await deleteMonthData(app.code, app.year, app.month)
      alert(`✓ ${msg}`)
      loadFeed()
    } catch (err: any) {
      alert(`Failed: ${err.message}`)
    }
  }

  const submitted = results.filter(r => r.days.length > 0)
  const pending = results.filter(r => r.days.length === 0)

  if (view === 'detail') {
    const store = stores.find(s => s.storeCode === detailStore)
    return (
      <div>
        <div style={{marginBottom:14,display:'flex',alignItems:'center',gap:10}}>
          <button className="btn" style={{width:'auto'}} onClick={() => setView('feed')}>← Back</button>
          <span style={{fontFamily:'var(--mono)',fontSize:14,fontWeight:600}}>
            {detailStore} — {store?.storeName} — Day Detail
          </span>
        </div>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Date</th><th className="r">FNB</th><th className="r">Floats</th>
                <th className="r">Change</th><th className="r">Petty</th>
                <th className="r">Cashiers</th><th className="r">Cash</th>
                <th className="r">Cards</th><th className="r">EFT</th>
                <th className="r">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {detailDays.map(d => {
                const totalCash = d.fnb + d.floats + d.changeBoxes + d.looseChange
                const totalCards = d.cashierRows.reduce((a, c) => a + c.card, 0)
                const totalEFT = d.cashierRows.reduce((a, c) => a + c.eft, 0)
                return [
                  <tr key={d.cashUpDate}>
                    <td style={{color:'var(--acc)'}}>{d.cashUpDate}</td>
                    <td className="r">{R(d.fnb)}</td>
                    <td className="r">{R(d.floats)}</td>
                    <td className="r">{R(d.changeBoxes)}</td>
                    <td className="r">{R(d.pettyCash)}</td>
                    <td className="r">{d.cashierRows.length}</td>
                    <td className="r">{R(totalCash)}</td>
                    <td className="r">{R(totalCards)}</td>
                    <td className="r">{R(totalEFT)}</td>
                    <td className="r">
                      <span className={`badge ${d.submitted ? 'ok' : 'pend'}`}>
                        {d.submitted ? '✓ Yes' : '◦ No'}
                      </span>
                    </td>
                  </tr>,
                  <tr key={`${d.cashUpDate}-cashiers`} style={{background:'rgba(79,142,247,.03)'}}>
                    <td colSpan={10} style={{padding:'8px 10px'}}>
                      <table style={{fontSize:10}}>
                        <thead>
                          <tr>
                            <th>Cashier</th><th className="r">Cash</th><th className="r">Cards</th>
                            <th className="r">EFT</th><th className="r">Erase</th><th className="r">Returns</th>
                            <th className="r">Gift</th><th className="r">Coupon</th><th className="r">Loyalty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {d.cashierRows.map(c => (
                            <tr key={c.cashierName}>
                              <td>{c.cashierName}</td>
                              <td className="r">{R(c.cash)}</td><td className="r">{R(c.card)}</td>
                              <td className="r">{R(c.eft)}</td><td className="r">{R(c.erase)}</td>
                              <td className="r">{R(c.returns)}</td><td className="r">{R(c.gift)}</td>
                              <td className="r">{R(c.coupon)}</td><td className="r">{R(c.loyalty)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ]
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (view === 'floats') {
    return (
      <div>
        <div style={{marginBottom:14,display:'flex',alignItems:'center',gap:10}}>
          <button className="btn" style={{width:'auto'}} onClick={() => setView('feed')}>← Back</button>
          <span style={{fontFamily:'var(--mono)',fontSize:14,fontWeight:600}}>Edit Store Floats</span>
        </div>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Store</th><th>Code</th>
                <th className="r">Till Float</th>
                <th className="r">Change Box</th>
                <th className="r">Action</th>
              </tr>
            </thead>
            <tbody>
              {app.stores.map(s => {
                const edit = floatEdits[s.code] ?? { floats: s.floats, change: s.change }
                return (
                  <tr key={s.code}>
                    <td>{s.name}</td>
                    <td style={{color:'var(--acc)'}}>{s.code}</td>
                    <td className="r">
                      <input className="fi" style={{width:100}}
                        value={edit.floats}
                        onChange={e => setFloatEdits(prev => ({
                          ...prev, [s.code]: { ...edit, floats: parseFloat(e.target.value) || 0 }
                        }))} />
                    </td>
                    <td className="r">
                      <input className="fi" style={{width:100}}
                        value={edit.change}
                        onChange={e => setFloatEdits(prev => ({
                          ...prev, [s.code]: { ...edit, change: parseFloat(e.target.value) || 0 }
                        }))} />
                    </td>
                    <td className="r">
                      <button
                        className="btn pri" style={{width:'auto',padding:'4px 12px'}}
                        onClick={async () => {
                          try {
                            const { updateStoreFloats } = await import('../api/client')
                            await updateStoreFloats(s.code, s.name, edit.floats, edit.change)
                            alert(`✓ Updated ${s.code}`)
                          } catch (err: any) {
                            alert(`Failed: ${err.message}`)
                          }
                        }}
                      >Save</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <span style={{fontFamily:'var(--mono)',fontSize:14,fontWeight:600}}>
          Live Store Submissions — {MONTHS[app.month-1]} {app.year}
        </span>
        <div style={{display:'flex',gap:8}}>
          <button className="btn" style={{width:'auto'}} onClick={loadFeed}>↻ Refresh</button>
          <button className="btn" style={{width:'auto',borderColor:'var(--ylw)',color:'var(--ylw)'}}
            onClick={() => setView('floats')}>✎ Edit Floats</button>
          <button className="btn danger" style={{width:'auto'}} onClick={resetMonth}>🗑 Reset Month</button>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><div className="sl">Total Stores</div><div className="sv acc">{stores.length}</div></div>
        <div className="stat"><div className="sl">Submitted</div><div className="sv pos">{submitted.length}</div></div>
        <div className="stat"><div className="sl">Pending</div><div className="sv warn">{pending.length}</div></div>
        <div className="stat"><div className="sl">Last Refresh</div><div className="sv" style={{fontSize:11}}>{lastRefresh}</div></div>
      </div>

      {loading && <div className="msg info">Fetching live data...</div>}

      {submitted.length > 0 && (
        <>
          <div className="section-lbl">Submitted This Month</div>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Store</th><th>Code</th><th className="r">Days</th>
                  <th className="r">Total Cash</th><th className="r">Total Cards</th>
                  <th className="r">Total EFT</th><th className="r">Last Submitted</th>
                </tr>
              </thead>
              <tbody>
                {submitted.map(({ store, days }) => {
                  const totalCash = days.reduce((a, d) => a + d.fnb + d.floats + d.changeBoxes + d.looseChange, 0)
                  const totalCards = days.reduce((a, d) => a + d.cashierRows.reduce((b, c) => b + c.card, 0), 0)
                  const totalEFT = days.reduce((a, d) => a + d.cashierRows.reduce((b, c) => b + c.eft, 0), 0)
                  const sorted = [...days].sort((a, b) => b.cashUpDate.localeCompare(a.cashUpDate))
                  const lastDate = sorted[0]?.cashUpDate ?? '—'
                  return (
                    <tr key={store.storeCode} className="clickable" onClick={() => loadDetail(store.storeCode)}>
                      <td style={{color:'var(--grn)'}}>{store.storeName}</td>
                      <td style={{color:'var(--acc)'}}>{store.storeCode}</td>
                      <td className="r">{days.length}</td>
                      <td className="r">{R(totalCash)}</td>
                      <td className="r">{R(totalCards)}</td>
                      <td className="r">{R(totalEFT)}</td>
                      <td className="r" style={{color:'var(--txt2)'}}>{lastDate}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {pending.length > 0 && (
        <>
          <div className="section-lbl">Pending — No Submissions Yet</div>
          <div className="card">
            <table>
              <thead><tr><th>Store</th><th>Code</th><th>Status</th></tr></thead>
              <tbody>
                {pending.map(({ store }) => (
                  <tr key={store.storeCode}>
                    <td style={{color:'var(--txt2)'}}>{store.storeName}</td>
                    <td style={{color:'var(--txt2)'}}>{store.storeCode}</td>
                    <td><span className="badge pend">◦ No data</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}