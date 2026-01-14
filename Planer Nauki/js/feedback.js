import { Ajax } from './ajax.js';

const ajax = new Ajax({
    baseURL: 'https://httpbin.org',
    timeout: 8000,
});

export function initFeedback() {
    const form = document.getElementById('feedbackForm');
    if (!form) return;

    const rating = document.getElementById('fbRating');
    const ratingValue = document.getElementById('fbRatingValue');

    const statusEl = document.getElementById('fbStatus');
    const resultEl = document.getElementById('fbResult');

    const submitBtn = document.getElementById('fbSubmit');

    function setStatus(text) {
        if (statusEl) statusEl.textContent = text ?? '—';
    }

    function setResult(obj) {
        if (!resultEl) return;
        if (!obj) {
            resultEl.textContent = '';
            return;
        }
        resultEl.textContent = JSON.stringify(obj, null, 2);
    }

    if (rating && ratingValue) {
        ratingValue.textContent = String(rating.value || 7);
        rating.addEventListener('input', () => {
            ratingValue.textContent = String(rating.value);
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const payload = {
            email: document.getElementById('fbEmail')?.value?.trim() || '',
            tel: document.getElementById('fbTel')?.value?.trim() || '',
            topic: document.getElementById('fbTopic')?.value?.trim() || '',
            type: document.getElementById('fbType')?.value || '',
            rating: Number(document.getElementById('fbRating')?.value || 7),
            contact: document.getElementById('fbContact')?.value || '',
            message: document.getElementById('fbMessage')?.value?.trim() || '',
            consent: Boolean(document.getElementById('fbConsent')?.checked),
            sentAt: new Date().toISOString(),
        };

        setStatus('Wysyłam (POST)…');
        setResult(null);
        if (submitBtn) submitBtn.disabled = true;

        try {
            const res = await ajax.post('/post', payload);
            setStatus('Wysłano ✅ (POST)');

            setResult({
                ok: true,
                echoed: res?.json ?? null,
                info: 'Odpowiedź pochodzi z endpointu testowego (httpbin).',
            });
            form.reset();

            if (rating && ratingValue) {
                rating.value = '7';
                ratingValue.textContent = '7';
            }
        } catch (err) {
            setStatus('Błąd ❌');
            setResult({
                ok: false,
                message: String(err?.message ?? err),
            });
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });

    form.addEventListener('reset', () => {
        setStatus('—');
        if (rating && ratingValue) {
            rating.value = '7';
            ratingValue.textContent = '7';
        }
    });
}
