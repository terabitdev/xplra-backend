import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');
  const zoom = req.nextUrl.searchParams.get('zoom') || '14';
  const size = req.nextUrl.searchParams.get('size') || '640x320';
  const scale = req.nextUrl.searchParams.get('scale') || '2';

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Maps API key not configured' }, { status: 500 });
  }

  const url =
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${encodeURIComponent(`${lat},${lng}`)}` +
    `&zoom=${encodeURIComponent(zoom)}` +
    `&size=${encodeURIComponent(size)}` +
    `&scale=${encodeURIComponent(scale)}` +
    `&markers=${encodeURIComponent(`color:red|${lat},${lng}`)}` +
    `&key=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: `Map fetch failed: ${res.status}` }, { status: 502 });
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Map proxy error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
