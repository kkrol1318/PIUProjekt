class TaskCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['title', 'duedate', 'priority', 'type', 'done'];
    }

    attributeChangedCallback() {
        this.render();
    }

    connectedCallback() {
        this.render();
        this.shadowRoot.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            this.dispatchEvent(
                new CustomEvent(btn.dataset.action, {
                    bubbles: true,
                    detail: { id: this.dataset.id },
                })
            );
        });
    }

    render() {
        const title = this.getAttribute('title') ?? '';
        const due = this.getAttribute('duedate') ?? '';
        const priority = this.getAttribute('priority') ?? 'medium';
        const type = this.getAttribute('type') ?? 'homework';
        const done = this.getAttribute('done') === 'true';

        const badge =
            priority === 'high'
                ? 'High'
                : priority === 'low'
                ? 'Low'
                : 'Medium';

        this.shadowRoot.innerHTML = `
      <style>
        .wrap{
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px;
          background: var(--card);
          display:flex;
          gap:12px;
          justify-content: space-between;
          align-items: flex-start;
        }
        .left{ min-width: 0; }
        .title{
          margin:0;
          font-weight: 650;
          text-decoration: ${done ? 'line-through' : 'none'};
          opacity: ${done ? '0.7' : '1'};
          word-break: break-word;
        }
        .meta{
          margin:6px 0 0;
          color: var(--muted);
          font-size: 12px;
          display:flex;
          gap:10px;
          flex-wrap: wrap;
        }
        .pill{
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 2px 8px;
        }
        .actions{ display:flex; gap:8px; }
        button{
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text);
          border-radius: 10px;
          padding: 8px 10px;
          cursor:pointer;
          transition: transform 140ms ease;
        }
        button:hover{ transform: translateY(-1px); }
      </style>

      <div class="wrap">
        <div class="left">
          <p class="title">${escapeHtml(title)}</p>
          <div class="meta">
            <span class="pill">Priorytet: ${badge}</span>
            <span class="pill">Typ: ${escapeHtml(type)}</span>
            ${due ? `<span class="pill">Termin: ${escapeHtml(due)}</span>` : ``}
          </div>
        </div>

        <div class="actions">
          <button data-action="toggleDone" title="Zrobione">✅</button>
          <button data-action="delete" title="Usuń">🗑️</button>
        </div>
      </div>
    `;
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

customElements.define('task-card', TaskCard);
