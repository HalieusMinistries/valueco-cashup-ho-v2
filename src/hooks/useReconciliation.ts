import { useApp } from '../context/AppContext'
import { dateStr, varianceLabel, matchSpeedPoints } from '../utils/calc'

export interface ReconciliationResult {
  // KingDee totals
  kdCash: number
  kdCard: number
  kdEFT: number
  kdVoucher: number
  kdLoyalty: number
  kdStoreTotal: number

  // Reported / bank totals
  repCash: number
  spTotal: number
  cashDepTotal: number

  // Contribution totals
  contribCash: number
  contribCard: number
  contribs: {
    name: string
    cash: number
    card: number
    erase: number
    petty: number
    diff: number
    remark: string
  }[]

  // Cash office inputs
  effFloats: number
  effChange: number

  // Physical cash check
  physicalCashTotal: number
  cashierTotal: number

  // Grand total
  grandTotal: number

  // Variance labels
  cashVariance: ReturnType<typeof varianceLabel>
  cardVariance: ReturnType<typeof varianceLabel>
  eftVariance: ReturnType<typeof varianceLabel>
  voucherVariance: ReturnType<typeof varianceLabel>
  loyaltyVariance: ReturnType<typeof varianceLabel>
  grandVariance: ReturnType<typeof varianceLabel>
  physVariance: ReturnType<typeof varianceLabel>

  // Bank entries for display
  spEntries: { desc: string; amount: number }[]
  cashDepEntries: { desc: string; amount: number }[]

  // Status flags
  hasKD: boolean
  hasSP: boolean
  hasCashDep: boolean
  hasContribs: boolean
  hasStoreData: boolean
}

export function useReconciliation(day: number): ReconciliationResult {
  const app = useApp()
  const ds = dateStr(app.year, app.month, day)
  const dn = `${app.year}${String(app.month).padStart(2, '0')}${String(day).padStart(2, '0')}`

  // KingDee rows
  const kdRows = app.kdRows.filter(r => r.store === app.code && r.date === ds)
  const cashiers = kdRows.filter(r => r.cashier.toUpperCase() !== 'STORE SUBTOTAL')
  const storeCashiers = app.storeRows.filter(r => r.date === ds)
  const storeBankRows = app.bankRows.filter(r => r.account === app.bank)

  // KD totals
  const kdCash = cashiers.reduce((a, r) => a + r.cash, 0)
  const kdCard = cashiers.reduce((a, r) => a + r.card, 0)
  const kdEFT = cashiers.reduce((a, r) => a + r.eft, 0)
  const kdVoucher = cashiers.reduce((a, r) => a + r.voucher, 0)
  const kdLoyalty = cashiers.reduce((a, r) => a + r.loyalty, 0)
  const kdStoreTotal = kdCash + kdCard + kdEFT + kdVoucher + kdLoyalty

  // SpeedPoint matching
  const kdCardsByDate: Record<string, number> = {}
  app.kdRows
    .filter(r => r.store === app.code && r.cashier.toUpperCase() !== 'STORE SUBTOTAL')
    .forEach(r => { kdCardsByDate[r.date] = (kdCardsByDate[r.date] || 0) + r.card })

  const spMatches = matchSpeedPoints(storeBankRows, app.sp, kdCardsByDate, app.year, app.month)
  const spEntries = spMatches
    .filter(m => m.coveredKDDay === ds)
    .map(m => ({ desc: 'SPEEDPOINT', amount: m.bankAmount }))
  const spTotal = spEntries.reduce((a, r) => a + r.amount, 0)

  // Cash deposits
  const bcBank = storeBankRows.filter(r =>
    String(r.statDate) === dn && r.amount > 0 &&
    (r.desc.includes('DEP') || r.desc.includes('CASH') || r.desc.startsWith('FNB ') || r.desc.includes('OB TRF') || r.desc.includes('BULK'))
  )
  const inp = app.getDayInput(day)
  const bcManual = (inp.manualDeposits || []).map(m => ({ desc: m.desc, amount: m.amount }))
  const cashDepEntries = [...bcBank.map(r => ({ desc: r.desc, amount: r.amount })), ...bcManual]
  const cashDepTotal = cashDepEntries.reduce((a, r) => a + r.amount, 0)

  // Contributions
  const contribRows = app.contributionRows.filter(r => r.date === ds && r.store === app.code)
  const contribMap: Record<string, any> = {}
  contribRows.forEach(r => {
    if (!contribMap[r.cashier]) contribMap[r.cashier] = {
      name: r.cashier, cash: 0, card: 0, erase: 0, petty: r.petty, diff: 0, remark: r.remark || ''
    }
    if (r.mode === 'cash') contribMap[r.cashier].cash = r.contribution
    else if (r.mode === 'bank card') contribMap[r.cashier].card = r.contribution
    else if (r.mode === 'erase') contribMap[r.cashier].erase = r.contribution
    contribMap[r.cashier].diff += r.diff
  })
  const contribs = Object.values(contribMap)
  const contribCash = contribs.reduce((a: number, r: any) => a + r.cash, 0)
  const contribCard = contribs.reduce((a: number, r: any) => a + r.card, 0)

  // Store config
  const storeConfig = app.stores.find(s => s.code === app.code)
  const effFloats = inp.floats || storeConfig?.floats || 0
  const effChange = inp.change || storeConfig?.change || 0

  // Reported cash
  const repCash = inp.fnb !== 0 ? inp.fnb : contribCash

  // Store cashier totals (fallback)
  const stC = storeCashiers.reduce((a, r) => a + r.cash, 0)
  const tC = cashiers.reduce((a, r) => a + r.cash, 0)
  const hasStoreData = storeCashiers.length > 0
  const cashierTotal = hasStoreData ? stC : tC

  // Physical cash check
  const physicalCashTotal = repCash + inp.surrender + (inp.cashOnHand || 0)

  // Grand total
  const grandTotal = repCash + spTotal + kdEFT + inp.petty

  // Variance labels — always varianceLabel(reported, expected)
  const cashVariance = varianceLabel(repCash, kdCash)
  const cardVariance = varianceLabel(spTotal, kdCard)
  const eftVariance = varianceLabel(kdEFT, kdEFT) // EFT is KD only, always zero
  const storeVoucher = storeCashiers.reduce((a, r) => a + r.coupon, 0)
  const storeEFT = storeCashiers.reduce((a, r) => a + r.eft, 0)
  const voucherVariance = varianceLabel(storeVoucher, kdVoucher)
  const loyaltyVariance = varianceLabel(kdLoyalty, kdLoyalty)
  const grandVariance = varianceLabel(grandTotal, kdStoreTotal)
  const physVariance = varianceLabel(repCash + inp.surrender, cashierTotal)

  return {
    kdCash, kdCard, kdEFT, kdVoucher, kdLoyalty, kdStoreTotal,
    repCash, spTotal, cashDepTotal,
    contribCash, contribCard, contribs,
    effFloats, effChange,
    physicalCashTotal, cashierTotal,
    grandTotal,
    cashVariance, cardVariance, eftVariance, voucherVariance, loyaltyVariance, grandVariance, physVariance,
    spEntries, cashDepEntries,
    hasKD: cashiers.length > 0,
    hasSP: spEntries.length > 0,
    hasCashDep: cashDepEntries.length > 0,
    hasContribs: contribs.length > 0,
    hasStoreData
  }
}