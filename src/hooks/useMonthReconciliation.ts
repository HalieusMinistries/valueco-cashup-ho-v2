import { useApp } from '../context/AppContext'
import { dateStr, varianceLabel, matchSpeedPoints } from '../utils/calc'

export interface DayRecon {
  day: number
  ds: string
  // KD totals
  kdCash: number
  kdCard: number
  kdEFT: number
  kdVoucher: number
  kdLoyalty: number
  kdStoreTotal: number
  // Contribution cash (for Cash Recon system total)
  contribCash: number
  // SP matching
  spTotal: number
  // Cash deposits (CSV + manual)
  cashDeposits: { statDate: string; effDate: string; desc: string; amount: number; account: string }[]
  bankCashTotal: number
  // EFT from bank
  storeEFT: number
  // Day inputs
  fnb: number
  surrender: number
  petty: number
  floats: number
  change: number
  cashReconNr: string
  bankReconNr: string
  notes: string
  // Cash Recon system total (fnb or contribCash + surrender)
  systemTotal: number
  // Variance labels
  cashVariance: ReturnType<typeof varianceLabel>
  cardVariance: ReturnType<typeof varianceLabel>
}

export interface MonthRecon {
  days: DayRecon[]
  // Month totals
  totalKDCash: number
  totalKDCard: number
  totalKDEFT: number
  totalKDVoucher: number
  totalKDLoyalty: number
  totalSP: number
  totalRepCash: number
  totalPetty: number
  totalStoreEFT: number
  totalRefundOfPayment: number
  // SP matches for display
  spMatches: ReturnType<typeof matchSpeedPoints>
}

export function useMonthReconciliation(): MonthRecon {
  const app = useApp()
  const daysInMonth = new Date(app.year, app.month, 0).getDate()
  const storeBankRows = app.bankRows.filter(r => r.account === app.bank)

  // Build KD cards by date for SP matching
  const kdCardsByDate: Record<string, number> = {}
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = dateStr(app.year, app.month, d)
    kdCardsByDate[ds] = app.kdRows
      .filter(r => r.store === app.code && r.date === ds && r.cashier.toUpperCase() !== 'STORE SUBTOTAL')
      .reduce((a, r) => a + r.card, 0)
  }

  const spMatches = matchSpeedPoints(storeBankRows, app.sp, kdCardsByDate, app.year, app.month)

  let totalKDCash = 0, totalKDCard = 0, totalKDEFT = 0
  let totalKDVoucher = 0, totalKDLoyalty = 0
  let totalSP = 0, totalRepCash = 0, totalPetty = 0, totalStoreEFT = 0
  let totalRefundOfPayment = 0

  const days: DayRecon[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    const ds = dateStr(app.year, app.month, d)
    const dn = `${app.year}${String(app.month).padStart(2, '0')}${String(d).padStart(2, '0')}`
    const inp = app.getDayInput(d)

    // KD rows
    const kdRows = app.kdRows.filter(r =>
      r.store === app.code && r.date === ds && r.cashier.toUpperCase() !== 'STORE SUBTOTAL'
    )
    const kdCash = kdRows.reduce((a, r) => a + r.cash, 0)
    const kdCard = kdRows.reduce((a, r) => a + r.card, 0)
    const kdEFT = kdRows.reduce((a, r) => a + r.eft, 0)
    const kdVoucher = kdRows.reduce((a, r) => a + r.voucher, 0)
    const kdLoyalty = kdRows.reduce((a, r) => a + r.loyalty, 0)
    const kdStoreTotal = kdCash + kdCard + kdEFT + kdVoucher + kdLoyalty

    // Contribution cash
    const contribCash = app.contributionRows
      .filter(r => r.store === app.code && r.date === ds && r.mode === 'cash')
      .reduce((a, r) => a + r.contribution, 0)

    // SP total for this day
    const spTotal = spMatches
      .filter(m => m.coveredKDDay === ds)
      .reduce((a, m) => a + m.bankAmount, 0)

    // Cash deposits — CSV + manual
    const csvDeposits = storeBankRows.filter(r =>
      String(r.statDate) === dn && r.amount > 0 &&
      (r.desc.includes('ADT') || r.desc.includes('CASH DEPO') || r.desc.includes('CASH DEP') || r.desc.includes('BULK'))
    )
    const manualDeposits = (inp.manualDeposits || []).map(m => ({
      statDate: dn, effDate: dn, desc: m.desc, amount: m.amount, account: app.bank
    }))
    const cashDeposits = [...csvDeposits, ...manualDeposits]
    const bankCashTotal = cashDeposits.reduce((a, r) => a + r.amount, 0)

    const eftDeposits = storeBankRows.filter(r =>
      String(r.statDate) === dn && r.amount > 0 &&
      (r.desc.includes('EFT') || r.desc.includes('INTERNET TRF'))
    )
    const storeEFT = eftDeposits.reduce((a, r) => a + r.amount, 0)

    // Cash Recon system total
    const fnbValue = inp.fnb !== 0 ? inp.fnb : contribCash
    const systemTotal = fnbValue + inp.surrender + (inp.refundOfPayment || 0)

    // Variance labels
    const cashVariance = varianceLabel(fnbValue, kdCash)
    const cardVariance = varianceLabel(spTotal, kdCard)

    // Accumulate month totals
    totalKDCash += kdCash
    totalKDCard += kdCard
    totalKDEFT += kdEFT
    totalKDVoucher += kdVoucher
    totalKDLoyalty += kdLoyalty
    totalSP += spTotal
    totalRepCash += fnbValue
    totalPetty += inp.petty
    totalStoreEFT += storeEFT
    totalRefundOfPayment += (inp.refundOfPayment || 0)

    days.push({
      day: d, ds,
      kdCash, kdCard, kdEFT, kdVoucher, kdLoyalty, kdStoreTotal,
      contribCash, spTotal,
      cashDeposits, bankCashTotal,
      storeEFT,
      fnb: inp.fnb, surrender: inp.surrender, petty: inp.petty,
      floats: inp.floats, change: inp.change,
      cashReconNr: inp.cashReconNr || '',
      bankReconNr: inp.bankReconNr || '',
      notes: inp.notes || '',
      systemTotal,
      cashVariance, cardVariance
    })
  }

  return {
    days, spMatches,
    totalKDCash, totalKDCard, totalKDEFT,
    totalKDVoucher, totalKDLoyalty,
    totalSP, totalRepCash, totalPetty, totalStoreEFT, totalRefundOfPayment
  }
}