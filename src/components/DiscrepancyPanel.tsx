import { useState } from 'react'
import { useApp } from '../context/AppContext'
import type { Discrepancy } from '../utils/bookkeepingEngine'

const SEV_COLOR: Record<string, string> = {
  ERROR: 'var(--red)',
  WARNING: '#f5a623',
  INFO: 'var(--acc)'
}

const SEV_ICON: Record<string, string> = {
  ERROR: '✖',
  WARNING: '▲',
  INFO: '◦'
}

export default function DiscrepancyPanel() {
  const { currentStoreDiscrepancies, name } = useApp()
  const [open, setOpen] = useState(false)

  const errors = currentStoreDiscrepancies.filter(d => d.severity === 'ERROR').length
  const warnings = currentStoreDiscrepancies.filter(d => d.severity === 'WARNING').length

  const badgeColor = errors > 0 ? 'var(--red)' : warnings > 0 ? '#f5a623' : 'var(--grn)'
  const allClear = currentStoreDiscrepancies.length === 0

  return (
    <div style={{
      position: 'fixed', bottom: 0, right: 0, zIndex: 1000,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
    }}>
      {/* Expanded panel */}
      {open && (
        <div style={{
          width: 520,
          maxHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--card)',
          borderTop: '1px solid var(--brd)',
          borderLeft: '1px solid var(--brd)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.5)'
        }}>
          {/* Panel header */}
          <div style={{
            padding: '8px 14px',
            borderBottom: '1px solid var(--brd)',
            fontFamily: 'var(--mono)', fontSize: 10,
            color: 'var(--txt2)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexShrink: 0
          }}>
            <span style={{ color: 'var(--txt)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
              {name} — Discrepancy Report
            </span>
            <span style={{ display: 'flex', gap: 12 }}>
              {errors > 0 && <span style={{ color: 'var(--red)' }}>✖ {errors} error{errors !== 1 ? 's' : ''}</span>}
              {warnings > 0 && <span style={{ color: '#f5a623' }}>▲ {warnings} warning{warnings !== 1 ? 's' : ''}</span>}
            </span>
          </div>

          {/* Scrollable list */}
          <div style={{ overflowY: 'auto', flexGrow: 1 }}>
            {allClear ? (
              <div style={{
                padding: 20, textAlign: 'center',
                fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--grn)'
              }}>
                ✓ All clear — no discrepancies for this store
              </div>
            ) : (
              currentStoreDiscrepancies.map(d => (
                <DiscrepancyRow key={d.id} d={d} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Toggle bar */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          height: 32,
          width: open ? 520 : 'auto',
          minWidth: 180,
          background: 'var(--card)',
          borderTop: `2px solid ${badgeColor}`,
          borderLeft: '1px solid var(--brd)',
          display: 'flex', alignItems: 'center',
          padding: '0 14px', gap: 10,
          cursor: 'pointer', userSelect: 'none',
          fontFamily: 'var(--mono)', fontSize: 10,
          boxShadow: '0 -2px 12px rgba(0,0,0,0.3)'
        }}
      >
        <span style={{ color: badgeColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
          ● RECON ALERTS
        </span>
        {allClear ? (
          <span style={{ color: 'var(--grn)' }}>✓ Clear</span>
        ) : (
          <>
            {errors > 0 && <span style={{ color: 'var(--red)' }}>✖ {errors}</span>}
            {warnings > 0 && <span style={{ color: '#f5a623' }}>▲ {warnings}</span>}
          </>
        )}
        <span style={{ color: 'var(--txt2)', marginLeft: 'auto' }}>{open ? '▼' : '▲'}</span>
      </div>
    </div>
  )
}

function DiscrepancyRow({ d }: { d: Discrepancy }) {
  return (
    <div style={{
      padding: '7px 14px',
      borderBottom: '1px solid var(--brd)',
      fontFamily: 'var(--mono)', fontSize: 10,
      display: 'grid',
      gridTemplateColumns: '48px 1fr',
      gap: '0 10px',
      alignItems: 'start'
    }}>
      <span style={{
        color: SEV_COLOR[d.severity], fontWeight: 700,
        paddingTop: 1
      }}>
        {SEV_ICON[d.severity]} {d.severity === 'ERROR' ? 'ERR' : d.severity === 'WARNING' ? 'WARN' : 'INFO'}
      </span>
      <div>
        <div style={{ color: 'var(--txt)', lineHeight: 1.5, marginBottom: 2 }}>{d.message}</div>
        <div style={{ color: 'var(--txt2)', fontSize: 9 }}>
          {d.tab}{d.date ? ` · ${d.date}` : ''}
          {d.difference !== null && (
            <> · Expected: {typeof d.expected === 'number' ? `R${Math.abs(d.expected).toFixed(2)}` : d.expected}
            {' / '}Actual: {typeof d.actual === 'number' ? `R${Math.abs(d.actual).toFixed(2)}` : d.actual}</>
          )}
        </div>
      </div>
    </div>
  )
}