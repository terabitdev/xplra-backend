import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Geocoding API key not configured' }, { status: 500 });
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.results?.length) {
    return NextResponse.json({ location: null });
  }

  const components: { types: string[]; long_name: string; short_name: string }[] =
    data.results[0].address_components ?? [];

  const find = (type: string) =>
    components.find(c => c.types.includes(type));

  const cityComponent =
    find('locality') ?? find('sublocality') ?? find('administrative_area_level_2');
  const countryComponent = find('country');

  const city = cityComponent?.long_name ?? '';
  const countryCode = countryComponent?.short_name ?? '';

  if (!city || !countryCode) {
    return NextResponse.json({ location: null });
  }

  return NextResponse.json({ location: `${city}, ${countryCode}` });
}
