// persistence.ts
// Handles all communication between the portal and the company server for state persistence.
// The server runs on the same machine as the portal (Windows Server 2016, PM2 managed).
// State is stored as JSON files on disk, keyed by store code and period (e.g. VCL10_2026-03.json).
// Activity logs are stored separately (e.g. VCL10_2026-03_log.json) and append-only —
// they are never overwritten, so the full audit trail survives browser closes, power cuts,
// and load shedding. This module is used by AppContext for auto-save and state restore on page load.

const SERVER_BASE = import.meta.env.VITE_SERVER_BASE || window.location.origin

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PersistedState {
  name: string
  code: string
  bank: string
  sp: string
  month: number
  year: number
  dayInputs: Record<number, any>
  kdRows?: any[]
  bankRows: any[]
  storeRows: any[]
  contributionRows?: any[]
  journalRows?: any[]
  closingBalance: number
  removedBankEntries?: string[]
}

export interface LogEntry {
  timestamp: string
  action: string
  detail: string
  store: string
  period: string
}

// ─── Health Check ─────────────────────────────────────────────────────────────

// Returns true if the server is reachable
export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${SERVER_BASE}/api/health`, { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}

// ─── Save State ───────────────────────────────────────────────────────────────

// Saves the full application state for a store/period to the server
// Called automatically every 30 seconds, on significant user actions, and on browser close
export async function saveState(
  store: string,
  period: string,
  state: PersistedState
): Promise<boolean> {
  try {
    const res = await fetch(`${SERVER_BASE}/api/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store, period, state })
    })
    return res.ok
  } catch {
    return false
  }
}

// ─── Load State ───────────────────────────────────────────────────────────────

// Loads saved state for a store/period from the server
// Returns null if no saved state exists yet
export async function loadState(
  store: string,
  period: string
): Promise<PersistedState | null> {
  try {
    const res = await fetch(`${SERVER_BASE}/api/state?store=${encodeURIComponent(store)}&period=${encodeURIComponent(period)}`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.exists || !data.state) return null
    return data.state as PersistedState
  } catch {
    return null
  }
}

// ─── Save Log ─────────────────────────────────────────────────────────────────

// Appends log entries to the server-side log file for a store/period.
// The log file is append-only and never overwritten — every session's entries
// accumulate into a single continuous audit trail for the period.
// Called on every auto-save cycle and on browser close.
export async function saveLog(
  store: string,
  period: string,
  entries: LogEntry[]
): Promise<boolean> {
  if (!entries.length) return true
  try {
    const res = await fetch(`${SERVER_BASE}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store, period, entries })
    })
    return res.ok
  } catch {
    return false
  }
}

// ─── Load Log ─────────────────────────────────────────────────────────────────

// Loads the full activity log for a store/period from the server.
// Called on session start so the in-memory log is seeded with all previous
// entries — ensuring continuity across browser closes and power cuts.
// Returns an empty array if no log exists yet.
export async function loadLog(
  store: string,
  period: string
): Promise<LogEntry[]> {
  try {
    const res = await fetch(`${SERVER_BASE}/api/log?store=${encodeURIComponent(store)}&period=${encodeURIComponent(period)}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.entries || []
  } catch {
    return []
  }
}

// ─── List Periods ─────────────────────────────────────────────────────────────

// Returns a list of periods for which saved state exists for a store
// Used to detect if a previous period's closing balance is available
export async function listPeriods(store: string): Promise<string[]> {
  try {
    const res = await fetch(`${SERVER_BASE}/api/periods?store=${encodeURIComponent(store)}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.periods || []
  } catch {
    return []
  }
}

// ─── Get Previous Closing Balance ────────────────────────────────────────────

// Looks up the closing balance from the previous period for a given store.
// Used by the Journal page to set the opening balance automatically.
// e.g. if current period is 2026-04, looks for closing balance in 2026-03
export async function getPreviousClosingBalance(
  store: string,
  year: number,
  month: number
): Promise<number> {
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const prevPeriod = `${prevYear}-${String(prevMonth).padStart(2, '0')}`
  const state = await loadState(store, prevPeriod)
  if (!state) return 0
  return state.closingBalance || 0
}

// ─── Format Period ────────────────────────────────────────────────────────────

// Utility to format year/month into period string e.g. 2026-03
export function formatPeriod(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}