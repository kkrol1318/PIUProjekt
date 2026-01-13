import { Ajax } from './ajax.js';

const QUOTE_CACHE_KEY = 'smart-study-planner:quote-cache:v1';

const ajax = new Ajax({
    baseURL: 'https://motivational-spark-api.vercel.app',
    timeout: 5000,
});

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function readCachedQuote() {
    try {
        const raw = localStorage.getItem(QUOTE_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.date || !parsed?.content) return null;
        return parsed;
    } catch {
        return null;
    }
}

function writeCachedQuote(q) {
    try {
        localStorage.setItem(
            QUOTE_CACHE_KEY,
            JSON.stringify({
                date: todayISO(),
                content: q.content,
                author: q.author,
            })
        );
    } catch {}
}

/**
 * @param {{ force?: boolean }} [opts]
 */
export async function fetchQuote(opts = {}) {
    const force = Boolean(opts.force);

    if (!force) {
        const cached = readCachedQuote();
        if (cached && cached.date === todayISO()) {
            return {
                content: cached.content,
                author: cached.author ?? 'Unknown',
            };
        }
    }

    const data = await ajax.get('/api/quotes/random', {
        headers: { 'Cache-Control': 'no-cache' },
    });

    const quote = {
        content: data?.quote ?? 'Keep going.',
        author: data?.author ?? 'Unknown',
    };

    writeCachedQuote(quote);
    return quote;
}
