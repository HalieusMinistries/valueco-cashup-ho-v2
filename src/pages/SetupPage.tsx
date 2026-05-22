import { useApp } from '../context/AppContext'
import { MONTHS } from '../utils/stores'
import { useEffect, useRef } from 'react'

export default function SetupPage() {
  const app = useApp()

  const logged = useRef(false)
  useEffect(() => {
    if (!logged.current) {
      logged.current = true
      app.addLog('PAGE_VIEW', 'Setup page opened')
    }
  }, [])

  function update(field: string, value: string | number) {
    const oldVal = (app as any)[field]
    app.addLog('CONFIG_CHANGE', `${field}: ${oldVal} → ${value}`)
    app.setConfig({ [field]: value } as any)
  }

  function handleStoreSelect(code: string) {
    const store = app.stores.find(s => s.code === code)
    app.addLog('STORE_SELECT', `Store card clicked: ${store?.name ?? code} (${code})`)
    app.selectStore(code)
  }

  return (
    <div>
      <div className="section-lbl">Store & Period Configuration</div>
      <div className="card">
        <div className="card-bd">
          <div className="g2">
            <div>
              <div className="frow">
                <span className="flbl">Store Name</span>
                <input className="fi" style={{width:180,textAlign:'left'}}
                  value={app.name}
                  onChange={e => update('name', e.target.value)} />
              </div>
              <div className="frow">
                <span className="flbl">Store Code (KingDee)</span>
                <input className="fi" style={{width:100,textAlign:'left'}}
                  value={app.code}
                  onChange={e => update('code', e.target.value)} />
              </div>
              <div className="frow">
                <span className="flbl">Bank Account Nr</span>
                <input className="fi" style={{width:150,textAlign:'left'}}
                  value={app.bank}
                  onChange={e => update('bank', e.target.value)} />
              </div>
              <div className="frow">
                <span className="flbl">SpeedPoint Merchant</span>
                <input className="fi" style={{width:110,textAlign:'left'}}
                  value={app.sp}
                  onChange={e => update('sp', e.target.value)} />
              </div>
              <div className="frow">
                <span className="flbl">Month</span>
                <select className="si"
                  value={app.month}
                  onChange={async e => {
                    const val = parseInt(e.target.value)
                    app.triggerSave()
                    await new Promise(r => setTimeout(r, 600))
                    update('month', val)
                  }}>
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="frow">
                <span className="flbl">Year</span>
                <input className="fi" style={{width:90}}
                  value={app.year}
                  onChange={async e => {
                    const val = parseInt(e.target.value)
                    app.triggerSave()
                    await new Promise(r => setTimeout(r, 600))
                    update('year', val)
                  }} />
              </div>
            </div>
            <div>
              <div className="msg info">
                Select a store below or configure manually, then load CSV files using the sidebar.
              </div>
              <div style={{marginTop:12,fontFamily:'var(--mono)',fontSize:9,color:'var(--txt2)',lineHeight:2.2}}>
                <b style={{color:'var(--txt)'}}>WORKFLOW</b><br/>
                1. Select store or configure manually<br/>
                2. Load KingDee CSV — populates day sheets<br/>
                3. Load Bank CSV(s) — card & cash reconciliation<br/>
                4. Cash Up tab — select day, enter manual totals<br/>
                5. Reconciliation tab — month summary<br/>
                6. Export JSON backup
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-lbl">Known VCL Stores</div>
      <div className="store-grid">
        {app.stores.map(s => (
          <div
            key={s.code}
            className={`store-card ${s.code === app.code ? 'sel' : ''}`}
            onClick={() => handleStoreSelect(s.code)}
          >
            <div className="sc">{s.code}</div>
            <div className="sn">{s.name}</div>
            <div className="si">Float: R{s.floats.toLocaleString()} | Change: R{s.change.toLocaleString()}</div>
            <div className="si" style={{fontSize:8,marginTop:2,color:'var(--txt2)'}}>{s.addr}</div>
          </div>
        ))}
      </div>
    </div>
  )
}