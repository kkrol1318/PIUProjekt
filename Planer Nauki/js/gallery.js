const STORAGE_FAV_KEY = 'smart-study-planner:favs:v1';
const STORAGE_FILTER_KEY = 'smart-study-planner:gallery-filter:v1';

/* Kategorie*/
const IMAGES = [
    {
        id: '1',
        caption: 'Małe kroki codziennie robią wielką różnicę.',
        category: 'motywacja',
    },
    {
        id: '2',
        caption: 'Najtrudniejszy jest start — potem już leci.',
        category: 'mindset',
    },
    {
        id: '3',
        caption: 'Zrób dziś coś, za co jutro sobie podziękujesz.',
        category: 'motywacja',
    },
    { id: '4', caption: 'Konsekwencja > motywacja.', category: 'dyscyplina' },
    {
        id: '5',
        caption: 'Dyscyplina to forma troski o siebie.',
        category: 'dyscyplina',
    },
    { id: '6', caption: 'Nie czekaj na idealny moment.', category: 'mindset' },
    {
        id: '7',
        caption: 'Skup się na procesie, nie tylko na celu.',
        category: 'nauka',
    },
    {
        id: '8',
        caption: 'Zrobione jest lepsze niż idealne.',
        category: 'nauka',
    },
    { id: '9', caption: 'Każdy dzień to nowa szansa.', category: 'mindset' },
    {
        id: '10',
        caption: 'Powtarzaj, aż stanie się łatwe.',
        category: 'dyscyplina',
    },
];

const CATEGORY_LABEL = {
    all: 'Wszystkie',
    nauka: 'Nauka',
    motywacja: 'Motywacja',
    mindset: 'Mindset',
    dyscyplina: 'Dyscyplina',
    favs: 'Tylko ulubione',
};

function imgHref(id, size) {
    return new URL(`../assets/gallery/${id}-${size}.jpg`, import.meta.url).href;
}

function escapeHtml(str) {
    return String(str).replace(
        /[&<>"']/g,
        (m) =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;',
            }[m])
    );
}

/*Favorites*/
function readFavs() {
    try {
        const raw = localStorage.getItem(STORAGE_FAV_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(arr)) return new Set();
        return new Set(arr.map(String));
    } catch {
        return new Set();
    }
}

function writeFavs(set) {
    try {
        localStorage.setItem(STORAGE_FAV_KEY, JSON.stringify([...set]));
    } catch {}
}

function isFav(id) {
    return favs.has(String(id));
}

function toggleFav(id) {
    const key = String(id);
    if (favs.has(key)) favs.delete(key);
    else favs.add(key);
    writeFavs(favs);
}

/*Filtry*/
function readFilter() {
    try {
        const v = localStorage.getItem(STORAGE_FILTER_KEY);
        return v || 'all';
    } catch {
        return 'all';
    }
}

function writeFilter(v) {
    try {
        localStorage.setItem(STORAGE_FILTER_KEY, v);
    } catch {}
}

let favs = readFavs();
let currentFilter = readFilter();

/* Lightbox (fullscreen)*/
let lightboxEl = null;
let lightboxImg = null;
let lightboxCaption = null;
let lightboxFavBtn = null;
let lightboxDownload = null;
let lightboxCounter = null;

let currentIndex = 0;
let currentList = [];

function ensureLightbox() {
    if (lightboxEl) return;

    const wrap = document.createElement('div');
    wrap.className = 'lightbox';
    wrap.hidden = true;
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');

    wrap.innerHTML = `
      <div class="lightbox__backdrop" data-action="close"></div>

      <div class="lightbox__panel" role="document">
        <button class="lightbox__btn lightbox__close" type="button" aria-label="Zamknij" data-action="close">✕</button>

        <button class="lightbox__btn lightbox__nav lightbox__prev" type="button" aria-label="Poprzednie" data-action="prev">‹</button>
        <button class="lightbox__btn lightbox__nav lightbox__next" type="button" aria-label="Następne" data-action="next">›</button>

        <div class="lightbox__topbar">
          <span class="lightbox__counter" id="lightboxCounter"></span>

          <div class="lightbox__topbar-right">
            <button class="lightbox__btn lightbox__fav" type="button" aria-label="Ulubione" data-action="fav">♡</button>
            <a class="lightbox__btn lightbox__download" data-action="download" href="#" download>Pobierz</a>
          </div>
        </div>

        <figure class="lightbox__figure">
          <img class="lightbox__img" alt="" decoding="async" />
          <figcaption class="lightbox__caption"></figcaption>
        </figure>
      </div>
    `;

    document.body.appendChild(wrap);

    lightboxEl = wrap;
    lightboxImg = wrap.querySelector('.lightbox__img');
    lightboxCaption = wrap.querySelector('.lightbox__caption');
    lightboxFavBtn = wrap.querySelector('.lightbox__fav');
    lightboxDownload = wrap.querySelector('.lightbox__download');
    lightboxCounter = wrap.querySelector('#lightboxCounter');

    wrap.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        const action = btn?.dataset?.action;
        if (!action) return;

        if (action === 'close') closeLightbox();
        if (action === 'prev') showPrev();
        if (action === 'next') showNext();
        if (action === 'fav') {
            const item = currentList[currentIndex];
            if (!item) return;
            toggleFav(item.id);
            syncLightboxFav();
            renderGallery();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (!lightboxEl || lightboxEl.hidden) return;

        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showPrev();
        if (e.key === 'ArrowRight') showNext();
    });
}

function syncLightboxFav() {
    const item = currentList[currentIndex];
    if (!item || !lightboxFavBtn) return;
    lightboxFavBtn.textContent = isFav(item.id) ? '♥' : '♡';
}

function setLightboxContent(index) {
    currentIndex = index;

    const item = currentList[currentIndex];
    if (!item) return;

    const src1200 = imgHref(item.id, 1200);

    lightboxImg.src = src1200;
    lightboxImg.alt = item.caption;
    lightboxCaption.textContent = item.caption;

    if (lightboxDownload) {
        lightboxDownload.href = src1200;
        lightboxDownload.setAttribute('download', `${item.id}-1200.jpg`);
    }

    if (lightboxCounter) {
        lightboxCounter.textContent = `${currentIndex + 1} / ${
            currentList.length
        }`;
    }

    syncLightboxFav();
}

function openLightbox(index) {
    ensureLightbox();
    setLightboxContent(index);

    lightboxEl.hidden = false;
    document.body.classList.add('is-lightbox-open');
}

function closeLightbox() {
    if (!lightboxEl) return;
    lightboxEl.hidden = true;
    document.body.classList.remove('is-lightbox-open');
    if (lightboxImg) lightboxImg.src = '';
}

function showPrev() {
    if (!currentList.length) return;
    const next = (currentIndex - 1 + currentList.length) % currentList.length;
    setLightboxContent(next);
}

function showNext() {
    if (!currentList.length) return;
    const next = (currentIndex + 1) % currentList.length;
    setLightboxContent(next);
}

function ensureFilterUI() {
    const view = document.getElementById('galleryView');
    if (!view) return;

    if (view.querySelector('#galleryControls')) return;

    const controls = document.createElement('div');
    controls.className = 'gallery-controls';
    controls.id = 'galleryControls';

    controls.innerHTML = `
      <div class="gallery-controls__row">
        <label class="label" for="galleryFilter">Filtr</label>
        <select id="galleryFilter" class="select" aria-label="Filtr galerii">
          <option value="all">${CATEGORY_LABEL.all}</option>
          <option value="nauka">${CATEGORY_LABEL.nauka}</option>
          <option value="motywacja">${CATEGORY_LABEL.motywacja}</option>
          <option value="mindset">${CATEGORY_LABEL.mindset}</option>
          <option value="dyscyplina">${CATEGORY_LABEL.dyscyplina}</option>
          <option value="favs">❤️ ${CATEGORY_LABEL.favs}</option>
        </select>
      </div>
      <p class="muted gallery-controls__hint" id="galleryHint"></p>
    `;

    const header = view.querySelector('.gallery-header');
    if (header?.nextSibling)
        header.parentNode.insertBefore(controls, header.nextSibling);
    else view.prepend(controls);

    const select = controls.querySelector('#galleryFilter');
    select.value = currentFilter;

    select.addEventListener('change', () => {
        currentFilter = select.value;
        writeFilter(currentFilter);
        renderGallery();
    });
}

function updateHint() {
    const hint = document.getElementById('galleryHint');
    if (!hint) return;

    const total = IMAGES.length;
    const shown = currentList.length;

    if (currentFilter === 'favs') {
        hint.textContent = shown
            ? `Ulubione: ${shown} / ${total}`
            : 'Brak ulubionych — kliknij ♥ przy zdjęciu.';
        return;
    }

    const label = CATEGORY_LABEL[currentFilter] || CATEGORY_LABEL.all;
    hint.textContent =
        currentFilter === 'all'
            ? `Wszystkie: ${shown} / ${total}`
            : `${label}: ${shown} / ${total}`;
}

/* Render galerii*/
function getFilteredList() {
    if (currentFilter === 'favs') {
        return IMAGES.filter((x) => isFav(x.id));
    }
    if (currentFilter === 'all') return IMAGES.slice();
    return IMAGES.filter((x) => x.category === currentFilter);
}

function buildFigure(item, index) {
    const fig = document.createElement('figure');
    fig.className = 'gallery-item';

    const src1200 = imgHref(item.id, 1200);
    const src480 = imgHref(item.id, 480);
    const fav = isFav(item.id);

    fig.innerHTML = `
      <div class="gallery-thumb">
        <img
          src="${src1200}"
          srcset="${src480} 480w, ${src1200} 1200w"
          sizes="(max-width: 1024px) 100vw, 50vw"
          alt="${escapeHtml(item.caption)}"
          loading="lazy"
          decoding="async"
        />
        <button class="gallery-fav" type="button" aria-label="Ulubione" data-id="${escapeHtml(
            item.id
        )}">
          ${fav ? '♥' : '♡'}
        </button>
        <span class="gallery-tag">${escapeHtml(
            CATEGORY_LABEL[item.category] || item.category
        )}</span>
      </div>

      <figcaption class="gallery-caption">${escapeHtml(
          item.caption
      )}</figcaption>
    `;

    const imgEl = fig.querySelector('img');
    imgEl?.addEventListener('click', () => openLightbox(index));

    const favBtn = fig.querySelector('.gallery-fav');
    favBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFav(item.id);

        favBtn.textContent = isFav(item.id) ? '♥' : '♡';

        renderGallery();
    });

    return fig;
}

export function renderGallery() {
    ensureFilterUI();

    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    currentList = getFilteredList();
    updateHint();

    grid.innerHTML = '';

    currentList.forEach((item, idx) => {
        const el = buildFigure(item, idx);
        grid.appendChild(el);

        requestAnimationFrame(() => {
            setTimeout(() => {
                el.classList.add('is-visible');
            }, idx * 60);
        });
    });

    if (lightboxEl && !lightboxEl.hidden) {
        if (!currentList.length) closeLightbox();
        else if (currentIndex >= currentList.length) setLightboxContent(0);
        else setLightboxContent(currentIndex);
    }
}
