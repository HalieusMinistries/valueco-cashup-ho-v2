export default function TutorialPage() {
  const section = (title: string) => (
    <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--acc)', marginTop: 28, marginBottom: 8, borderBottom: '1px solid var(--brd)', paddingBottom: 4 }}>
      {title}
    </div>
  )

  const step = (n: number, text: string) => (
    <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
      <div style={{ minWidth: 26, height: 26, borderRadius: '50%', background: 'var(--acc)', color: 'var(--bg)', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
      <div style={{ fontSize: 12, color: 'var(--txt)', lineHeight: 1.7, paddingTop: 4 }} dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  )

  const note = (text: string) => (
    <div style={{ background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: 'var(--txt2)', marginBottom: 10, lineHeight: 1.6 }}>
      💡 {text}
    </div>
  )

  const warn = (text: string) => (
    <div style={{ background: 'var(--sur)', border: '1px solid var(--red)', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: 'var(--red)', marginBottom: 10, lineHeight: 1.6 }}>
      ⚠ {text}
    </div>
  )

  const p = (text: string) => (
    <div style={{ fontSize: 12, color: 'var(--txt)', lineHeight: 1.8, marginBottom: 10 }} dangerouslySetInnerHTML={{ __html: text }} />
  )

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 8px 60px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
        ValueCo CashUp HO Portal — How to Use This Programme
      </div>
      <div style={{ fontSize: 11, color: 'var(--txt2)', marginBottom: 28 }}>
        A step-by-step guide for Head Office Finance
      </div>

      {section('WHAT THIS PROGRAMME DOES')}
      {p('The CashUp HO Portal is your central reconciliation tool for all VCL stores. At the end of each month it tells you, for every store and every trading day: what the store took in on cards and cash according to KingDee, what FNB actually received, and whether those two numbers agree.')}
      {p('The programme pulls its data from two sources — <strong>KingDee</strong> (the store\'s point-of-sale system) and <strong>FNB bank statements</strong> (the CSV files you download from the FNB Business Online portal). Everything else — the matching, the reconciliation, the variance flagging — is done automatically.')}
      {note('You do not upload any KingDee files manually. All KingDee data is fetched directly from the system at the click of a button.')}

      {section('BEFORE YOU START — WHAT YOU NEED')}
      {p('Each month you will need the FNB bank statement CSV files for all stores. These are downloaded from the FNB Business Online portal. You should have one or more CSV files per store, covering the full month. Keep all of them in one folder on your computer — this makes loading them much faster.')}
      {warn('Do not rename the FNB CSV files. The programme reads the account number from inside the file, but keeping the original filenames helps you stay organised.')}

      {section('STARTING A NEW MONTH — STEP BY STEP')}
      {step(1, 'Open the portal and log in. The address is <strong>http://154.117.135.86:4001</strong>.')}
      {step(2, 'Go to the <strong>Setup tab</strong>. Check that the correct month and year are shown. If not, change them using the dropdowns. You do not need to select a specific store to load data — the KingDee fetch and bank CSV load work across all stores at once.')}
      {step(3, 'Click <strong>"Fetch from KingDee"</strong> in the left sidebar. The programme will pull all sales, cashier contributions, and cash journal data for every store for the selected month. This takes about 30 seconds. When it is done, the numbers in the top bar (KD · Contrib · Journal) will update.')}
      {step(4, 'Click <strong>"Load Bank CSV(s)"</strong> in the left sidebar. Navigate to your folder of FNB CSV files, press <strong>Ctrl+A</strong> to select all files at once, and click Open. The Bank number in the top bar will update when loading is complete.')}
      {step(5, 'You are now ready to work. Select any store from the store list on the Setup tab to begin.')}
      {note('Your work saves automatically every 30 seconds. When you reopen the portal the next day, your data will be restored automatically. Always check that the correct store and month are selected when you reopen.')}

      {section('YOUR DAILY WORKFLOW')}
      {p('Each day, as bank statements become available:')}
      {step(1, 'Open the portal and confirm the correct store and month are selected.')}
      {step(2, 'Click <strong>"Fetch from KingDee"</strong> to get the latest data.')}
      {step(3, 'Click <strong>"Load Bank CSV(s)"</strong> and load all available CSV files for the month.')}
      {step(4, 'Go to the <strong>Cash Recon tab</strong> and enter the FNB deposit, cash surrender, petty cash, change, and floats for each day that has been completed.')}
      {step(5, 'Check the <strong>Card Recon tab</strong> to confirm SpeedPoint settlements are matching correctly.')}
      {step(6, 'At the end of your session, click <strong>"Export JSON Backup"</strong> and save the file somewhere safe. This is your backup in case anything goes wrong.')}
      {warn('Bank statement CSV files must be reloaded every session — they are not stored permanently. Your manually entered figures (deposits, petty cash, etc.) are saved automatically and will be there when you reopen.')}

      {section('THE SETUP TAB')}
      {p('This is where you choose which store and month you are working on. Click any store card from the list at the bottom of the page to select it. The store name, account number, and SpeedPoint merchant number will fill in automatically.')}
      {note('You only need to select a store after loading data. The KingDee fetch and bank CSV load work for all stores simultaneously — you do not need to select each store individually.')}

      {section('THE CASH UP TAB')}
      {p('This tab shows you a detailed day-by-day view for the selected store. Click any day number along the top to open that day\'s cash-up sheet.')}
      {p('Each day sheet is divided into sections:')}
      {p('<strong>KingDee Cashier Totals</strong> — This is what KingDee recorded for each cashier: cash, cards, EFT, and other tender types. These figures come directly from the store\'s point-of-sale system and cannot be edited here.')}
      {p('<strong>Store Contributions</strong> — This is what each cashier physically reported to the store manager, compared against KingDee. A green tick means the cashier\'s reported figure matches KingDee exactly. A red figure means there is a difference — the store manager\'s comments will appear in the Remark column.')}
      {p('<strong>Cash Office Totals (K Column)</strong> — This is where you enter the manual figures for the day: the FNB deposit (K4), cash surrender (K5), petty cash (K8), and cash on hand (K9). Till floats and change boxes are pre-set per store and do not need to be entered each day.')}
      {p('<strong>Bank Transactions</strong> — This shows the SpeedPoint settlements matched from the bank statement to this trading day, and any ADT cash deposits received. These figures come from the FNB CSV files you loaded.')}
      {p('<strong>KingDee vs Reported Reconciliation</strong> — This is the bottom-line comparison. Green means the figures agree. Red means there is a variance that needs to be investigated.')}
      {note('SpeedPoints do not always appear on the same day they were taken. FNB processes SpeedPoint settlements one banking day later — so Saturday\'s card sales appear on Monday\'s bank statement. The programme handles this automatically and assigns each settlement to the correct trading day.')}

      {section('THE CASH RECON TAB')}
      {p('This tab gives you a full month view of cash reconciliation for the selected store. All 30 days are shown in one scrollable table. You can enter the FNB deposit, cash surrender, petty cash, change, and floats directly in this table without having to click into each day individually.')}
      {p('The <strong>System Total</strong> column adds up everything you have entered for that day. The <strong>Running Balance</strong> shows the cumulative cash position across the month. The <strong>Bank Total</strong> shows what FNB actually received from ADT on that day. The <strong>Difference</strong> column shows any variance between the two — green means they agree, red means they do not.')}
      {note('Changes made here are the same as changes made in the Cash Up tab. They update the same figures and save automatically.')}

      {section('THE CARD RECON TAB')}
      {p('This tab shows the SpeedPoint reconciliation for every day of the month. For each trading day it shows:')}
      {p('<strong>KD Card Total</strong> — what KingDee recorded in card sales for that day.<br /><strong>Bank SpeedPoint</strong> — what FNB received from the SpeedPoint terminal and has been matched to that day.<br /><strong>Difference</strong> — the variance between the two.<br /><strong>Bank Entries</strong> — which bank statement lines were matched to this day, including the bank date they appear on.')}
      {p('Days where both figures are zero are faded out — these are typically Sundays or public holidays where there was no trading activity in the system.')}
      {warn('A red difference on this tab means the amount the SpeedPoint terminal settled with FNB does not match what KingDee recorded for that day. This needs to be investigated at store level — check the cashier contributions for that day to find the source of the difference.')}

      {section('THE RECONCILIATION TAB')}
      {p('This tab shows the complete month summary for the selected store — one row per trading day. It compares KingDee cash and card totals against what was reported and banked. Click any row to jump directly to that day\'s Cash Up sheet.')}
      {p('The <strong>SpeedPoint Settlement Matching</strong> table at the bottom shows exactly which bank statement entries were matched to which trading days, including the bank date, the KD day covered, the amount, and whether it matched exactly.')}

      {section('THE OVERS AND UNDERS TAB')}
      {p('This tab tracks cash and card variances per day with a running balance across the month. Use this tab to monitor the store\'s cumulative cash position and to identify days where the figures do not balance. Click any row to open that day\'s Cash Up sheet.')}

      {section('THE IMPORT CHECK TAB')}
      {p('This tab shows you at a glance which days have data loaded and which do not. A green tick means data is available for that day. A circle means no data. Use this tab at the start of each session to confirm that KingDee data and bank statement data have loaded correctly for all days.')}
      {p('Days that consistently show no bank data are typically Sundays and public holidays — FNB does not process settlements on those days, so no bank statement will exist for them.')}

      {section('UNDERSTANDING THE VARIANCES')}
      {p('Not every variance is a problem. There are three types you will encounter:')}
      {p('<strong>Penny rounding (a few cents)</strong> — KingDee and FNB calculate totals slightly differently due to rounding. Differences of a few cents are normal and do not require action.')}
      {p('<strong>Small variances (rands)</strong> — These are usually caused by a cashier difference that has already been noted in the Store Contributions remarks, or a till shortage that the store has reported. Check the cashier contributions for that day.')}
      {p('<strong>Large variances (hundreds of rands or more)</strong> — These need investigation. Either the bank statement has a different amount to what KingDee recorded, or a SpeedPoint entry has been matched to the wrong day. Contact the store manager for that day.')}
      {p('<strong>Missing SpeedPoint (no bank entry for a trading day)</strong> — This happens at month end when the bank statement for the last few days has not yet been issued by FNB. Load the CSV files again once they are available and the figures will populate automatically.')}

      {section('SAVING AND BACKING UP YOUR WORK')}
      {p('The portal saves your work automatically every 30 seconds. When you reopen the portal the next day, your manually entered figures will be restored automatically — you do not need to re-enter them.')}
      {p('As an additional safety measure, click <strong>"Export JSON Backup"</strong> at the end of each working session. This saves a copy of all your work to your computer. If data is ever lost or the server is unavailable, click <strong>"Load Backup"</strong>, select your saved file, then fetch from KingDee and reload the bank CSVs to restore your full working session.')}
      {warn('Always export a JSON backup at the end of each day. It takes one click and gives you a complete safety net.')}

      {section('FREQUENTLY ASKED QUESTIONS')}
      {p('<strong>Why does Monday sometimes show two or three SpeedPoint entries?</strong><br />FNB batches all weekend settlements into Monday\'s bank statement. If there was a long weekend or public holiday, Monday\'s statement will contain settlements for Saturday, Sunday, and the holiday. The programme automatically splits these and assigns each amount to the correct trading day.')}
      {p('<strong>What are the ADT Cash Deposits?</strong><br />ADT is the cash-in-transit company that collects physical cash from the store and deposits it into the FNB account. Not every day has an ADT deposit — they collect on their scheduled days only. Some days will show multiple ADT entries if collections from different dates arrived on the same banking day.')}
      {p('<strong>Why do some days show no SpeedPoint at all?</strong><br />FNB does not process on Sundays. Sunday\'s card sales are included in Monday\'s settlement. Public holidays where FNB is closed are handled the same way.')}
      {p('<strong>I reopened the portal and my figures are gone — what do I do?</strong><br />First check that the correct store and month are selected on the Setup tab. The programme saves data per store per month, so if the wrong store or month is selected, it will look empty. If the correct store and month are selected and figures are still missing, use Load Backup to restore from your last export, then fetch from KingDee and reload the bank CSVs.')}
      {p('<strong>Can Monique and I both use the portal at the same time?</strong><br />Yes, but not on the same store and month simultaneously. If two people enter figures for the same store at the same time, the last save will overwrite the other. Work on different stores at the same time, or take turns on the same store.')}
      {p('<strong>Do I need to reload the bank CSV files every day?</strong><br />Yes — the bank CSV files need to be loaded at the start of each session. Your manually entered figures are saved automatically, but the bank statement data must be reloaded each time. Keep all your CSV files in one folder and use Ctrl+A to select them all at once.')}
    </div>
  )
}