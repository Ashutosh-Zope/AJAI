const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function req(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  auth: {
    login: (email, password) => req('api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email, password, name) => req('api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  },
  documents: {
    list: () => req('/documents'),
    get: (id) => req(`/documents/${id}`),
    create: (data) => req('/documents', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => req(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => req(`/documents/${id}`, { method: 'DELETE' }),
    share: (id, email, permission) => req(`/documents/${id}/share`, { method: 'POST', body: JSON.stringify({ email, permission }) }),
    unshare: (id, userId) => req(`/documents/${id}/share/${userId}`, { method: 'DELETE' }),
    users: (id) => req(`/documents/${id}/users`),
  },
  upload: {
    import: (file) => {
      const fd = new FormData();
      fd.append('file', file);
      return req('/upload/import', { method: 'POST', body: fd });
    },
    attach: (docId, file) => {
      const fd = new FormData();
      fd.append('file', file);
      return req(`/upload/attach/${docId}`, { method: 'POST', body: fd });
    },
  },
};
