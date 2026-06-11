import { useApp } from '../context/AppContext'
import { MONTHS_S } from '../utils/stores'

export default function TopBar() {
  const {
    name,
    code,
    month,
    year,
    kdRows,
    storeRows,
    bankRows,
    journalRows,
    contributionRows,
    serverOnline,
    lastSaved,
    currentStoreDiscrepancies
  } = useApp()

  const errCount = currentStoreDiscrepancies.filter(
    d => d.severity === 'ERROR'
  ).length

  const warnCount = currentStoreDiscrepancies.filter(
    d => d.severity === 'WARNING'
  ).length

  function changeCompany() {
    sessionStorage.removeItem('vc_company')
    window.location.reload()
  }

  return (
    <div className="topbar">
      <div className="logo">VC // CASHUP</div>

      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: 'var(--txt2)',
          background: 'rgba(79,142,247,.08)',
          border: '1px solid rgba(79,142,247,.2)',
          padding: '3px 10px',
          borderRadius: 3
        }}
      >
        HO Portal
      </div>

      <div className="topbar-meta">
        <span>
          Store: <span>{name}</span>
        </span>

        <span>
          Code: <span>{code}</span>
        </span>

        <span>
          Period: <span>{MONTHS_S[month - 1]} {year}</span>
        </span>

        <span style={{ color: 'var(--txt2)' }}>
          {kdRows.length} KD · {storeRows.length} Store · {contributionRows.length} Contrib · {bankRows.length} Bank · {journalRows.length} Journal
        </span>

        <span
          style={{
            color: serverOnline ? 'var(--grn)' : 'var(--red)',
            fontFamily: 'var(--mono)',
            fontSize: 9
          }}
        >
          {serverOnline ? '● Online' : '● Offline'}
          {serverOnline && lastSaved && ` · Saved ${lastSaved}`}
        </span>

        {(errCount > 0 || warnCount > 0) && (
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 9,
              display: 'flex',
              gap: 6
            }}
          >
            {errCount > 0 && (
              <span style={{ color: 'var(--red)' }}>
                ✖ {errCount} err
              </span>
            )}

            {warnCount > 0 && (
              <span style={{ color: '#f5a623' }}>
                ▲ {warnCount} warn
              </span>
            )}
          </span>
        )}

        <button
          onClick={changeCompany}
          style={{
            background: 'transparent',
            border: '1px solid var(--brd)',
            color: 'var(--txt)',
            padding: '3px 8px',
            borderRadius: 3,
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            fontSize: 9
          }}
        >
          Change Company
        </button>
      </div>
    </div>
  )
}