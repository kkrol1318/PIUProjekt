const MW_API = 'https://pl.wikipedia.org/w/api.php';
const REST_API = 'https://pl.wikipedia.org/api/rest_v1';
const CACHE_TTL_MS = 30 * 60 * 1000;

function now() {
    return Date.now();
}

function cacheKey(params) {
    return (
        'wiki:geosearch:' +
        btoa(unescape(encodeURIComponent(JSON.stringify(params))))
    );
}

export async function fetchNearbyPages(
    { lat, lon, radiusKm = 5, limit = 20 },
    { signal } = {}
) {
    const radiusM = Math.round(Number(radiusKm) * 1000);
    const key = cacheKey({ lat, lon, radiusM, limit });

    try {
        const raw = localStorage.getItem(key);
        if (raw) {
            const cached = JSON.parse(raw);
            if (
                cached?.ts &&
                now() - cached.ts < CACHE_TTL_MS &&
                Array.isArray(cached.data)
            ) {
                return cached.data;
            }
        }
    } catch {}

    const url = new URL(MW_API);
    url.searchParams.set('action', 'query');
    url.searchParams.set('list', 'geosearch');
    url.searchParams.set('gscoord', `${lat}|${lon}`);
    url.searchParams.set('gsradius', String(radiusM));
    url.searchParams.set('gslimit', String(limit));
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*'); // CORS

    const res = await fetch(url.toString(), { signal, cache: 'no-store' });
    if (!res.ok) throw new Error('Wikipedia: błąd HTTP ' + res.status);

    const json = await res.json();
    const items = json?.query?.geosearch ?? [];

    const data = items.map((it) => ({
        pageid: it.pageid,
        title: it.title,
        lat: it.lat,
        lon: it.lon,
        dist: it.dist, // metry
    }));

    try {
        localStorage.setItem(key, JSON.stringify({ ts: now(), data }));
    } catch {}

    return data;
}

export async function fetchPageSummary(title, { signal } = {}) {
    if (!title) throw new Error('Brak tytułu strony');

    const url = `${REST_API}/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url, { signal, cache: 'no-store' });
    if (!res.ok) throw new Error('Wikipedia summary: błąd HTTP ' + res.status);
    return await res.json();
}
