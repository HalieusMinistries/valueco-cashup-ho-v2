import { useEffect } from 'react'

interface Props {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0d1117',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}
    >
      <div
        style={{
          fontSize: 42,
          fontWeight: 700,
          marginBottom: 12
        }}
      >
        VALUECO
      </div>

      <div
        style={{
          fontSize: 18,
          opacity: 0.8
        }}
      >
        Cash Up Portal
      </div>
    </div>
  )
}