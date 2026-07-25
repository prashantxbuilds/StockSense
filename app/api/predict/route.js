// app/api/predict/route.js
// Timeout = 9s (Vercel free tier limit is 10s).
// Cold-start handling is done on the FRONTEND via the coldStart flag —
// the browser waits 35s and retries, NOT this server function.
export async function POST(req) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 9000)
  try {
    const body = await req.json()
    const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000'
    const res = await fetch(`${mlUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      const err = await res.text()
      return Response.json({ error: `ML service error: ${err}` }, { status: res.status })
    }
    const data = await res.json()
    return Response.json(data)
  } catch (err) {
    const isTimeout = err.name === 'AbortError'
    const isUnreachable = err.name === 'TypeError' || err.message?.includes('fetch')
    const isColdStart = isTimeout || isUnreachable
    const msg = isColdStart
      ? 'ML engine is starting up. Auto-retrying in 35 seconds…'
      : `ML Service error: ${err.message}`
    // coldStart: true → frontend shows warm-up banner + auto-retries after 35s
    return Response.json({ error: msg, coldStart: isColdStart }, { status: 503 })
  } finally {
    clearTimeout(timer)
  }
}

