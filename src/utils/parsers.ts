import * as XLSX from 'xlsx'
import type { KDRow, BankRow, StoreRow, ContribRow, JournalRow } from '../context/AppContext'
import { N } from './calc'

// Generic CSV parser — handles both comma and semicolon delimiters, quoted fields
export function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let inQ = false, cur = '', fields: string[] = []
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') { inQ = !inQ; continue }
    if ((c === ',' || c === ';') && !inQ) { fields.push(cur.trim()); cur = ''; continue }
    if ((c === '\n' || c === '\r') && !inQ) {
      fields.push(cur.trim()); cur = ''
      if (fields.some(f => f !== '')) rows.push(fields)
      fields = []; continue
    }
    cur += c
  }
  if (cur.trim() || fields.length) fields.push(cur.trim())
  if (fields.some(f => f !== '')) rows.push(fields)
  return rows
}

// Parses KingDee daily cashier export CSV
// Columns: store, date, cashier, cash, eft, card, rounding, gross, returns, voucher, picking, loyalty
export function parseKD(text: string): KDRow[] {
  const rows = parseCSV(text)
  const result: KDRow[] = []
  for (let i = 1; i < rows.length; i++) {
    const f = rows[i]
    if (f.length < 12) continue
    const d = f[1].includes('T') ? f[1].substring(0, 10) : f[1]
    result.push({
      store: f[0], date: d, cashier: f[2],
      cash: N(f[3]), eft: N(f[4]), card: N(f[5]), rounding: N(f[6]),
      gross: N(f[7]), returns: N(f[8]), voucher: N(f[9]), picking: N(f[10]), loyalty: N(f[11])
    })
  }
  return result.sort((a, b) => a.date.localeCompare(b.date))
}

// Parses FNB bank statement CSV export
// Columns (0-indexed): 3=statement date, 4=effective date, 7=amount, 9=description
// statDate and effDate are stored as numeric strings e.g. "20260301"
export function parseBank(text: string): BankRow[] {
  const rows = parseCSV(text)
  const result: BankRow[] = []
  for (let i = 1; i < rows.length; i++) {
    const f = rows[i]
    if (f.length < 10) continue
    const dn = String(f[3]).replace(/\D/g, '')
    if (dn.length < 8) continue
    result.push({
      statDate: dn,
      effDate: String(f[4]).replace(/\D/g, ''),
      desc: (f[9] || '').toUpperCase().trim(),
      amount: N(f[7]),
      account: String(f[0] || '').replace(/\D/g, '').trim()
    })
  }
  return result
}

// Parses legacy store CSV export (no longer used as of April 2026 — stores now use KingDee contributions)
// Kept for backward compatibility with any archived data
export function parseStoreCSV(text: string): StoreRow[] {
  const rows = parseCSV(text)
  let dataStart = -1
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === 'Date') { dataStart = i + 1; break }
  }
  if (dataStart === -1) return []
  const result: StoreRow[] = []
  for (let i = dataStart; i < rows.length; i++) {
    const f = rows[i]
    if (f.length < 16) continue
    result.push({
      date: f[0], cashier: f[1],
      cash: N(f[2]), card: N(f[3]), eft: N(f[4]), erase: N(f[5]), total: N(f[6]),
      returns: N(f[7]), gift: N(f[8]), coupon: N(f[9]), loyalty: N(f[10]),
      fnb: N(f[11]), surrender: N(f[12]), floats: N(f[13]), change: N(f[14]), petty: N(f[15])
    })
  }
  return result
}

// Parses KingDee store contributions export — supports both CSV and XLSX formats
// The header row is detected dynamically by looking for "cashier" and "settlement" columns
// Column indices are mapped from the header row so the parser is robust to column order changes
// The remark/comment column is optional — if present it maps through, if absent remark defaults to ''
export function parseContributions(buffer: ArrayBuffer | string, isXLSX: boolean): ContribRow[] {
  let raw: unknown[][] = []
  if (isXLSX) {
    const wb = XLSX.read(buffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][]
  } else {
    raw = parseCSV(buffer as string)
  }

  let headerRow = -1
  let colDate = 0, colStore = 1, colCashier = 5, colMode = 6, colContrib = 10, colPetty = 12, colDiff = 13, colRemark = -1

  // Locate header row by detecting "cashier" and "settlement" columns
  for (let i = 0; i < raw.length; i++) {
    const f = raw[i] as string[]
    const found = f.findIndex(c => String(c).replace(/^'+/, '').toLowerCase().includes('cashier'))
    if (found >= 0 && f.findIndex(c => String(c).replace(/^'+/, '').toLowerCase().includes('settlement')) >= 0) {
      headerRow = i
      f.forEach((c, idx) => {
        const s = String(c).replace(/^'+/, '').toLowerCase()
        if (s.includes('reconciliation date') || s === 'date') colDate = idx
        if (s === 'org. code' || s === 'org code') colStore = idx
else if (s === 'store code' && colStore === 1) colStore = idx
        if (s === 'cashier') colCashier = idx
        if (s.includes('settlement')) colMode = idx
        if (s.includes('contribution amount (original')) colContrib = idx
        if (s.includes('petty')) colPetty = idx
        if (s.includes('difference amount (original')) colDiff = idx
        // Remark column — present in Robbie's extended dump format, absent in standard export
        if (s.includes('remark') || s.includes('comment') || s.includes('note')) colRemark = idx
      })
      break
    }
  }

  const dataStart = headerRow >= 0 ? headerRow + 1 : 3
  const result: ContribRow[] = []

  for (let i = dataStart; i < raw.length; i++) {
    const f = raw[i] as unknown[]
    if (!f || f.length < 4) continue
    let dateVal = ''
    const d0 = f[colDate]
    if (d0 instanceof Date) {
      dateVal = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, '0')}-${String(d0.getDate()).padStart(2, '0')}`
    } else {
      dateVal = String(d0 || '').replace(/^'+/, '').trim().replace(/\//g, '-')
      if (dateVal.includes('(')) continue
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) continue
    const cashier = String(f[colCashier] || '').replace(/^'+/, '').trim()
    const mode = String(f[colMode] || '').replace(/^'+/, '').trim().toLowerCase()
    if (!cashier || !mode) continue
    result.push({
      date: dateVal,
      store: String(f[colStore] || '').replace(/^'+/, '').trim(),
      cashier, mode,
      contribution: N(f[colContrib]),
      petty: N(f[colPetty]),
      diff: N(f[colDiff]),
      remark: colRemark >= 0 ? String(f[colRemark] || '').replace(/^'+/, '').trim() : ''
    })
  }
  return result
}

// Parses KingDee Cash Journal export — handles multiple export format variants:
//
// Format 1 (comma-delimited, transaction-level):
//   - One row per transaction (income, deposits, petty cash separately)
//   - Date in column 2, revenue in column 7, expense in column 8
//   - Does NOT carry a running balance — prevBal and balanceToday will be 0
//   - Transactions are aggregated by date to produce daily totals
//
// Format 2 (comma-delimited, daily summary) — two sub-variants:
//   Variant A (15 cols): Date, Cash Account, Account Name, Currency, PrevBal, RevToday, ExpToday, BalToday...
//   Variant B (16 cols): Date, Org, Account Name, Cash Account, Currency, PrevBal, RevToday, ExpToday, BalToday...
//   - One row per day with previous balance, revenue, expense, closing balance
//   - Column positions detected dynamically from header row
//   - Numeric values are quoted with comma thousands separators e.g. "15,085.4"
//   - Preferred format — provides full running balance information
//
// Format is auto-detected by presence of 'Previous Balance' in header rows
export function parseCashJournal(buffer: ArrayBuffer | string, isXLSX: boolean): JournalRow[] {
  const result: JournalRow[] = []

  if (isXLSX) {
    const wb = XLSX.read(buffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][]
    for (const row of raw) {
      const f = row as unknown[]
      let dateVal = ''
      if (f[0] instanceof Date) {
        dateVal = `${f[0].getFullYear()}-${String((f[0] as Date).getMonth() + 1).padStart(2, '0')}-${String((f[0] as Date).getDate()).padStart(2, '0')}`
      } else {
        dateVal = String(f[0] || '').trim()
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) continue
      result.push({
        date: dateVal, account: String(f[1] || '').trim(), name: String(f[2] || '').trim(),
        prevBal: N(f[4]), revenueToday: N(f[5]), expenseToday: N(f[6]), balanceToday: N(f[7])
      })
    }
    return result
  }

  const text = buffer as string
  const rows = parseCSV(text)

  // Detect format by looking for 'Previous Balance' in header rows
  // Format 2 daily summary has this in the header; Format 1 transaction-level does not
  let colDate = 0, colPrevBal = -1, colRev = -1, colExp = -1, colBal = -1
  let dataStart = -1

  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const f = rows[i].map(c => c.toLowerCase().trim())
    const prevBalIdx = f.findIndex(c => c === 'previous balance')
    if (prevBalIdx >= 0) {
      // Format 2 detected — map columns from header
      colPrevBal = prevBalIdx
      colRev = prevBalIdx + 1
      colExp = prevBalIdx + 2
      colBal = prevBalIdx + 3
      dataStart = i + 1
      break
    }
  }

  if (colPrevBal >= 0 && dataStart >= 0) {
    // Format 2: daily summary rows — strip comma thousands separators from quoted values
    const clean = (s: string) => N(s.replace(/,/g, ''))
    for (let i = dataStart; i < rows.length; i++) {
      const row = rows[i]
      const dateVal = row[colDate]?.trim() || ''
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) continue
      result.push({
        date: dateVal,
        account: row[1]?.trim() || '',
        name: row[2]?.trim() || '',
        prevBal: clean(row[colPrevBal] || '0'),
        revenueToday: clean(row[colRev] || '0'),
        expenseToday: clean(row[colExp] || '0'),
        balanceToday: clean(row[colBal] || '0')
      })
    }
  } else {
    // Format 1: comma-delimited transaction-level rows
    // Aggregate all transactions by date to produce daily revenue and expense totals
    const byDate: Record<string, { revenue: number; expense: number }> = {}
    for (const row of rows) {
      const dateVal = row[2]?.trim() || ''
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) continue
      if (!byDate[dateVal]) byDate[dateVal] = { revenue: 0, expense: 0 }
      byDate[dateVal].revenue += N(row[7])
      byDate[dateVal].expense += N(row[8])
    }
    const account = rows.find(r => /^\d{4}-\d{2}-\d{2}$/.test(r[2]?.trim() || ''))?.[1]?.trim() || ''
    Object.keys(byDate).sort().forEach(dateVal => {
      result.push({
        date: dateVal,
        account,
        name: '',
        prevBal: 0,
        revenueToday: byDate[dateVal].revenue,
        expenseToday: byDate[dateVal].expense,
        balanceToday: 0
      })
    })
  }

  return result
}