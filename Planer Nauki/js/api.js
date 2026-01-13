export async function fetchQuote() {
    const res = await fetch(
        'https://motivational-spark-api.vercel.app/api/quotes/random',
        { cache: 'no-store' }
    );
    if (!res.ok) throw new Error('Nie udało się pobrać cytatu');
    const data = await res.json();
    // zakładam, że API zwraca obiekt z { quote, author }
    return { content: data.quote, author: data.author ?? 'Unknown' };
}
