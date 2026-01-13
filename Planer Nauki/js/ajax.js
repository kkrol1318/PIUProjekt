export class Ajax {
    constructor(options = {}) {
        const defaults = {
            baseURL: '',
            headers: {
                Accept: 'application/json',
            },
            timeout: 5000,
        };

        this.options = {
            ...defaults,
            ...options,
            headers: { ...defaults.headers, ...(options.headers ?? {}) },
        };
    }

    async get(url, options) {
        return this.#request('GET', url, null, options);
    }

    async post(url, data, options) {
        return this.#request('POST', url, data, options);
    }

    async put(url, data, options) {
        return this.#request('PUT', url, data, options);
    }

    async delete(url, options) {
        return this.#request('DELETE', url, null, options);
    }

    async #request(method, url, data, options = {}) {
        const merged = this.#mergeOptions(options);
        const controller = new AbortController();
        const timeoutMs = merged.timeout ?? this.options.timeout;

        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const fullUrl = this.#buildUrl(url, merged.baseURL);

            const init = {
                method,
                headers: merged.headers,
                signal: controller.signal,
            };

            if (data !== null && data !== undefined) {
                init.headers = {
                    'Content-Type': 'application/json',
                    ...init.headers,
                };
                init.body = JSON.stringify(data);
            }

            const res = await fetch(fullUrl, init);

            if (!res.ok) {
                const msg = await this.#safeReadError(res);
                throw new Error(msg || `Błąd HTTP: ${res.status}`);
            }

            // 204 No Content
            if (res.status === 204) return null;

            const text = await res.text();
            if (!text) return null;
            return JSON.parse(text);
        } catch (err) {
            if (err?.name === 'AbortError') {
                throw new Error('Przekroczono limit czasu (timeout)');
            }
            throw err instanceof Error ? err : new Error('Błąd sieci');
        } finally {
            clearTimeout(timeoutId);
        }
    }

    #mergeOptions(perCall) {
        return {
            ...this.options,
            ...perCall,
            headers: { ...this.options.headers, ...(perCall.headers ?? {}) },
        };
    }

    #buildUrl(url, baseURL) {
        if (/^https?:\/\//i.test(url)) return url;
        const base = baseURL ?? '';
        if (!base) return url;
        return base.replace(/\/$/, '') + '/' + url.replace(/^\//, '');
    }

    async #safeReadError(res) {
        try {
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
                const j = await res.json();
                return j?.message || j?.error || j?.detail || '';
            }
            return (await res.text())?.slice(0, 200) || '';
        } catch {
            return '';
        }
    }
}
