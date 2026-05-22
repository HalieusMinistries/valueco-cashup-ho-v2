type Tab = 'setup' | 'cashup' | 'recon' | 'overs' | 'check' | 'journal' | 'users' | 'daysheet' | 'cashrecon' | 'cardrecon' | 'tutorial' | 'manual'

interface Props {
  tab: Tab
  setTab: (t: Tab) => void
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'setup',     label: 'Setup' },
  { id: 'cashup',    label: 'Cash Up' },
  { id: 'cashrecon', label: 'Cash Recon' },
  { id: 'cardrecon', label: 'Card Recon' },
  { id: 'daysheet',  label: '📋 Day Sheet' },
  { id: 'recon',     label: 'Reconciliation' },
  { id: 'overs',     label: 'Overs & Unders' },
  { id: 'check',     label: 'Import Check' },
  { id: 'journal',   label: 'Cash Journal' },
  { id: 'users',     label: '👤 Users' },
  { id: 'tutorial',  label: '📖 Tutorial' },
  { id: 'manual',    label: '📝 Manual Entries' },
]

export default function NavBar({ tab, setTab }: Props) {
  return (
    <div className="navbar">
      {TABS.map(t => (
        <button
          key={t.id}
          className={`nav-btn ${tab === t.id ? 'active' : ''}`}
          onClick={() => setTab(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}