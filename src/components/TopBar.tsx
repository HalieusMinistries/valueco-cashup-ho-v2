import { useApp } from '../context/AppContext'
import { MONTHS_S } from '../utils/stores'

export default function TopBar() {
  const { name, code, month, year, kdRows, storeRows, bankRows, journalRows, contributionRows, serverOnline, lastSaved } = useApp()

  return (
    <div className="topbar">
      <div className="logo">VC // CASHUP</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--txt2)', background: 'rgba(79,142,247,.08)', border: '1px solid rgba(79,142,247,.2)', padding: '3px 10px', borderRadius: 3 }}>
        HO Portal
      </div>
      <div className="topbar-meta">
        <span>Store: <span>{name}</span></span>
        <span>Code: <span>{code}</span></span>
        <span>Period: <span>{MONTHS_S[month - 1]} {year}</span></span>
        <span style={{ color: 'var(--txt2)' }}>
          {kdRows.length} KD · {storeRows.length} Store · {contributionRows.length} Contrib · {bankRows.length} Bank · {journalRows.length} Journal
        </span>
        <span style={{ color: serverOnline ? 'var(--grn)' : 'var(--red)', fontFamily: 'var(--mono)', fontSize: 9 }}>
          {serverOnline ? '● Online' : '● Offline'}
          {serverOnline && lastSaved && ` · Saved ${lastSaved}`}
        </span>
      </div>
    </div>
  )
}