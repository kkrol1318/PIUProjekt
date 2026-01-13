import { fetchNearbyPages, fetchPageSummary } from './api-wiki.js';
import { setEscapeSettings, setView } from './store.js';
import { clamp } from './utils.js';

function fmtKm(meters) {
    if (meters == null || Number.isNaN(Number(meters))) return '';
    const m = Number(meters);
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(1)} km`;
}

function getUserLocation({ timeoutMs = 8000 } = {}) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(
                new Error('Brak wsparcia geolokalizacji w tej przeglądarce.')
            );
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                });
            },
            (err) => reject(err),
            {
                enableHighAccuracy: true,
                timeout: timeoutMs,
                maximumAge: 60_000,
            }
        );
    });
}

export function initEscape(state) {
    const tabPlanner = document.getElementById('tabPlanner');
    const tabEscape = document.getElementById('tabEscape');

    const plannerView = document.getElementById('plannerView');
    const escapeView = document.getElementById('escapeView');

    const radiusInput = document.getElementById('escapeRadius');
    const limitInput = document.getElementById('escapeLimit');
    const sortSelect = document.getElementById('escapeSort');

    const btnSearch = document.getElementById('escapeSearch');
    const btnReset = document.getElementById('escapeReset');

    const listEl = document.getElementById('escapeList');
    const emptyEl = document.getElementById('escapeEmpty');
    const detailsEl = document.getElementById('escapeDetails');
    const statusEl = document.getElementById('escapeStatus');

    let aborter = null;

    function setStatus(text) {
        statusEl.textContent = text ?? '';
    }

    function setActiveTab() {
        const isEscape = state.view === 'escape';
        plannerView.hidden = isEscape;
        escapeView.hidden = !isEscape;

        tabPlanner.classList.toggle('tab--active', !isEscape);
        tabEscape.classList.toggle('tab--active', isEscape);
    }

    function loadControlsFromState() {
        radiusInput.value = String(state.escape.radiusKm ?? 5);
        limitInput.value = String(state.escape.limit ?? 20);
        sortSelect.value = state.escape.sort ?? 'dist';
    }

    function saveControlsToState() {
        setEscapeSettings(state, {
            radiusKm: clamp(Number(radiusInput.value || 5), 1, 25),
            limit: clamp(Number(limitInput.value || 20), 5, 50),
            sort: sortSelect.value,
        });
    }

    function renderList(items) {
        listEl.innerHTML = '';
        emptyEl.style.display = items.length ? 'none' : 'block';

        for (const it of items) {
            const li = document.createElement('li');
            li.className = 'place-item';
            li.dataset.title = it.title;

            const left = document.createElement('div');

            const name = document.createElement('p');
            name.className = 'place-name';
            name.textContent = it.title || '(bez tytułu)';

            const meta = document.createElement('p');
            meta.className = 'place-meta';
            meta.textContent = `${fmtKm(it.dist)} • Wikipedia`;

            left.appendChild(name);
            left.appendChild(meta);

            const right = document.createElement('span');
            right.className = 'badge';
            right.textContent = 'artykuł';

            li.appendChild(left);
            li.appendChild(right);

            li.addEventListener('click', () => {
                saveControlsToState();
                setEscapeSettings(state, { selectedXid: it.title });
                renderDetailsLoading(it.title);
                loadDetails(it.title);
            });

            listEl.appendChild(li);
        }
    }

    function renderDetailsLoading(title) {
        detailsEl.innerHTML = `
      <h3>${title || 'Szczegóły'}</h3>
      <p class="muted">Ładuję…</p>
    `;
    }

    function renderDetails(summary) {
        const title = summary?.title ?? 'Szczegóły';
        const extract = summary?.extract ?? '';
        const img =
            summary?.thumbnail?.source ||
            summary?.originalimage?.source ||
            null;

        const url =
            summary?.content_urls?.desktop?.page ||
            summary?.content_urls?.mobile?.page ||
            null;

        detailsEl.innerHTML = `
      <h3>${title}</h3>
      ${extract ? `<p>${extract}</p>` : `<p class="muted">Brak opisu.</p>`}
      ${
          url
              ? `<p><a href="${url}" target="_blank" rel="noreferrer">Otwórz w Wikipedii</a></p>`
              : ''
      }
      ${img ? `<img src="${img}" alt="${title}" loading="lazy" />` : ''}
    `;
    }

    async function loadDetails(title) {
        if (aborter) aborter.abort();
        aborter = new AbortController();

        try {
            const summary = await fetchPageSummary(title, {
                signal: aborter.signal,
            });
            renderDetails(summary);
        } catch (e) {
            detailsEl.innerHTML = `
        <h3>Szczegóły</h3>
        <p class="muted">${String(e?.message ?? e)}</p>
      `;
        }
    }

    async function search() {
        saveControlsToState();

        // Geolokalizacja: próbujemy, jak nie wyjdzie → zostaje fallback (np. UEK)
        try {
            setStatus('Pobieram lokalizację…');
            const loc = await getUserLocation({ timeoutMs: 8000 });
            setEscapeSettings(state, { lat: loc.lat, lon: loc.lon });
            setStatus(
                `OK • lokalizacja (±${Math.round(
                    loc.accuracy
                )} m) • pobieram miejsca…`
            );
        } catch {
            setStatus(
                'Brak lokalizacji (fallback do punktu domyślnego) • pobieram miejsca…'
            );
        }

        if (aborter) aborter.abort();
        aborter = new AbortController();

        btnSearch.disabled = true;

        try {
            const items = await fetchNearbyPages(
                {
                    lat: state.escape.lat,
                    lon: state.escape.lon,
                    radiusKm: state.escape.radiusKm,
                    limit: state.escape.limit,
                },
                { signal: aborter.signal }
            );

            const sorted = [...items].sort(
                (a, b) => (a.dist ?? 1e12) - (b.dist ?? 1e12)
            );
            renderList(sorted);
            setStatus(`OK • ${sorted.length} wyników`);
        } catch (e) {
            setStatus(String(e?.message ?? e));
            renderList([]);
        } finally {
            btnSearch.disabled = false;
        }
    }

    function reset() {
        setEscapeSettings(state, {
            radiusKm: 5,
            limit: 20,
            sort: 'dist',
            selectedXid: null,
        });

        loadControlsFromState();
        setStatus('');
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
        detailsEl.innerHTML = `
      <h3>Szczegóły miejsca</h3>
      <p class="muted">Wybierz coś z listy po lewej.</p>
    `;
    }

    tabPlanner?.addEventListener('click', () => {
        setView(state, 'planner');
        setActiveTab();
    });

    tabEscape?.addEventListener('click', () => {
        setView(state, 'escape');
        setActiveTab();
    });

    btnSearch?.addEventListener('click', search);
    btnReset?.addEventListener('click', reset);

    for (const el of [radiusInput, limitInput, sortSelect]) {
        el?.addEventListener('change', saveControlsToState);
    }

    loadControlsFromState();
    setActiveTab();

    if (state.escape.selectedXid) {
        renderDetailsLoading(state.escape.selectedXid);
        loadDetails(state.escape.selectedXid);
    }
}
