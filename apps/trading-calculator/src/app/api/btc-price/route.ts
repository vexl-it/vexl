import { NextRequest, NextResponse } from 'next/server'

interface BtcPriceResponse {
  BTC: number
  lastUpdatedAt: number | null
}

interface ErrorResponse {
  error: string
  cached?: boolean
  price?: number
  lastUpdatedAt?: number | null
}

// Simple in-memory cache
const priceCache = new Map<
  string,
  { price: number; lastUpdatedAt: number; cachedAt: number }
>()
const CACHE_TTL = 30_000 // 30 seconds

export async function GET(
  request: NextRequest
): Promise<NextResponse<BtcPriceResponse | ErrorResponse>> {
  const searchParams = request.nextUrl.searchParams
  const currency = searchParams.get('currency')?.toUpperCase()

  if (!currency) {
    return NextResponse.json(
      { error: 'Currency parameter is required' },
      { status: 400 }
    )
  }

  // Check cache first
  const cached = priceCache.get(currency)
  const now = Date.now()

  if (cached && now - cached.cachedAt < CACHE_TTL) {
    return NextResponse.json({
      BTC: cached.price,
      lastUpdatedAt: cached.lastUpdatedAt,
    })
  }

  const apiUrl = process.env.BTC_EXCHANGE_RATE_API_URL

  if (!apiUrl) {
    // Return cached data if available, even if stale
    if (cached) {
      return NextResponse.json({
        BTC: cached.price,
        lastUpdatedAt: cached.lastUpdatedAt,
      })
    }

    return NextResponse.json(
      { error: 'BTC_EXCHANGE_RATE_API_URL is not configured' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(`${apiUrl}/btc-rate?currency=${currency}`, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 30 },
    })

    if (!response.ok) {
      // Return cached data if available
      if (cached) {
        return NextResponse.json({
          BTC: cached.price,
          lastUpdatedAt: cached.lastUpdatedAt,
        })
      }

      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()

    // Update cache
    priceCache.set(currency, {
      price: data.BTC,
      lastUpdatedAt: data.lastUpdatedAt ?? now,
      cachedAt: now,
    })

    return NextResponse.json({
      BTC: data.BTC,
      lastUpdatedAt: data.lastUpdatedAt ?? now,
    })
  } catch (error) {
    console.error('Error fetching BTC price:', error)

    // Return cached data if available
    if (cached) {
      return NextResponse.json({
        BTC: cached.price,
        lastUpdatedAt: cached.lastUpdatedAt,
      })
    }

    return NextResponse.json(
      { error: 'Failed to fetch BTC price' },
      { status: 502 }
    )
  }
}
