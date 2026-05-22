import { useState, useEffect } from 'react'

interface Props {
  value: number
  onChange: (val: number) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
}

// NumericInput allows free-form decimal entry without losing the decimal point mid-type.
// onChange only fires on blur — not on every keystroke — so the useEffect sync
// cannot cause a feedback loop. The field displays a clean 2dp value when not focused.
export default function NumericInput({ value, onChange, onBlur, placeholder, className, style, disabled }: Props) {
  const [localVal, setLocalVal] = useState(value === 0 ? '' : (Math.round(value * 100) / 100).toFixed(2))

  // Sync when external value changes (day switch, data load, auto-populate)
  useEffect(() => {
    const rounded = Math.round(value * 100) / 100
    setLocalVal(rounded === 0 ? '' : rounded.toFixed(2))
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    // Allow digits, one decimal point, and leading minus — no onChange fired here
    if (/^-?\d*\.?\d*$/.test(raw) || raw === '') {
      setLocalVal(raw)
    }
  }

  function handleBlur() {
    // Parse, round to 2dp, format, and propagate on blur only
    const parsed = Math.round((parseFloat(localVal) || 0) * 100) / 100
    setLocalVal(parsed === 0 ? '' : parsed.toFixed(2))
    onChange(parsed)
    onBlur?.()
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      style={style}
      value={localVal}
      placeholder={placeholder ?? '0.00'}
      disabled={disabled}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}