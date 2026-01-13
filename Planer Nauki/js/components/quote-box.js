import { fetchQuote } from '../api.js';

class QuoteBox extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.state = { loading: true, error: null, content: '', author: '' };
    }

    connectedCallback() {
        this.render();
        this.load();
    }

    async load() {
        this.setState({ loading: true, error: null });
        try {
            const q = await fetchQuote();
            this.setState({
                loading: false,
                content: q.content,
                author: q.author,
            });
        } catch (e) {
            this.setState({
                loading: false,
                error: 'Nie udało się pobrać cytatu.',
            });
        }
    }

    setState(next) {
        this.state = { ...this.state, ...next };
        this.render();
    }

    render() {
        const { loading, error, content, author } = this.state;

        this.shadowRoot.innerHTML = `
      <style>
        .box{ display:flex; flex-direction:column; gap:10px; }
        .quote{ margin:0; font-size: 14px; line-height: 1.5; }
        .author{ margin:0; color: var(--muted); font-size: 12px; }
        button{
          align-self:flex-start;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text);
          padding: 10px 12px;
          border-radius: 12px;
          cursor:pointer;
          transition: transform 140ms ease;
        }
        button:hover{ transform: translateY(-1px); }
      </style>

      <div class="box">
        ${loading ? `<p class="author">Ładowanie cytatu…</p>` : ``}
        ${error ? `<p class="author">${error}</p>` : ``}
        ${
            !loading && !error
                ? `<p class="quote">“${escapeHtml(
                      content
                  )}”</p><p class="author">— ${escapeHtml(author)}</p>`
                : ``
        }
        <button id="refresh" type="button">Nowy cytat</button>
      </div>
    `;

        this.shadowRoot
            .getElementById('refresh')
            ?.addEventListener('click', () => this.load());
    }
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

customElements.define('quote-box', QuoteBox);
