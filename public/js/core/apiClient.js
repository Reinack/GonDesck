/**
 * apiClient.js
 * Wrapper de fetch con manejo uniforme de JSON, errores y autenticación.
 * Si el servidor responde 401, intenta llamar window.app?.showLogin?.()
 * automáticamente.
 *
 * Todos los métodos devuelven: { ok: boolean, data: any, error: string|null }
 */

export class ApiClient {

    /**
     * Método base interno.
     * @param {string} url
     * @param {RequestInit} options
     * @returns {Promise<{ ok: boolean, data: any, error: string|null }>}
     */
    async _request(url, options = {}) {
        try {
            const response = await fetch(url, options);

            // Manejar sesión expirada / no autenticado
            if (response.status === 401) {
                window.app?.showLogin?.();
                return { ok: false, data: null, error: 'No autenticado' };
            }

            // Intentar parsear el cuerpo como JSON
            let data = null;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch {
                    data = null;
                }
            } else {
                // Respuesta sin cuerpo JSON (204, etc.)
                data = null;
            }

            if (!response.ok) {
                const error = (data && data.error) ? data.error : `HTTP ${response.status}`;
                return { ok: false, data, error };
            }

            return { ok: true, data, error: null };

        } catch (err) {
            // Error de red u otro error inesperado
            return { ok: false, data: null, error: err.message || 'Error de red' };
        }
    }

    /**
     * GET request.
     * @param {string} url
     * @returns {Promise<{ ok: boolean, data: any, error: string|null }>}
     */
    get(url) {
        return this._request(url, { method: 'GET' });
    }

    /**
     * POST request con body JSON.
     * @param {string} url
     * @param {*} body  Objeto a serializar como JSON.
     * @returns {Promise<{ ok: boolean, data: any, error: string|null }>}
     */
    post(url, body) {
        return this._request(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    }

    /**
     * PUT request con body JSON.
     * @param {string} url
     * @param {*} body  Objeto a serializar como JSON.
     * @returns {Promise<{ ok: boolean, data: any, error: string|null }>}
     */
    put(url, body) {
        return this._request(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    }

    /**
     * DELETE request.
     * @param {string} url
     * @returns {Promise<{ ok: boolean, data: any, error: string|null }>}
     */
    delete(url) {
        return this._request(url, { method: 'DELETE' });
    }

    /**
     * PATCH request con body JSON.
     * @param {string} url
     * @param {*} body  Objeto a serializar como JSON.
     * @returns {Promise<{ ok: boolean, data: any, error: string|null }>}
     */
    patch(url, body) {
        return this._request(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    }
}

/** Instancia lista para usar en toda la app. */
export const api = new ApiClient();
