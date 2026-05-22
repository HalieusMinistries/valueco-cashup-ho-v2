import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { R } from '../utils/calc'
import { MONTHS_S } from '../utils/stores'
import NumericInput from '../components/NumericInput'

export default function ManualEntriesPage() {
  const app = useApp()
  const daysInMonth = new Date(app.year, app.month, 0).getDate()

  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState(0)

  function handleAdd() {
    if (!desc.trim() || amount <= 0) return
    app.addManualDeposit(selectedDay, desc.trim(), amount)
    setDesc('')
    setAmount(0)
    app.addLog('MANUAL_DEPOSIT', `Manual entry added for day ${selectedDay}`)
  }

  // Collect all manual deposits across all days for this store/period
  const allEntries: { day: number; desc: string; amount: number; index: number }[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const inp = app.getDayInput(d)
    ;(inp.manualDeposits || []).forEach((e, i) => {
      allEntries.push({ day: d, desc: e.desc, amount: e.amount, index: i })
    })
  }

  const totalManual = allEntries.reduce((a, e) => a + e.amount, 0)

  return (
    <div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
        Manual Bank Entries — {MONTHS_S[app.month - 1]} {app.year} — {app.name}
      </div>

      {/* Add Entry Form */}
      <div className="section-lbl">Add New Entry</div>
      <div className="card">
        <div className="card-bd">
          <div className="frow">
            <span className="flbl">Day</span>
            <select
              className="ti"
              style={{ width: 80, fontSize: 12 }}
              value={selectedDay}
              onChange={e => setSelectedDay(parseInt(e.target.value))}
            >
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>
                  {String(d).padStart(2, '0')} {MONTHS_S[app.month - 1]}
                </option>
              ))}
            </select>
          </div>
          <div className="frow">
            <span className="flbl">Description</span>
            <input
              type="text"
              className="ti"
              style={{ width: 300, fontSize: 12 }}
              placeholder="e.g. BULK DEPOSIT, CASH DEPOSIT..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>
          <div className="frow">
            <span className="flbl">Amount</span>
            <NumericInput
              className="ti"
              style={{ width: 150 }}
              value={amount}
              onChange={v => setAmount(v)}
            />
          </div>
          <div className="frow" style={{ marginTop: 8 }}>
            <span className="flbl"></span>
            <button
              className="btn pri"
              onClick={handleAdd}
              disabled={!desc.trim() || amount <= 0}
            >
              + Add Entry
            </button>
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div className="section-lbl" style={{ marginTop: 16 }}>
        All Manual Entries for {MONTHS_S[app.month - 1]} {app.year}
        {allEntries.length > 0 && (
          <span style={{ marginLeft: 12, color: 'var(--acc)', fontWeight: 400 }}>
            {allEntries.length} {allEntries.length === 1 ? 'entry' : 'entries'} — Total {R(totalManual)}
          </span>
        )}
      </div>
      <div className="card">
        {allEntries.length === 0 ? (
          <div style={{ padding: 16, color: 'var(--txt2)', fontFamily: 'var(--mono)', fontSize: 11 }}>
            No manual entries for this period. Use the form above to add entries that are not being detected automatically from the bank CSV.
          </div>
        ) : (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th className="r">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allEntries.map((e, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--acc)', fontFamily: 'var(--mono)', fontWeight: 600 }}>
                    {String(e.day).padStart(2, '0')} {MONTHS_S[app.month - 1]}
                  </td>
                  <td style={{ color: 'var(--txt)' }}>{e.desc}</td>
                  <td className="r" style={{ color: 'var(--grn)' }}>{R(e.amount)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn sec"
                      style={{ fontSize: 10, padding: '2px 8px', color: 'var(--red)' }}
                      onClick={() => app.removeManualDeposit(e.day, e.index)}
                    >
                      ✕ Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--txt2)', fontFamily: 'var(--mono)' }}>
        ⓘ Manual entries are included in the Bank Total and Bank Entries columns across all reconciliation tabs. They persist across sessions and survive bank CSV reloads.
      </div>
    </div>
  )
}