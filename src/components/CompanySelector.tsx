interface Props {
  onSelect: (company: string) => void
}

export default function CompanySelector({ onSelect }: Props) {
  const buttonStyle: React.CSSProperties = {
    width: 260,
    height: 180,
    border: '1px solid #374151',
    borderRadius: 12,
    background: '#111827',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: 28,
    fontWeight: 700
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0d1117',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{ width: 900, textAlign: 'center' }}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 10,
            letterSpacing: 2
          }}
        >
          CASH UP PORTAL
        </div>

        <div style={{ color: '#9ca3af', marginBottom: 50, fontSize: 16 }}>
          Select Company
        </div>

        <div
          style={{
            display: 'flex',
            gap: 20,
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <button onClick={() => onSelect('VCLSTORES')} style={buttonStyle}>
            VCL STORES
          </button>

          <button onClick={() => onSelect('VCSTORES')} style={buttonStyle}>
            VC STORES
          </button>

          <button onClick={() => onSelect('PETOK')} style={buttonStyle}>
            PETOK
          </button>
        </div>

        <div style={{ marginTop: 50, color: '#6b7280', fontSize: 12 }}>
          Head Office Cash Up Management System
        </div>
      </div>
    </div>
  )
}