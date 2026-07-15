// app/api/predict/route.js
export async function POST(req) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
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
    const msg = isTimeout
      ? "ML Service is waking up (Render cold-start). Please try again in 30 seconds."
      : `ML Service unreachable: ${err.message}`
    return Response.json({ error: msg }, { status: 503 })
  } finally {
    clearTimeout(timer)
  }
}
