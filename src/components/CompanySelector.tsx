interface Props {
  onSelect: (company: string) => void
}

export default function CompanySelector({ onSelect }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: 500,
          background: 'var(--sur)',
          border: '1px solid var(--brd)',
          borderRadius: 8,
          padding: 30,
          textAlign: 'center'
        }}
      >
        <h2>Select Company</h2>

        <button
          onClick={() => onSelect('VALUECO')}
          style={{
            width: '100%',
            padding: 15,
            marginBottom: 15,
            cursor: 'pointer'
          }}
        >
          VALUECO
        </button>

        <button
          onClick={() => onSelect('PETOK')}
          style={{
            width: '100%',
            padding: 15,
            cursor: 'pointer'
          }}
        >
          PETOK
        </button>
      </div>
    </div>
  )
}