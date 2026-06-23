// app/api/predict/route.js
export async function POST(req) {
  try {
    const body = await req.json()
    const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000'
    const res = await fetch(`${mlUrl}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.text()
      return Response.json({ error: `ML service error: ${err}` }, { status: res.status })
    }
    const data = await res.json()
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: `ML service unreachable: ${err.message}` }, { status: 503 })
  }
}
