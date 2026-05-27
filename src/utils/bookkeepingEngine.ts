import type { KDRow, BankRow, ContribRow, JournalRow, DayInput } from '../context/AppContext'
import type { StoreConfig } from './stores'
import { matchSpeedPoints } from './calc'

export interface Discrepancy {
  id: string
  storeCode: string
  storeName: string
  date: string | null
  tab: string
  field: string
  expected: number | string
  actual: number | string
  difference: number | null
  severity: 'ERROR' | 'WARNING' | 'INFO'
  message: string
}

export interface EngineInput {
  stores: StoreConfig[]
  kdRows: KDRow[]
  bankRows: BankRow[]
  contributionRows: ContribRow[]
  journalRows: JournalRow[]
  year: number
  month: number
  currentStoreCode: string
  dayInputs: Record<number, DayInput>
}

function fmt(n: number): string {
  return `R${Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function runBookkeepingEngine(input: EngineInput): Discrepancy[] {
  const { stores, kdRows, bankRows, contributionRows, journalRows, year, month, currentStoreCode, dayInputs } = input
  const discrepancies: Discrepancy[] = []
  let idCounter = 0
  const nextId = () => `D${String(++idCounter).padStart(4, '0')}`

  const daysInMonth = new Date(year, month, 0).getDate()
  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const activeStores = stores.filter(s => s.bank && s.code !== 'VCL24')

  for (const store of activeStores) {
    const storeBankRows = bankRows.filter(r => r.account === store.bank)
    const hasBankData = storeBankRows.length > 0
    const isCurrentStore = store.code === currentStoreCode

    // Build KD cards by date for SP matching
    const kdCardsByDate: Record<string, number> = {}
    kdRows
      .filter(r => r.store === store.code && r.cashier.toUpperCase() !== 'STORE SUBTOTAL')
      .forEach(r => { kdCardsByDate[r.date] = (kdCardsByDate[r.date] || 0) + r.card })

    // Run SP matching for this store
    const spMatches = matchSpeedPoints(storeBankRows, store.sp, kdCardsByDate, year, month)
    const spByKDDay: Record<string, number> = {}
    spMatches.forEach(m => {
      spByKDDay[m.coveredKDDay] = (spByKDDay[m.coveredKDDay] || 0) + m.bankAmount
    })

    // Check if store has any KD data for this period
    const storeKDRows = kdRows.filter(r => r.store === store.code && r.date.startsWith(monthStr))
    if (storeKDRows.length === 0) {
      discrepancies.push({
        id: nextId(),
        storeCode: store.code,
        storeName: store.name,
        date: null,
        tab: 'Cash Up',
        field: 'KingDee Data',
        expected: 'KD data loaded',
        actual: 'No KD data',
        difference: null,
        severity: 'INFO',
        message: `${store.name}: No KingDee data loaded for this period`
      })
      continue
    }

    // Per-day checks
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dn = `${year}${String(month).padStart(2, '0')}${String(d).padStart(2, '0')}`

      const dayKD = kdRows.filter(r =>
        r.store === store.code && r.date === ds && r.cashier.toUpperCase() !== 'STORE SUBTOTAL'
      )
      if (dayKD.length === 0) continue

      const kdCash = round2(dayKD.reduce((a, r) => a + r.cash, 0))
      const kdCard = round2(dayKD.reduce((a, r) => a + r.card, 0))
      const kdEFT = round2(dayKD.reduce((a, r) => a + r.eft, 0))
      const kdVoucher = round2(dayKD.reduce((a, r) => a + r.voucher, 0))
      const kdLoyalty = round2(dayKD.reduce((a, r) => a + r.loyalty, 0))
      const kdStoreTotal = round2(kdCash + kdCard + kdEFT + kdVoucher + kdLoyalty)

      // Contributions for this store/day
      const dayContribs = contributionRows.filter(r => r.date === ds && r.store === store.code)
      const hasContribs = dayContribs.length > 0

      if (!hasContribs) {
        discrepancies.push({
          id: nextId(),
          storeCode: store.code,
          storeName: store.name,
          date: ds,
          tab: 'Cash Up',
          field: 'Contributions',
          expected: 'Contributions loaded',
          actual: 'No contributions',
          difference: null,
          severity: 'WARNING',
          message: `${store.name} ${ds}: KingDee data present but no contributions loaded`
        })
      }

      // Build contribution totals
      const contribMap: Record<string, { cash: number; card: number; eft: number }> = {}
      dayContribs.forEach(r => {
        if (!contribMap[r.cashier]) contribMap[r.cashier] = { cash: 0, card: 0, eft: 0 }
        if (r.mode === 'cash') contribMap[r.cashier].cash = r.contribution
        else if (r.mode === 'bank card') contribMap[r.cashier].card = r.contribution
        else if (r.mode === 'eft') contribMap[r.cashier].eft = r.contribution
      })
      const contribs = Object.values(contribMap)
      const contribCash = round2(contribs.reduce((a, r) => a + r.cash, 0))
      const contribEFT = round2(contribs.reduce((a, r) => a + r.eft, 0))

      const spTotal = round2(spByKDDay[ds] || 0)

      // Cash: contribCash vs kdCash
      if (hasContribs && kdCash > 0) {
        const diff = round2(contribCash - kdCash)
        if (Math.abs(diff) >= 0.01) {
          discrepancies.push({
            id: nextId(),
            storeCode: store.code,
            storeName: store.name,
            date: ds,
            tab: 'Cash Up',
            field: 'Cash',
            expected: kdCash,
            actual: contribCash,
            difference: diff,
            severity: 'ERROR',
            message: `${store.name} ${ds}: Cash — KD expects ${fmt(kdCash)}, contributions report ${fmt(contribCash)} (${diff > 0 ? 'OVER' : 'SHORT'} ${fmt(Math.abs(diff))})`
          })
        }
      }

      // Cards: spTotal vs kdCard
      if (kdCard > 0) {
        const diff = round2(spTotal - kdCard)
        if (Math.abs(diff) >= 0.01) {
          discrepancies.push({
            id: nextId(),
            storeCode: store.code,
            storeName: store.name,
            date: ds,
            tab: 'Card Recon',
            field: 'Cards / SpeedPoint',
            expected: kdCard,
            actual: spTotal,
            difference: diff,
            severity: 'ERROR',
            message: `${store.name} ${ds}: Cards — KD expects ${fmt(kdCard)}, SpeedPoint total is ${fmt(spTotal)} (${diff > 0 ? 'OVER' : 'SHORT'} ${fmt(Math.abs(diff))})`
          })
        }
        if (spTotal === 0 && hasBankData) {
          discrepancies.push({
            id: nextId(),
            storeCode: store.code,
            storeName: store.name,
            date: ds,
            tab: 'Card Recon',
            field: 'SpeedPoint',
            expected: fmt(kdCard),
            actual: 'No SP entry',
            difference: null,
            severity: 'WARNING',
            message: `${store.name} ${ds}: KD shows card sales of ${fmt(kdCard)} but no SpeedPoint bank entry found`
          })
        }
      }

      // EFT: contribEFT vs kdEFT
      if (hasContribs) {
        const diff = round2(contribEFT - kdEFT)
        if (Math.abs(diff) >= 0.01) {
          discrepancies.push({
            id: nextId(),
            storeCode: store.code,
            storeName: store.name,
            date: ds,
            tab: 'Cash Up',
            field: 'EFT',
            expected: kdEFT,
            actual: contribEFT,
            difference: diff,
            severity: 'ERROR',
            message: `${store.name} ${ds}: EFT — KD records ${fmt(kdEFT)}, contributions report ${fmt(contribEFT)} (${diff > 0 ? 'OVER' : 'SHORT'} ${fmt(Math.abs(diff))})`
          })
        }
      }

      // Cash deposit: kdCash > 0 but no bank deposit found
      if (kdCash > 0 && hasBankData) {
        const cashDeps = storeBankRows.filter(r =>
          String(r.statDate) === dn && r.amount > 0 &&
          (r.desc.includes('DEP') || r.desc.includes('CASH') ||
           r.desc.startsWith('FNB ') || r.desc.includes('OB TRF') ||
           r.desc.includes('BULK') || r.desc.includes('ADT'))
        )
        if (cashDeps.length === 0) {
          discrepancies.push({
            id: nextId(),
            storeCode: store.code,
            storeName: store.name,
            date: ds,
            tab: 'Cash Recon',
            field: 'Cash Deposit',
            expected: 'Cash deposit in bank',
            actual: 'No deposit found',
            difference: null,
            severity: 'WARNING',
            message: `${store.name} ${ds}: KD shows cash of ${fmt(kdCash)} but no cash deposit found in bank CSV`
          })
        }
      }

      // Current store only — grand total check using day inputs
      if (isCurrentStore) {
        const inp = dayInputs[d] ?? { fnb: 0, surrender: 0, floats: 0, change: 0, petty: 0, reconNr: '', cashOnHand: 0 }
        const repCash = inp.fnb !== 0 ? inp.fnb : contribCash
        const grandTotal = round2(repCash + spTotal + contribEFT + inp.petty)
        const grandDiff = round2(grandTotal - kdStoreTotal)
        if (Math.abs(grandDiff) >= 0.01 && (repCash > 0 || spTotal > 0 || contribEFT > 0)) {
          discrepancies.push({
            id: nextId(),
            storeCode: store.code,
            storeName: store.name,
            date: ds,
            tab: 'Cash Up',
            field: 'Grand Total',
            expected: kdStoreTotal,
            actual: grandTotal,
            difference: grandDiff,
            severity: 'ERROR',
            message: `${store.name} ${ds}: Grand Total — KD store total ${fmt(kdStoreTotal)}, reported total ${fmt(grandTotal)} (${grandDiff > 0 ? 'OVER' : 'SHORT'} ${fmt(Math.abs(grandDiff))})`
          })
        }
      }
    }

    // Journal running balance checks
    const storeJournal = journalRows
      .filter(r => r.account === store.code)
      .sort((a, b) => a.date.localeCompare(b.date))

    storeJournal.forEach(r => {
      if (r.prevBal === 0 && r.balanceToday === 0) return
      const expected = round2(r.prevBal + r.revenueToday - r.expenseToday)
      const diff = round2(r.balanceToday - expected)
      if (Math.abs(diff) >= 0.01) {
        discrepancies.push({
          id: nextId(),
          storeCode: store.code,
          storeName: store.name,
          date: r.date,
          tab: 'Cash Journal',
          field: 'Running Balance',
          expected,
          actual: r.balanceToday,
          difference: diff,
          severity: 'ERROR',
          message: `${store.name} ${r.date}: Journal balance error — prev ${fmt(r.prevBal)} + revenue ${fmt(r.revenueToday)} − expense ${fmt(r.expenseToday)} = ${fmt(expected)}, KD shows ${fmt(r.balanceToday)}`
        })
      }
    })

    // Duplicate bank entry check
    const bankEntryKey = (r: BankRow) => `${r.statDate}|${r.amount}|${String(r.desc).substring(0, 20)}`
    const keyCount: Record<string, number> = {}
    storeBankRows.forEach(r => { const k = bankEntryKey(r); keyCount[k] = (keyCount[k] || 0) + 1 })
    storeBankRows
      .filter(r => keyCount[bankEntryKey(r)] > 1)
      .filter((v, i, a) => a.findIndex(x => bankEntryKey(x) === bankEntryKey(v)) === i)
      .forEach(r => {
        const raw = String(r.statDate).substring(0, 8)
        const ds = `${raw.substring(0,4)}-${raw.substring(4,6)}-${raw.substring(6,8)}`
        discrepancies.push({
          id: nextId(),
          storeCode: store.code,
          storeName: store.name,
          date: ds,
          tab: 'Import Check',
          field: 'Bank Duplicate',
          expected: 'Unique entry',
          actual: `${keyCount[bankEntryKey(r)]}× ${r.desc.substring(0, 30)}`,
          difference: r.amount,
          severity: 'WARNING',
          message: `${store.name} ${ds}: Duplicate bank entry — ${r.desc.substring(0, 30)} ${fmt(r.amount)} appears ${keyCount[bankEntryKey(r)]} times`
        })
      })
  }

  return discrepancies
}