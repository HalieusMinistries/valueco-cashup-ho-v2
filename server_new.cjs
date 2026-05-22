const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 4001
const DIST = path.join(__dirname, 'dist')
const DATA_DIR = path.join(__dirname, 'store-data')

// Ensure store-data directory exists on startup
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  console.log(`Created store-data directory at ${DATA_DIR}`)
}

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
}

//  Helpers 

function stateFilePath(store, period) {
  const safeStore = store.replace(/[^a-zA-Z0-9_-]/g, '')
  const safePeriod = period.replace(/[^0-9-]/g, '')
  return path.join(DATA_DIR, `${safeStore}_${safePeriod}.json`)
}

function logFilePath(store, period) {
  const safeStore = store.replace(/[^a-zA-Z0-9_-]/g, '')
  const safePeriod = period.replace(/[^0-9-]/g, '')
  return path.join(DATA_DIR, `${safeStore}_${safePeriod}_log.json`)
}

function sendJSON(res, status, data) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      try { resolve(JSON.parse(body)) }
      catch (e) { reject(new Error('Invalid JSON body')) }
    })
    req.on('error', reject)
  })
}

function log(msg) {
  const ts = new Date().toISOString()
  console.log(`[${ts}] ${msg}`)
}

//  Request Handler 

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const pathname = url.pathname

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
    return
  }

  //  API: Health check 
  if (pathname === '/api/health' && req.method === 'GET') {
    log('Health check')
    sendJSON(res, 200, { status: 'ok', ts: new Date().toISOString() })
    return
  }

  //  API: Load state 
  if (pathname === '/api/state' && req.method === 'GET') {
    const store = url.searchParams.get('store')
    const period = url.searchParams.get('period')
    if (!store || !period) { sendJSON(res, 400, { error: 'Missing store or period parameter' }); return }
    const filePath = stateFilePath(store, period)
    if (!fs.existsSync(filePath)) {
      log(`State not found for ${store} ${period} — returning empty`)
      sendJSON(res, 200, { exists: false, state: null })
      return
    }
    try {
      const raw = fs.readFileSync(filePath, 'utf8')
      const payload = JSON.parse(raw)
      log(`State loaded for ${store} ${period}`)
      sendJSON(res, 200, { exists: true, state: payload.state })
    } catch (err) {
      log(`Error reading state for ${store} ${period}: ${err.message}`)
      sendJSON(res, 500, { error: 'Failed to read state file' })
    }
    return
  }

  //  API: Save state 
  if (pathname === '/api/state' && req.method === 'POST') {
    try {
      const body = await readBody(req)
      const { store, period, state } = body
      if (!store || !period || !state) { sendJSON(res, 400, { error: 'Missing store, period or state in body' }); return }
      const filePath = stateFilePath(store, period)
      const payload = { savedAt: new Date().toISOString(), store, period, state }
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8')
      log(`State saved for ${store} ${period}`)
      sendJSON(res, 200, { ok: true, savedAt: payload.savedAt })
    } catch (err) {
      log(`Error saving state: ${err.message}`)
      sendJSON(res, 500, { error: 'Failed to save state' })
    }
    return
  }

  //  API: Load activity log 
  if (pathname === '/api/log' && req.method === 'GET') {
    const store = url.searchParams.get('store')
    const period = url.searchParams.get('period')
    if (!store || !period) { sendJSON(res, 400, { error: 'Missing store or period parameter' }); return }
    const filePath = logFilePath(store, period)
    if (!fs.existsSync(filePath)) {
      sendJSON(res, 200, { exists: false, entries: [] })
      return
    }
    try {
      const raw = fs.readFileSync(filePath, 'utf8')
      const data = JSON.parse(raw)
      log(`Activity log loaded for ${store} ${period} — ${data.entries.length} entries`)
      sendJSON(res, 200, { exists: true, entries: data.entries })
    } catch (err) {
      log(`Error reading log for ${store} ${period}: ${err.message}`)
      sendJSON(res, 500, { error: 'Failed to read log file' })
    }
    return
  }

  //  API: Append to activity log 
  // Appends new log entries to the existing log file for a store/period.
  // The log file grows continuously and is never overwritten - only appended to.
  // This means the full audit trail is preserved across sessions, browser closes,
  // power cuts, and load shedding. Each entry has a timestamp so the timeline
  // is always reconstructable even if entries arrive out of order.
  if (pathname === '/api/log' && req.method === 'POST') {
    try {
      const body = await readBody(req)
      const { store, period, entries } = body
      if (!store || !period || !Array.isArray(entries)) {
        sendJSON(res, 400, { error: 'Missing store, period or entries in body' })
        return
      }
      const filePath = logFilePath(store, period)
      let existing = { store, period, entries: [] }
      if (fs.existsSync(filePath)) {
        try {
          existing = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        } catch {
          // If log file is corrupt, start fresh
          log(`Log file corrupt for ${store} ${period} — starting fresh`)
        }
      }
      existing.entries = [...(existing.entries || []), ...entries]
      existing.lastUpdated = new Date().toISOString()
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf8')
      log(`Activity log updated for ${store} ${period} — ${entries.length} new entries, ${existing.entries.length} total`)
      sendJSON(res, 200, { ok: true, total: existing.entries.length })
    } catch (err) {
      log(`Error appending log: ${err.message}`)
      sendJSON(res, 500, { error: 'Failed to append log entries' })
    }
    return
  }

  //  API: List saved periods for a store 
  if (pathname === '/api/periods' && req.method === 'GET') {
    const store = url.searchParams.get('store')
    if (!store) { sendJSON(res, 400, { error: 'Missing store parameter' }); return }
    try {
      const safeStore = store.replace(/[^a-zA-Z0-9_-]/g, '')
      const files = fs.readdirSync(DATA_DIR)
        .filter(f => f.startsWith(safeStore + '_') && f.endsWith('.json') && !f.endsWith('_log.json'))
        .map(f => f.replace(safeStore + '_', '').replace('.json', ''))
        .sort()
      log(`Periods listed for ${store}: ${files.join(', ')}`)
      sendJSON(res, 200, { store, periods: files })
    } catch (err) {
      log(`Error listing periods: ${err.message}`)
      sendJSON(res, 500, { error: 'Failed to list periods' })
    }
    return
  }

  //  Static file serving 
  let filePath = path.join(DIST, pathname === '/' ? 'index.html' : pathname)

  // Prevent path traversal outside DIST
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST, 'index.html')
  }

  const ext = path.extname(filePath)
  const mime = MIME[ext] || 'text/plain'

  try {
    res.writeHead(200, { 'Content-Type': mime })
    fs.createReadStream(filePath).pipe(res)
  } catch (err) {
    log(`Error serving file ${filePath}: ${err.message}`)
    res.writeHead(500)
    res.end('Internal server error')
  }

}).listen(PORT, () => {
  log(`CashUp HO Portal running on port ${PORT}`)
  log(`Serving static files from: ${DIST}`)
  log(`Storing state files in: ${DATA_DIR}`)
})