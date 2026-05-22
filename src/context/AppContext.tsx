import { createContext, useContext, useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import { VCL_STORES, type StoreConfig } from '../utils/stores'
import { saveState, loadState, saveLog, loadLog, checkServerHealth, formatPeriod } from '../utils/persistence'

// ─── Data Interfaces ────────────────────────────────────────────────────────

export interface KDRow {
  store: string; date: string; cashier: string
  cash: number; eft: number; card: number; rounding: number
  gross: number; returns: number; voucher: number; picking: number; loyalty: number
}

export interface BankRow {
  statDate: string; effDate: string; desc: string; amount: number; account: string
}

export interface StoreRow {
  date: string; cashier: string
  cash: number; card: number; eft: number; erase: number; total: number
  returns: number; gift: number; coupon: number; loyalty: number
  fnb: number; surrender: number; floats: number; change: number; petty: number
}

export interface ContribRow {
  date: string; store: string; cashier: string; mode: string
  contribution: number; petty: number; diff: number; remark: string
}

export interface JournalRow {
  date: string; account: string; name: string
  prevBal: number; revenueToday: number; expenseToday: number; balanceToday: number
}

export interface DayInput {
  fnb: number; surrender: number; floats: number
  change: number; petty: number; reconNr: string
  cashOnHand?: number; looseChange?: number; notes?: string; cardNotes?: string; dayNotes?: string
  cashReconNr?: string; bankReconNr?: string
  manualDeposits?: { day: number; desc: string; amount: number }[]
  eftDetails?: { date: string; soNr: string; amount: number }[]
}

// ─── Audit Log ──────────────────────────────────────────────────────────────

// Every user action is recorded here for support and troubleshooting purposes.
// The log is persisted to the server on every auto-save cycle and on browser close,
// so the full audit trail survives across sessions, power cuts, and load shedding.
// Users are informed of this logging via the login screen disclosure.
export interface LogEntry {
  timestamp: string
  action: string
  detail: string
  store: string
  period: string
}

// ─── App State ──────────────────────────────────────────────────────────────

interface AppState {
  name: string; code: string; bank: string; sp: string
  month: number; year: number
  kdRows: KDRow[]
  bankRows: BankRow[]
  storeRows: StoreRow[]
  contributionRows: ContribRow[]
  journalRows: JournalRow[]
  dayInputs: Record<number, DayInput>
  currentDay: number | null
  authed: boolean
  closingBalance: number
  removedBankEntries: string[]
}

interface AppContextType extends AppState {
  setAuthed: (v: boolean) => void
  setConfig: (cfg: Partial<AppState>) => void
  setKDRows: (rows: KDRow[]) => void
  setBankRows: (rows: BankRow[]) => void
  setStoreRows: (rows: StoreRow[]) => void
  setContribRows: (rows: ContribRow[]) => void
  setJournalRows: (rows: JournalRow[]) => void
  setDayInput: (day: number, input: Partial<DayInput>) => void
  setCurrentDay: (day: number | null) => void
  selectStore: (code: string) => void
  getDayInput: (day: number) => DayInput
  resetMonth: () => void
  stores: StoreConfig[]
  // Audit log
  addLog: (action: string, detail: string) => void
  getLog: () => LogEntry[]
  // Persistence
  serverOnline: boolean
  lastSaved: string | null
  triggerSave: () => void
  saveWithJournal: (journalRows: JournalRow[], kdRows?: KDRow[], contribRows?: ContribRow[]) => Promise<void>
  removeBankEntry: (key: string) => void
  restoreBankEntry: (key: string) => void
  setOpeningBalance: (val: number) => void
  addManualDeposit: (day: number, desc: string, amount: number) => void
  removeManualDeposit: (day: number, index: number) => void
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const defaultDayInput = (): DayInput => ({
  fnb: 0, surrender: 0, floats: 0, change: 0, petty: 0, reconNr: '',
  cashOnHand: 0, looseChange: 0, notes: '', eftDetails: []
})

const Ctx = createContext<AppContextType | null>(null)

// ─── Provider ───────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    name: 'VCL Blueberry', code: 'VCL10', bank: '63168706861', sp: '00629442',
    month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    kdRows: [], bankRows: [], storeRows: [], contributionRows: [], journalRows: [],
    dayInputs: {}, currentDay: null,
    authed: sessionStorage.getItem('vc_auth') === '1',
    closingBalance: 0,
    removedBankEntries: []
  })

  // Persistence status
  const [serverOnline, setServerOnline] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  // Log is stored in a ref so it never triggers re-renders
  const logRef = useRef<LogEntry[]>([])

  // Tracks how many log entries have already been saved to server
  // so we only send new entries on each save cycle
  const logSavedCountRef = useRef(0)
  const journalFetchedRef = useRef(false)
  const journalRowsRef = useRef<JournalRow[]>([])

  // Ref to always have latest state available inside intervals and callbacks
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // Appends an entry to the audit log
  const addLog = (action: string, detail: string) => {
    logRef.current.push({
      timestamp: new Date().toISOString(),
      action,
      detail,
      store: stateRef.current.code,
      period: formatPeriod(stateRef.current.year, stateRef.current.month)
    })
  }

  // Returns a copy of the full log for export
  const getLog = () => [...logRef.current]

  // ─── Persistence: Health check on mount ──────────────────────────────────

  useEffect(() => {
    checkServerHealth().then(online => {
      setServerOnline(online)
      addLog('SERVER', online ? 'Server reachable on startup' : 'Server unreachable on startup')
    })
  }, [])

  // ─── Persistence: Load state and log on mount / store / period change ─────

  useEffect(() => {
    if (!state.authed) return
    const period = formatPeriod(state.year, state.month)

    // Load state and log in parallel
    Promise.all([
      loadState(state.code, period),
      loadLog(state.code, period)
    ]).then(async ([saved, previousLog]) => {

      // Restore previous log entries so audit trail is continuous
      if (previousLog.length > 0) {
        logRef.current = [...previousLog]
        logSavedCountRef.current = previousLog.length
        addLog('SESSION_START', `Session resumed — ${previousLog.length} previous log entries restored`)
      } else {
        addLog('SESSION_START', `New session started for ${state.code} ${period}`)
      }

      if (saved) {
        setState(s => ({
          ...s,
          name: saved.name || s.name,
          bank: saved.bank || s.bank,
          sp: saved.sp || s.sp,
          dayInputs: saved.dayInputs || {},
          removedBankEntries: saved.removedBankEntries || [],
          bankRows: s.bankRows,
          storeRows: saved.storeRows || [],
          closingBalance: saved.closingBalance || 0,
          // kdRows, contributionRows and journalRows are global — fetched for all stores at once
          // Only restore them if we don't already have data in memory
          kdRows: saved.kdRows || s.kdRows,
          contributionRows: saved.contributionRows || s.contributionRows,
          journalRows: journalFetchedRef.current ? s.journalRows : (saved.journalRows || []),
        }))
        addLog('PERSIST', `State restored for ${state.code} ${period} — KD:${saved.kdRows?.length ?? 0} Bank:${saved.bankRows?.length ?? 0} Contrib:${saved.contributionRows?.length ?? 0} Journal:${saved.journalRows?.length ?? 0}`)
      } else {
        // No saved state for this period — look up previous period closing balance
        addLog('PERSIST', `No saved state found for ${state.code} ${period}`)
        const prevMonth = state.month === 1 ? 12 : state.month - 1
        const prevYear = state.month === 1 ? state.year - 1 : state.year
        const prevPeriod = formatPeriod(prevYear, prevMonth)
        const prevSaved = await loadState(state.code, prevPeriod)
        if (prevSaved && prevSaved.closingBalance) {
          setState(s => ({ ...s, closingBalance: prevSaved.closingBalance }))
          addLog('PERSIST', `Opening balance loaded from previous period ${prevPeriod}: ${prevSaved.closingBalance}`)
        }
      }
    })
  }, [state.authed, state.code, state.month, state.year])

  // ─── Persistence: Save state and new log entries ──────────────────────────

  const doSave = async () => {
    const s = stateRef.current
    if (!s.authed) return
    const period = formatPeriod(s.year, s.month)

    // Save state
    const stateOk = await saveState(s.code, period, {
      name: s.name,
      code: s.code,
      bank: s.bank,
      sp: s.sp,
      month: s.month,
      year: s.year,
      dayInputs: s.dayInputs,
      removedBankEntries: s.removedBankEntries,
      kdRows: s.kdRows,
      bankRows: s.bankRows,
      storeRows: s.storeRows,
      contributionRows: s.contributionRows,
      journalRows: journalRowsRef.current.length > 0 ? journalRowsRef.current : s.journalRows,
      closingBalance: s.closingBalance
    })

    // Save only new log entries since last save
    const allEntries = logRef.current
    const newEntries = allEntries.slice(logSavedCountRef.current)
    let logOk = true
    if (newEntries.length > 0) {
      logOk = await saveLog(s.code, period, newEntries)
      if (logOk) {
        logSavedCountRef.current = allEntries.length
      }
    }

    if (stateOk && logOk) {
      const ts = new Date().toLocaleTimeString('en-ZA')
      setLastSaved(ts)
      setServerOnline(true)
      addLog('PERSIST', `Auto-saved — state + ${newEntries.length} log entries for ${s.code} ${period}`)
    } else {
      setServerOnline(false)
      addLog('PERSIST_ERROR', `Save failed for ${s.code} ${period} — state:${stateOk} log:${logOk}`)
    }
  }

  // Manual trigger for immediate save
  const triggerSave = () => { doSave() }

  const saveWithJournal = async (journalRows: JournalRow[], kdRows?: KDRow[], contribRows?: ContribRow[]) => {
    const s = stateRef.current
    if (!s.authed) return
    const period = formatPeriod(s.year, s.month)
    await saveState(s.code, period, {
      name: s.name, code: s.code, bank: s.bank, sp: s.sp,
      month: s.month, year: s.year, dayInputs: s.dayInputs,
      kdRows: kdRows ?? s.kdRows, bankRows: s.bankRows, storeRows: s.storeRows,
      removedBankEntries: s.removedBankEntries,
      contributionRows: contribRows ?? s.contributionRows, journalRows,
      closingBalance: s.closingBalance
    })
  }

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(doSave, 30000)
    return () => clearInterval(interval)
  }, [])

  // ─── Persistence: Save on browser close / tab close / power event ─────────

  useEffect(() => {
    const handleBeforeUnload = () => {
      const s = stateRef.current
      if (!s.authed) return
      const period = formatPeriod(s.year, s.month)

      // Add SESSION_END entry before saving
      logRef.current.push({
        timestamp: new Date().toISOString(),
        action: 'SESSION_END',
        detail: `Browser closed or tab unloaded for ${s.code} ${period}`,
        store: s.code,
        period
      })

      // Use sendBeacon for reliable delivery on page unload —
      // fetch is not guaranteed to complete when the page is closing
      const newEntries = logRef.current.slice(logSavedCountRef.current)
      if (newEntries.length > 0) {
        navigator.sendBeacon(
          `/api/log`,
          new Blob([JSON.stringify({ store: s.code, period, entries: newEntries })], { type: 'application/json' })
        )
      }
      navigator.sendBeacon(
        `/api/state`,
        new Blob([JSON.stringify({
          store: s.code, period,
          state: {
            name: s.name, code: s.code, bank: s.bank, sp: s.sp,
            month: s.month, year: s.year, dayInputs: s.dayInputs,
            kdRows: s.kdRows, bankRows: s.bankRows, storeRows: s.storeRows,
            removedBankEntries: s.removedBankEntries,
            contributionRows: s.contributionRows, journalRows: s.journalRows,
            closingBalance: s.closingBalance
          }
        })], { type: 'application/json' })
      )
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // ─── State Setters ────────────────────────────────────────────────────────

  const setAuthed = (v: boolean) => {
    sessionStorage.setItem('vc_auth', v ? '1' : '0')
    setState(s => ({ ...s, authed: v }))
    addLog('AUTH', v ? 'User logged in' : 'User logged out')
  }

  const setConfig = (cfg: Partial<AppState>) => {
    setState((s: AppState) => ({ ...s, ...cfg }))
  }

  const setKDRows = (rows: KDRow[]) => {
    setState(s => ({ ...s, kdRows: rows }))
    addLog('IMPORT', `KingDee CSV loaded — ${rows.length} rows`)
    setTimeout(doSave, 500)
  }

  const bankEntryKey = (r: BankRow) => `${r.statDate}|${r.amount}|${r.desc.substring(0, 20)}`

  const setBankRows = (rows: BankRow[]) => {
    setState(s => {
      const removed = new Set(s.removedBankEntries)
      const filtered = rows.filter(r => !removed.has(bankEntryKey(r)))
      const daysInMonth = new Date(s.year, s.month, 0).getDate()
      const storeBank = rows.filter(r => r.account === s.bank)
      return { ...s, bankRows: filtered }
    })
    addLog('IMPORT', `Bank CSV loaded — ${rows.length} rows`)
    setTimeout(doSave, 500)
  }

  const setStoreRows = (rows: StoreRow[]) => {
    setState(s => ({ ...s, storeRows: rows }))
    addLog('IMPORT', `Store CSV loaded — ${rows.length} rows`)
    setTimeout(doSave, 500)
  }

  const setContribRows = (rows: ContribRow[]) => {
    setState(s => ({ ...s, contributionRows: rows }))
    addLog('IMPORT', `Contributions loaded — ${rows.length} rows`)
    setTimeout(doSave, 500)
  }

  const setJournalRows = (rows: JournalRow[]) => {
    journalFetchedRef.current = true
    journalRowsRef.current = rows
    setState(s => ({ ...s, journalRows: rows }))
    addLog('IMPORT', `Cash Journal loaded — ${rows.length} rows`)
    setTimeout(doSave, 3000)
  }

  const removeBankEntry = (key: string) => {
    setState(s => {
      let removed = false
      const newBankRows = s.bankRows.filter(r => {
        if (!removed && bankEntryKey(r) === key) {
          removed = true
          return false
        }
        return true
      })
      return {
        ...s,
        removedBankEntries: [...s.removedBankEntries, key],
        bankRows: newBankRows
      }
    })
    addLog('BANK_REMOVE', `Bank entry removed: ${key}`)
    setTimeout(doSave, 500)
  }

  const restoreBankEntry = (key: string) => {
    setState(s => ({
      ...s,
      removedBankEntries: s.removedBankEntries.filter(k => k !== key)
    }))
    addLog('BANK_RESTORE', `Bank entry restored: ${key}`)
    setTimeout(doSave, 500)
  }

  const setOpeningBalance = (val: number) => {
    setState(s => ({ ...s, closingBalance: val }))
    addLog('JOURNAL', `Opening balance manually set to ${val}`)
    setTimeout(doSave, 500)
  }

  const addManualDeposit = (day: number, desc: string, amount: number) => {
    setState(s => {
      const existing = s.dayInputs[day] ?? defaultDayInput()
      const manualDeposits = [...(existing.manualDeposits || []), { day, desc, amount }]
      return { ...s, dayInputs: { ...s.dayInputs, [day]: { ...existing, manualDeposits } } }
    })
    addLog('MANUAL_DEPOSIT', `Manual deposit added: day ${day} — ${desc} ${amount}`)
    setTimeout(doSave, 500)
  }

  const removeManualDeposit = (day: number, index: number) => {
    setState(s => {
      const existing = s.dayInputs[day] ?? defaultDayInput()
      const manualDeposits = (existing.manualDeposits || []).filter((_, i) => i !== index)
      return { ...s, dayInputs: { ...s.dayInputs, [day]: { ...existing, manualDeposits } } }
    })
    addLog('MANUAL_DEPOSIT', `Manual deposit removed: day ${day} index ${index}`)
    setTimeout(doSave, 500)
  }

  const setCurrentDay = (day: number | null) => {
    setState(s => ({ ...s, currentDay: day }))
    if (day !== null) addLog('NAV', `Opened day ${String(day).padStart(2, '0')}`)
  }

  const getDayInput = (day: number): DayInput => state.dayInputs[day] ?? defaultDayInput()

  const setDayInput = (day: number, input: Partial<DayInput>) => {
    const existing = state.dayInputs[day] ?? defaultDayInput()
    Object.keys(input).forEach(key => {
      const k = key as keyof DayInput
      const oldVal = existing[k]
      const newVal = input[k]
      if (oldVal !== newVal) {
        const fmt = (v: any) => Array.isArray(v) ? `[${(v as any[]).length} items]` : String(v)
        addLog('FIELD_CHANGE', `${key}: ${fmt(oldVal)} → ${fmt(newVal)} (day ${String(day).padStart(2, '0')})`)
      }
    })
    setState(s => ({
      ...s,
      dayInputs: { ...s.dayInputs, [day]: { ...defaultDayInput(), ...s.dayInputs[day], ...input } }
    }))
  }

  const selectStore = (code: string) => {
    const st = VCL_STORES.find((store: StoreConfig) => store.code === code)
    if (!st) return
    const daysInMonth = new Date(state.year, state.month, 0).getDate()
    const newInputs = { ...state.dayInputs }
    for (let d = 1; d <= daysInMonth; d++) {
      const existing = newInputs[d] ?? defaultDayInput()
      newInputs[d] = {
        ...existing,
        floats: st.floats,
        change: st.change
      }
    }
    setState(s => ({ ...s, name: st.name, code: st.code, bank: st.bank || s.bank, sp: st.sp || s.sp, dayInputs: newInputs }))
    addLog('STORE_SELECT', `Store changed to ${st.name} (${st.code})`)
  }

  const resetMonth = () => {
    setState(s => ({
      ...s, kdRows: [], bankRows: [], storeRows: [], contributionRows: [],
      journalRows: [], dayInputs: {}, currentDay: null, closingBalance: 0
    }))
    addLog('RESET', 'Month data reset')
  }

  // ─── Provider Value ───────────────────────────────────────────────────────

  return (
    <Ctx.Provider value={{
      ...state, stores: VCL_STORES,
      setAuthed, setConfig, setKDRows, setBankRows, setStoreRows,
      setContribRows, setJournalRows, setDayInput, setCurrentDay,
      selectStore, getDayInput, resetMonth,
      addLog, getLog,
      serverOnline, lastSaved, triggerSave, saveWithJournal,
      removeBankEntry, restoreBankEntry, setOpeningBalance,
      addManualDeposit, removeManualDeposit
    }}>
      {children}
    </Ctx.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}