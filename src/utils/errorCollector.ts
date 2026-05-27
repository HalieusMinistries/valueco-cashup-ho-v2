export interface CapturedError {
  timestamp: string
  type: 'runtime' | 'promise' | 'console_error' | 'console_warn' | 'network'
  message: string
  stack?: string
  source?: string
  status?: number
  url?: string
}

const _errors: CapturedError[] = []
let _initialized = false

export function initErrorCollector(): void {
  if (_initialized) return
  _initialized = true

  window.onerror = (message, source, lineno, colno, error) => {
    _errors.push({
      timestamp: new Date().toISOString(),
      type: 'runtime',
      message: String(message),
      source: `${source}:${lineno}:${colno}`,
      stack: error?.stack
    })
    return false
  }

  window.addEventListener('unhandledrejection', (e) => {
    _errors.push({
      timestamp: new Date().toISOString(),
      type: 'promise',
      message: String(e.reason?.message || e.reason || 'Unhandled promise rejection'),
      stack: e.reason?.stack
    })
  })

  const origError = console.error.bind(console)
  console.error = (...args: any[]) => {
    _errors.push({
      timestamp: new Date().toISOString(),
      type: 'console_error',
      message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
    })
    origError(...args)
  }

  const origWarn = console.warn.bind(console)
  console.warn = (...args: any[]) => {
    _errors.push({
      timestamp: new Date().toISOString(),
      type: 'console_warn',
      message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
    })
    origWarn(...args)
  }

  const origFetch = window.fetch.bind(window)
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    try {
      const res = await origFetch(...args)
      if (!res.ok) {
        _errors.push({
          timestamp: new Date().toISOString(),
          type: 'network',
          message: `HTTP ${res.status} ${res.statusText}`,
          url: typeof args[0] === 'string' ? args[0] : args[0] instanceof URL ? args[0].href : String(args[0]),
          status: res.status
        })
      }
      return res
    } catch (err: any) {
      _errors.push({
        timestamp: new Date().toISOString(),
        type: 'network',
        message: err?.message || 'Network request failed',
        url: typeof args[0] === 'string' ? args[0] : String(args[0])
      })
      throw err
    }
  }
}

export function getErrors(): CapturedError[] {
  return [..._errors]
}

export function clearErrors(): void {
  _errors.length = 0
}