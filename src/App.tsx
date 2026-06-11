import { useState } from 'react'
import SplashScreen from './components/SplashScreen'
import { AppProvider, useApp } from './context/AppContext'
import LoginGate from './components/LoginGate'
import TopBar from './components/TopBar'
import NavBar from './components/NavBar'
import Sidebar from './components/Sidebar'
import CompanySelector from './components/CompanySelector'
import SetupPage from './pages/SetupPage'
import CashUpPage from './pages/CashUpPage'
import ReconPage from './pages/ReconPage'
import OversPage from './pages/OversPage'
import ImportCheckPage from './pages/ImportCheckPage'
import JournalPage from './pages/JournalPage'
import UsersPage from './pages/UsersPage'
import DaySheetPage from './pages/DaySheetPage'
import CashReconPage from './pages/CashReconPage'
import CardReconPage from './pages/CardReconPage'
import TutorialPage from './pages/TutorialPage'
import ManualEntriesPage from './pages/ManualEntriesPage'

type Tab = 'setup' | 'cashup' | 'recon' | 'overs' | 'check' | 'journal' | 'users' | 'daysheet' | 'cashrecon' | 'cardrecon' | 'tutorial' | 'manual'

const TAB_LABELS: Record<Tab, string> = {
  setup: 'Setup',
  cashup: 'Cash Up',
  recon: 'Reconciliation',
  overs: 'Overs & Unders',
  check: 'Import Check',
  journal: 'Cash Journal',
  users: 'Users',
  daysheet: 'Day Sheet',
  cashrecon: 'Cash Recon',
  cardrecon: 'Card Recon',
  tutorial: 'Tutorial',
  manual: 'Manual Entries'
}

function Shell() {
  const { authed, addLog, currentTab, setCurrentTab } = useApp()
  const tab = currentTab as Tab

  if (!authed) return <LoginGate />

  function handleTabChange(t: Tab) {
    addLog('TAB_SWITCH', `Navigated to ${TAB_LABELS[t]}`)
    setCurrentTab(t)
  }

  return (
    <div className="app">
      <TopBar />
      <NavBar tab={tab} setTab={handleTabChange} />
      <div className="body">
        <Sidebar />
        <div className="content">
          {tab === 'setup'    && <SetupPage />}
          {tab === 'cashup'   && <CashUpPage setTab={handleTabChange} />}
          {tab === 'recon'    && <ReconPage setTab={handleTabChange} />}
          {tab === 'overs'    && <OversPage setTab={handleTabChange} />}
          {tab === 'check'    && <ImportCheckPage />}
          {tab === 'journal'  && <JournalPage setTab={handleTabChange} />}
          {tab === 'users'    && <UsersPage />}
          {tab === 'daysheet'  && <DaySheetPage />}
          {tab === 'cashrecon' && <CashReconPage />}
          {tab === 'cardrecon' && <CardReconPage />}
          {tab === 'tutorial'  && <TutorialPage />}
          {tab === 'manual'    && <ManualEntriesPage />}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(
    sessionStorage.getItem('vc_company')
  )

  if (showSplash) {
    return (
      <SplashScreen
        onComplete={() => setShowSplash(false)}
      />
    )
  }

  if (!selectedCompany) {
    return (
      <CompanySelector
        onSelect={(company) => {
          sessionStorage.setItem('vc_company', company)
          setSelectedCompany(company)
        }}
      />
    )
  }

  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}