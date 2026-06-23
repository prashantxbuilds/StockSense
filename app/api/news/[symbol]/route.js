// app/api/news/[symbol]/route.js
import { fetchNews } from '@/lib/finnhub'

export async function GET(req, { params }) {
  try {
    const data = await fetchNews(params.symbol.toUpperCase())
    // Return only last 10 news items
    return Response.json(Array.isArray(data) ? data.slice(0, 10) : data)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
