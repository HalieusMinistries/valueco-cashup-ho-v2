import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { parseKD, parseBank, parseContributions, parseCashJournal } from '../utils/parsers'
import { dateStr } from '../utils/calc'
import { fetchKdContributions, fetchKdJournal, fetchKdSales } from '../api/client'
import type { KdContribution, KdJournal, KdSales } from '../api/client'

export default function Sidebar() {
  const app = useApp()
  const [fetching, setFetching] = useState(false)

  const daysInMonth = new Date(app.year, app.month, 0).getDate()

  function getDayKD(day: number) {
    const ds = dateStr(app.year, app.month, day)
    return app.kdRows.filter(r => r.store === app.code && r.date === ds)
  }

  function getDayContrib(day: number) {
    const ds = dateStr(app.year, app.month, day)
    return app.contributionRows.filter(r => r.date === ds && r.store === app.code)
  }

  function getDayJournal(day: number) {
    const ds = dateStr(app.year, app.month, day)
    return app.journalRows.filter(r => r.date === ds)
  }

  function getDaySP(day: number) {
    const dn = `${app.year}${String(app.month).padStart(2,'0')}${String(day).padStart(2,'0')}`
    return app.bankRows.filter(r => String(r.statDate) === dn && (r.desc.includes('SPEEDPOINT') || r.desc.includes(app.sp)))
  }

  function getDayCash(day: number) {
    const dn = `${app.year}${String(app.month).padStart(2,'0')}${String(day).padStart(2,'0')}`
    return app.bankRows.filter(r => String(r.statDate) === dn && r.amount > 0 && (r.desc.includes('DEP') || r.desc.includes('CASH') || r.desc.startsWith('FNB ') || r.desc.includes('OB TRF')))
  }

  function handleKD(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    app.addLog('FILE_SELECT', `KingDee CSV selected: ${file.name} (${(file.size / 1024).toFixed(1)}kb)`)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const rows = parseKD(ev.target!.result as string)
        app.setKDRows(rows)
      } catch (err) {
        app.addLog('IMPORT_ERROR', `KingDee CSV parse failed: ${file.name}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleBank(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    app.addLog('FILE_SELECT', `Bank CSV(s) selected: ${files.length} files`)

    const BATCH_SIZE = 50
    const allRows: typeof app.bankRows = []

    function readFile(file: File): Promise<typeof app.bankRows> {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = ev => {
          try {
            const rows = parseBank(ev.target!.result as string)
            resolve(rows)
          } catch {
            app.addLog('IMPORT_ERROR', `Bank CSV parse failed: ${file.name}`)
            resolve([])
          }
        }
        reader.readAsText(file)
      })
    }

    async function processBatches() {
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE)
        const results = await Promise.all(batch.map(readFile))
        results.forEach(rows => allRows.push(...rows))
      }
      app.setBankRows(allRows)
      app.addLog('IMPORT', `Bank CSV batch complete — ${allRows.length} rows from ${files.length} files`)
    }

    processBatches()
    e.target.value = ''
  }

  function handleContrib(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    app.addLog('FILE_SELECT', `Contributions file selected: ${file.name} (${(file.size / 1024).toFixed(1)}kb)`)
    const isXLSX = /\.(xlsx|xlsm|xls)$/i.test(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const rows = parseContributions(ev.target!.result as ArrayBuffer | string, isXLSX)
        app.setContribRows(rows)
      } catch (err) {
        app.addLog('IMPORT_ERROR', `Contributions parse failed: ${file.name}`)
      }
    }
    if (isXLSX) reader.readAsArrayBuffer(file)
    else reader.readAsText(file)
    e.target.value = ''
  }

  function handleJournal(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    app.addLog('FILE_SELECT', `Cash Journal selected: ${file.name} (${(file.size / 1024).toFixed(1)}kb)`)
    const isXLSX = /\.(xlsx|xlsm|xls)$/i.test(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const rows = parseCashJournal(ev.target!.result as ArrayBuffer | string, isXLSX)
        app.setJournalRows(rows)
      } catch (err) {
        app.addLog('IMPORT_ERROR', `Cash Journal parse failed: ${file.name}`)
      }
    }
    if (isXLSX) reader.readAsArrayBuffer(file)
    else reader.readAsText(file)
    e.target.value = ''
  }

  function exportJSON() {
    app.addLog('EXPORT', 'JSON Backup exported')
    const backup = {
      version: 1, exported: new Date().toISOString(),
      store: { name: app.name, code: app.code, bank: app.bank, sp: app.sp },
      period: { month: app.month, year: app.year },
      dayInputs: app.dayInputs,
      kdRows: app.kdRows, storeRows: app.storeRows, bankRows: app.bankRows,
      removedBankEntries: app.removedBankEntries,
      journalRows: app.journalRows, contributionRows: app.contributionRows
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    a.download = `CashUp_Backup_${app.code}_${app.year}${String(app.month).padStart(2,'0')}_${new Date().toISOString().substring(0,10)}.json`
    a.click()
  }

  function exportDiag() {
    app.addLog('EXPORT', 'Full diagnostic report exported')

    const SA_HOLIDAYS = new Set([
      '2026-01-01','2026-03-21','2026-04-03','2026-04-06','2026-04-27',
      '2026-05-01','2026-05-25','2026-06-16','2026-08-09','2026-08-10',
      '2026-09-24','2026-12-16','2026-12-25','2026-12-26',
      '2027-01-01','2027-03-21','2027-03-26','2027-03-29','2027-04-27',
      '2027-05-01','2027-06-16','2027-08-09','2027-09-24',
      '2027-12-16','2027-12-25','2027-12-26',
    ])

    function prevDays(bankDateStr: string, count: number): string[] {
      const days: string[] = []
      const d = new Date(bankDateStr + 'T00:00:00Z')
      for (let i = 0; i < count; i++) {
        d.setUTCDate(d.getUTCDate() - 1)
        days.push(d.toISOString().substring(0, 10))
      }
      return days
    }

    // Build per-store SP matching using same logic as calc.ts
    const monthStr = `${app.year}-${String(app.month).padStart(2,'0')}`

    const storeReports = app.stores
      .filter(s => s.bank && s.code !== 'VCL24')
      .map(store => {
        const daysInMonthCount = new Date(app.year, app.month, 0).getDate()

        // KD cards by date for this store
        const kdCardsByDate: Record<string, number> = {}
        const kdCashByDate: Record<string, number> = {}
        for (let d = 1; d <= daysInMonthCount; d++) {
          const ds = `${app.year}-${String(app.month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
          const rows = app.kdRows.filter(r => r.store === store.code && r.date === ds && r.cashier.toUpperCase() !== 'STORE SUBTOTAL')
          kdCardsByDate[ds] = rows.reduce((a, r) => a + r.card, 0)
          kdCashByDate[ds] = rows.reduce((a, r) => a + r.cash, 0)
        }

        // Bank rows for this store
        const storeBankRows = app.bankRows.filter(r => r.account === store.bank)

        // Group SP entries by bank date
        const spByDate: Record<string, number[]> = {}
        storeBankRows.forEach(r => {
          if (!(r.desc.includes('SPEEDPOINT') || r.desc.includes(store.sp))) return
          const raw = String(r.statDate).substring(0, 8)
          const bankDateStr = `${raw.substring(0,4)}-${raw.substring(4,6)}-${raw.substring(6,8)}`
          if (!spByDate[bankDateStr]) spByDate[bankDateStr] = []
          spByDate[bankDateStr].push(r.amount)
        })

        // Match SP to KD days using same algorithm as calc.ts
        const spMatches: {
          bankDate: string
          kdDay: string
          bankAmount: number
          kdCards: number
          diff: number
          matched: boolean
        }[] = []

        const globalUsedDays = new Set<string>()

        Object.keys(spByDate).sort().forEach(bankDateStr => {
          const entries = spByDate[bankDateStr]
          const candidates = prevDays(bankDateStr, entries.length)
          const usedDaysThisBatch = new Set<string>()

          // First pass — exact match
          for (const day of candidates) {
            if (globalUsedDays.has(day) || usedDaysThisBatch.has(day)) continue
            const kdAmt = kdCardsByDate[day]
            if (kdAmt === undefined) continue
            for (let i = 0; i < entries.length; i++) {
              if (usedDaysThisBatch.has(day)) continue
              if (Math.abs(entries[i] - kdAmt) < 0.01) {
                usedDaysThisBatch.add(day)
                globalUsedDays.add(day)
                spMatches.push({
                  bankDate: bankDateStr,
                  kdDay: day,
                  bankAmount: entries[i],
                  kdCards: kdAmt,
                  diff: 0,
                  matched: true
                })
                break
              }
            }
          }

          // Second pass — remaining unmatched
          const matchedAmounts = new Set(spMatches.filter(m => m.bankDate === bankDateStr).map(m => m.bankAmount))
          const remainingEntries = entries.filter(e => !matchedAmounts.has(e))
          const remainingCandidates = candidates.filter(d => !globalUsedDays.has(d)).reverse()
          remainingEntries.forEach((bankAmt, i) => {
            const day = remainingCandidates[i]
            if (!day) return
            globalUsedDays.add(day)
            const kdCards = kdCardsByDate[day] ?? 0
            spMatches.push({
              bankDate: bankDateStr,
              kdDay: day,
              bankAmount: bankAmt,
              kdCards,
              diff: bankAmt - kdCards,
              matched: Math.abs(bankAmt - kdCards) < 0.01
            })
          })
        })

        // Filter to current month only
        const currentMonthMatches = spMatches.filter(m => m.kdDay.startsWith(monthStr))

        // Build day summary
        const daySummary = []
        for (let d = 1; d <= daysInMonthCount; d++) {
          const ds = `${app.year}-${String(app.month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
          const kdCards = kdCardsByDate[ds] ?? 0
          const kdCash = kdCashByDate[ds] ?? 0
          const hasKD = kdCards > 0 || kdCash > 0
          const dayMatches = currentMonthMatches.filter(m => m.kdDay === ds)
          const bankSP = dayMatches.reduce((a, m) => a + m.bankAmount, 0)
          const spDiff = bankSP - kdCards
          const inp = app.getDayInput(d)

          // Cash deposits for this day
          const dn = `${app.year}${String(app.month).padStart(2,'0')}${String(d).padStart(2,'0')}`
          const cashDeps = storeBankRows.filter(r =>
            String(r.statDate) === dn && r.amount > 0 &&
            (r.desc.includes('ADT') || r.desc.includes('CASH DEPO') || r.desc.includes('CASH DEP'))
          )
          const cashDepTotal = cashDeps.reduce((a, r) => a + r.amount, 0)

          daySummary.push({
            date: ds,
            hasKD,
            kdCards,
            kdCash,
            bankSP,
            spDiff,
            spMatched: Math.abs(spDiff) < 0.01,
            spEntries: dayMatches.length,
            cashDepTotal,
            fnbDeposit: inp.fnb,
            cashDiff: inp.fnb - kdCash,
            spMatchDetail: dayMatches
          })
        }

        const totalKDCards = daySummary.reduce((a, d) => a + d.kdCards, 0)
        const totalBankSP = daySummary.reduce((a, d) => a + d.bankSP, 0)
        const totalKDCash = daySummary.reduce((a, d) => a + d.kdCash, 0)
        const totalFNB = daySummary.reduce((a, d) => a + d.fnbDeposit, 0)
        const unmatchedSP = spMatches.filter(m => !m.kdDay.startsWith(monthStr))

        return {
          store: { code: store.code, name: store.name, bank: store.bank, sp: store.sp },
          summary: {
            totalKDCards,
            totalBankSP,
            cardVariance: totalBankSP - totalKDCards,
            totalKDCash,
            totalFNBDeposit: totalFNB,
            cashVariance: totalFNB - totalKDCash,
            daysWithKD: daySummary.filter(d => d.hasKD).length,
            daysWithSP: daySummary.filter(d => d.spEntries > 0).length,
            daysMatched: daySummary.filter(d => d.hasKD && d.spMatched && d.spEntries > 0).length,
            daysWithVariance: daySummary.filter(d => d.hasKD && !d.spMatched && d.spEntries > 0).length,
            daysNoSP: daySummary.filter(d => d.hasKD && d.spEntries === 0).length,
            unmatchedSPEntries: unmatchedSP.length
          },
          days: daySummary,
          unmatchedSPEntries: unmatchedSP
        }
      })

    // ─── Accuracy Checks ─────────────────────────────────────────────────────
    const accuracyChecks = app.stores
      .filter(s => s.bank && s.code !== 'VCL24')
      .map(store => {
        const daysInMonthCount = new Date(app.year, app.month, 0).getDate()
        const storeBankRows = app.bankRows.filter(r => r.account === store.bank)

        // Duplicate bank entry detection
        const bankEntryKey = (r: any) => `${r.statDate}|${r.amount}|${String(r.desc).substring(0, 20)}`
        const keyCount: Record<string, number> = {}
        storeBankRows.forEach(r => {
          const k = bankEntryKey(r)
          keyCount[k] = (keyCount[k] || 0) + 1
        })
        const duplicates = storeBankRows
          .filter(r => keyCount[bankEntryKey(r)] > 1)
          .map(r => ({ date: r.statDate, amount: r.amount, desc: r.desc }))
          .filter((v, i, a) => a.findIndex(x => bankEntryKey(x) === bankEntryKey(v)) === i)

        // Per day cash recon accuracy
        const cashReconDays = []
        for (let d = 1; d <= daysInMonthCount; d++) {
          const ds = `${app.year}-${String(app.month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
          const dn = `${app.year}${String(app.month).padStart(2,'0')}${String(d).padStart(2,'0')}`
          const inp = app.getDayInput(d)
          const contribCash = app.contributionRows
            .filter(r => r.store === store.code && r.date === ds && r.mode === 'cash')
            .reduce((a, r) => a + r.contribution, 0)
          const bankCashDeps = storeBankRows.filter(r =>
            String(r.statDate) === dn && r.amount > 0 &&
            (r.desc.includes('ADT') || r.desc.includes('CASH DEPO') || r.desc.includes('CASH DEP'))
          )
          const bankCashTotal = bankCashDeps.reduce((a, r) => a + r.amount, 0)
          const fnbDeposit = inp.fnb !== 0 ? inp.fnb : contribCash
          const cashVariance = fnbDeposit - bankCashTotal
          if (contribCash > 0 || bankCashTotal > 0) {
            cashReconDays.push({
              date: ds,
              contribCash,
              fnbDeposit,
              bankCashTotal,
              cashVariance,
              cashBalanced: Math.abs(cashVariance) < 0.01
            })
          }
        }

        // Journal accuracy check
        const storeJournal = app.journalRows.filter(r => r.account === store.code)
        const journalCheck = storeJournal.map((r, i) => {
          const prev = i === 0 ? 0 : storeJournal[i - 1].balanceToday
          const expected = prev + r.revenueToday - r.expenseToday
          const balanceCorrect = Math.abs(expected - r.balanceToday) < 0.01
          return {
            date: r.date,
            prevBal: prev,
            revenueToday: r.revenueToday,
            expenseToday: r.expenseToday,
            balanceToday: r.balanceToday,
            expectedBalance: expected,
            balanceCorrect
          }
        })

        return {
          store: { code: store.code, name: store.name },
          duplicateBankEntries: duplicates,
          duplicateCount: duplicates.length,
          cashReconDays,
          cashReconIssues: cashReconDays.filter(d => !d.cashBalanced).length,
          journalCheck,
          journalIssues: journalCheck.filter(d => !d.balanceCorrect).length
        }
      })

    const report = {
      generated: new Date().toISOString(),
      period: { month: app.month, year: app.year },
      currentStore: { name: app.name, code: app.code, bank: app.bank, sp: app.sp },
      bankRowCount: app.bankRows.length,
      kdRowCount: app.kdRows.length,
      contribRowCount: app.contributionRows.length,
      journalRowCount: app.journalRows.length,
      removedBankEntries: app.removedBankEntries,
      accuracyChecks,
      storeReports,
      activityLog: app.getLog()
    }

    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }))
    a.download = `FullDiagnostic_${app.year}${String(app.month).padStart(2,'00')}_${new Date().toISOString().substring(0,10)}.json`
    a.click()
  }

  function handleBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    app.addLog('BACKUP_LOAD', `Backup file loaded: ${file.name}`)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const b = JSON.parse(ev.target!.result as string)
        if (!b.version || !b.store || !b.period) {
          app.addLog('BACKUP_ERROR', `Invalid backup file: ${file.name}`)
          alert('Invalid backup file')
          return
        }
        app.setConfig({
          name: b.store.name, code: b.store.code, bank: b.store.bank, sp: b.store.sp,
          month: b.period.month, year: b.period.year, dayInputs: b.dayInputs || {}
        })
        app.setConfig({ removedBankEntries: b.removedBankEntries || [] })
        app.setKDRows(b.kdRows || [])
        app.setStoreRows(b.storeRows || [])
        app.setBankRows(b.bankRows || [])
        app.setJournalRows(b.journalRows || [])
        app.setContribRows(b.contributionRows || [])
        app.addLog('BACKUP_LOAD', `Backup restored: ${b.store.name} ${b.period.year}-${String(b.period.month).padStart(2,'0')}`)
      } catch (err) {
        app.addLog('BACKUP_ERROR', `Backup parse failed: ${file.name}`)
        alert('Failed to load backup')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function fetchFromKingDee() {
    setFetching(true)
    app.addLog('IMPORT', `KingDee fetch started — all stores for ${app.year}-${String(app.month).padStart(2,'0')}`)
    try {
      const dateFrom = `${app.year}-${String(app.month).padStart(2,'0')}-01`
      const dateTo = `${app.year}-${String(app.month).padStart(2,'0')}-${String(daysInMonth).padStart(2,'0')}`

      const results = await Promise.all(
        app.stores.map(store =>
          Promise.all([
            fetchKdContributions(store.code, dateFrom, dateTo).catch((): KdContribution[] => []),
            fetchKdJournal(store.code, dateFrom, dateTo).catch((): KdJournal[] => []),
            fetchKdSales(store.code, dateFrom, dateTo).catch((): KdSales[] => [])
          ])
        )
      )

      const allKdRows: typeof app.kdRows = []
      const allContribRows: typeof app.contributionRows = []
      const allJournalRows: typeof app.journalRows = []

      results.forEach(([contribs, journal, sales], storeIndex) => {
        const store = app.stores[storeIndex]

        sales.forEach(r => allKdRows.push({
          store: r.storeCode,
          date: r.cashUpDate,
          cashier: r.cashierFullName,
          cash: r.cash,
          eft: r.eft,
          card: r.card,
          rounding: r.rounding,
          gross: r.grossSales,
          returns: r.totalReturns,
          voucher: r.voucher,
          picking: r.pickingCard,
          loyalty: r.loyaltyPoints
        }))

        contribs.forEach(r => {
          const rawMode = r.settlementMode.toLowerCase()
          let mode = rawMode
          if (rawMode === 'bank card') mode = 'bank card'
          else if (rawMode === 'cash') mode = 'cash'
          else if (rawMode === 'erase') mode = 'erase'
          else if (rawMode === 'payment by points') mode = 'payment by points'
          else if (rawMode !== 'bank card' && rawMode !== 'cash' && rawMode !== 'erase' && rawMode !== 'payment by points') mode = 'eft'
          allContribRows.push({
            date: r.date,
            store: r.storeCode,
            cashier: r.cashier,
            mode,
            contribution: r.contributionAmount,
            petty: r.pettyCash,
            diff: r.difference,
            remark: r.remark
          })
        })

        // Aggregate journal entries by date — sum receipts and payments, keep last balance
        const journalByDate = new Map<string, { prevBal: number; revenueToday: number; expenseToday: number; balanceToday: number; name: string }>()
        journal.filter(r => r.accountCode !== '0').forEach(r => {
          const existing = journalByDate.get(r.date)
          if (existing) {
            existing.revenueToday += r.receiptAmount
            existing.expenseToday += r.paymentAmount
            existing.balanceToday = r.balance
          } else {
            journalByDate.set(r.date, {
              prevBal: 0,
              revenueToday: r.receiptAmount,
              expenseToday: r.paymentAmount,
              balanceToday: r.balance,
              name: r.accountName
            })
          }
        })
        const sortedDates = Array.from(journalByDate.entries()).sort((a, b) => a[0].localeCompare(b[0]))
        let prevClosing = 0
        sortedDates.forEach(([date, v]) => {
          v.prevBal = prevClosing
          prevClosing = v.balanceToday
          allJournalRows.push({
            date,
            account: store.code,
            name: v.name,
            prevBal: v.prevBal,
            revenueToday: v.revenueToday,
            expenseToday: v.expenseToday,
            balanceToday: v.balanceToday
          })
        })
      })

      // Deduplicate journal rows by store+date — keep last occurrence
      const journalMap = new Map<string, typeof allJournalRows[0]>()
      allJournalRows.forEach(r => journalMap.set(`${r.account}-${r.date}`, r))
      const dedupedJournalRows = Array.from(journalMap.values())

      app.setKDRows(allKdRows)
      app.setContribRows(allContribRows)
      app.setJournalRows(dedupedJournalRows)
      await new Promise(r => setTimeout(r, 1000))
      await app.saveWithJournal(dedupedJournalRows, allKdRows, allContribRows)
      app.addLog('IMPORT', `KingDee fetch complete — Sales:${allKdRows.length} Contrib:${allContribRows.length} Journal:${allJournalRows.length}`)
    } catch (err) {
      app.addLog('IMPORT_ERROR', `KingDee fetch failed: ${err}`)
      alert('Failed to fetch KingDee data. Server may be unavailable.')
    } finally {
      setFetching(false)
    }
  }

  return (
    <div className="sidebar">
      <div className="sb-section">
        <div className="sb-label">Data Import</div>
        <button className="btn pri" onClick={fetchFromKingDee} disabled={fetching}>
          {fetching ? '⏳ Fetching...' : '🔄 Fetch from KingDee'}
        </button>
        <div style={{display:'none'}}>
  <FileBtn label="📂 Load KingDee CSV" accept=".csv" onChange={handleKD} />
  <FileBtn label="📊 Load Contributions" accept=".xlsx,.xlsm,.xls,.csv" onChange={handleContrib} />
  <FileBtn label="📒 Load Cash Journal" accept=".csv,.xlsx,.xlsm,.xls" onChange={handleJournal} />
</div>
        <FileBtn label="🏦 Load Bank CSV(s)" accept=".csv" multiple onChange={handleBank} />
        <button className="btn pri" style={{marginTop:8}} onClick={exportJSON}>⬇ Export JSON Backup</button>
        <button className="btn" style={{marginTop:4}} onClick={exportDiag}>🔍 Export Diagnostic</button>
        <FileBtn label="📂 Load Backup" accept=".json" onChange={handleBackup} />
      </div>

      <div className="sb-section">
        <div className="sb-label">Day Status</div>
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1
          const hasKD = getDayKD(d).length > 0
          const hasContrib = getDayContrib(d).length > 0
          const hasJournal = getDayJournal(d).length > 0
          const hasSP = getDaySP(d).length > 0
          const hasCash = getDayCash(d).length > 0
          return (
            <div key={d} className="sb-day">
              <span style={{color:'var(--txt2)',width:18}}>{String(d).padStart(2,'0')}</span>
              <div className={`dot ${hasKD ? 'kd' : ''}`} title="KingDee" />
              <div className={`dot ${hasContrib ? 'on' : ''}`} title="Contributions" />
              <div className={`dot ${hasJournal ? 'on' : ''}`} title="Journal" />
              <div className={`dot ${hasSP ? 'on' : ''}`} title="SpeedPoint" />
              <div className={`dot ${hasCash ? 'on' : ''}`} title="Cash Dep" />
              <span>{hasKD ? `${getDayKD(d).filter(r => r.cashier.toUpperCase() !== 'STORE SUBTOTAL').length}cx` : '—'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FileBtn({ label, accept, multiple, onChange }: {
  label: string; accept: string; multiple?: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <button className="btn" onClick={() => ref.current?.click()}>{label}</button>
      <input ref={ref} type="file" accept={accept} multiple={multiple} style={{display:'none'}} onChange={onChange} />
    </>
  )
}