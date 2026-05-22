import { useApp } from '../context/AppContext'
import { dateStr } from '../utils/calc'
import { MONTHS_S } from '../utils/stores'

export default function ImportCheckPage() {
  const app = useApp()
  const n = new Date(app.year, app.month, 0).getDate()

  function getDayKD(d: number) {
    return app.kdRows.filter(r => r.store === app.code && r.date === dateStr(app.year, app.month, d))
  }
  
  function getDayContrib(d: number) {
    return app.contributionRows.filter(r => r.date === dateStr(app.year, app.month, d) && r.store === app.code)
  }
  function getDayJournal(d: number) {
    return app.journalRows.filter(r => r.date === dateStr(app.year, app.month, d))
  }
  function getDaySP(d: number) {
    const dn = `${app.year}${String(app.month).padStart(2,'0')}${String(d).padStart(2,'0')}`
    return app.bankRows.filter(r => String(r.statDate) === dn && (r.desc.includes('SPEEDPOINT') || r.desc.includes(app.sp)))
  }
  function getDayCash(d: number) {
    const dn = `${app.year}${String(app.month).padStart(2,'0')}${String(d).padStart(2,'0')}`
    return app.bankRows.filter(r => String(r.statDate) === dn && r.amount > 0 && (r.desc.includes('DEP') || r.desc.includes('CASH') || r.desc.startsWith('FNB ') || r.desc.includes('OB TRF')))
  }

  const Y = <span className="y">✓</span>
  const No = <span className="n">◦</span>

  return (
    <div>
      <div className="section-lbl">Data Source Status by Day</div>
      <div className="ck-grid" style={{gridTemplateColumns:'110px repeat(6, 1fr)'}}>
        {['Date','KD Import','Contributions','Cash Journal','Bank','SpeedPoint','Cash Dep'].map(h => (
          <div key={h} className="ck hd ctr">{h}</div>
        ))}
        {Array.from({length: n}, (_, i) => {
          const d = i + 1
          const hasKD = getDayKD(d).length > 0
          const hasContrib = getDayContrib(d).length > 0
          const hasJournal = getDayJournal(d).length > 0
          const hasSP = getDaySP(d).length > 0
          const hasCash = getDayCash(d).length > 0
          const hasBank = hasSP || hasCash
          return [
            <div key={`d${d}`} className="ck">{String(d).padStart(2,'0')}-{MONTHS_S[app.month-1]}</div>,
            <div key={`kd${d}`} className="ck ctr">{hasKD ? Y : No}</div>,
            <div key={`co${d}`} className="ck ctr">{hasContrib ? Y : No}</div>,
            <div key={`jo${d}`} className="ck ctr">{hasJournal ? Y : No}</div>,
            <div key={`bk${d}`} className="ck ctr">{hasBank ? Y : No}</div>,
            <div key={`sp${d}`} className="ck ctr">{hasSP ? Y : No}</div>,
            <div key={`ca${d}`} className="ck ctr">{hasCash ? Y : No}</div>,
          ]
        })}
      </div>
    </div>
  )
}