// app/api/ml-warmup/route.js
// Fire-and-forget ping to wake up Render ML service (no wait for response)
export async function GET() {
  const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000'
  // Kick off the request but don't await — just get Render to start the container
  fetch(`${mlUrl}/health`, { signal: AbortSignal.timeout(60000) }).catch(() => {})
  return Response.json({ status: 'warming' })
}
