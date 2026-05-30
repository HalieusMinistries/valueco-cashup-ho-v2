const API_BASE = `http://${window.location.hostname}:4002/api`

export interface LiveStore {
  storeCode: string
  storeName: string
  bankAccount: string
  speedPointId: string
  isActive: boolean
}

export interface LiveCashierRow {
  cashierName: string
  cash: number; card: number; eft: number; erase: number
  returns: number; gift: number; coupon: number; loyalty: number
}

export interface LiveDay {
  cashUpDate: string
  fnb: number; floats: number; changeBoxes: number; looseChange: number; pettyCash: number
  submitted: boolean
  cashierRows: LiveCashierRow[]
}

export async function login(username: string, password: string): Promise<{ success: boolean; role?: string; storeCode?: string | null; fullName?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    if (!res.ok) return { success: false }
    return res.json()
  } catch {
    return { success: false }
  }
}

export async function fetchStores(): Promise<LiveStore[]> {
  const res = await fetch(`${API_BASE}/stores`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchMonthData(storeCode: string, year: number, month: number): Promise<LiveDay[]> {
  const res = await fetch(`${API_BASE}/cashup/${storeCode}/${year}/${month}`)
  if (!res.ok) return []
  return res.json()
}

export async function deleteMonthData(storeCode: string, year: number, month: number): Promise<string> {
  const res = await fetch(`${API_BASE}/cashup/${storeCode}/${year}/${month}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

export async function updateStoreFloats(storeCode: string, storeName: string, _floats: number, _change: number): Promise<void> {
  const res = await fetch(`${API_BASE}/stores/${storeCode}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeCode, storeName, isActive: true, cashUpDays: [] })
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export interface AppUser {
  userId: number
  fullName: string
  username: string
  role: string
  storeCode: string | null
  isActive: boolean
  createdAt: string
}

export async function fetchUsers(): Promise<AppUser[]> {
  const res = await fetch(`${API_BASE}/auth/users`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createUser(data: {
  fullName: string; username: string; password: string
  role: string; storeCode: string | null
}): Promise<{ success: boolean; userId: number }> {
  const res = await fetch(`${API_BASE}/auth/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function updateUser(id: number, data: {
  fullName: string; role: string; storeCode: string | null
  isActive: boolean; password?: string
}): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

// KingDee direct integration
export interface KdContribution {
  date: string
  storeCode: string
  cashier: string
  settlementMode: string
  contributionAmount: number
  pettyCash: number
  difference: number
  remark: string
}

export interface KdJournal {
  accountCode: string
  accountName: string
  date: string
  billNo: string
  documentType: string
  explanation: string
  receiptAmount: number
  paymentAmount: number
  balance: number
}

export interface KdSales {
  storeCode: string
  cashUpDate: string
  cashierFullName: string
  cash: number
  eft: number
  card: number
  rounding: number
  grossSales: number
  totalReturns: number
  voucher: number
  pickingCard: number
  loyaltyPoints: number
}

export async function fetchKdContributions(store: string, dateFrom: string, dateTo: string): Promise<KdContribution[]> {
  const res = await fetch(`${API_BASE}/kingdee/contributions?store=${store}&dateFrom=${dateFrom}&dateTo=${dateTo}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchKdJournal(store: string, dateFrom: string, dateTo: string): Promise<KdJournal[]> {
  const res = await fetch(`${API_BASE}/kingdee/journal?store=${store}&dateFrom=${dateFrom}&dateTo=${dateTo}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchKdSales(store: string, dateFrom: string, dateTo: string): Promise<KdSales[]> {
  const res = await fetch(`${API_BASE}/kingdee/sales?store=${store}&dateFrom=${dateFrom}&dateTo=${dateTo}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}