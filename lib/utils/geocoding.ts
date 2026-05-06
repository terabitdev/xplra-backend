export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) return null;
    const components: { types: string[]; long_name: string; short_name: string }[] =
      data.results[0].address_components ?? [];
    const find = (type: string) => components.find(c => c.types.includes(type));
    const cityComponent =
      find('locality') ?? find('sublocality') ?? find('administrative_area_level_2');
    const countryComponent = find('country');
    const city = cityComponent?.long_name ?? '';
    const countryCode = countryComponent?.short_name ?? '';
    if (!city || !countryCode) return null;
    return `${city}, ${countryCode}`;
  } catch {
    return null;
  }
}
