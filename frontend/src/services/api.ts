const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

const getApiUrl = (path: string) => {
  // @ts-ignore
  const baseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5001';
  return `${baseUrl}${path}`;
};

export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const headers = { ...getHeaders(), ...options.headers };
  const config = { ...options, headers };

  let response = await fetch(getApiUrl(url), config);

  // If token is expired, try to refresh once
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(getApiUrl('/api/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: refreshToken }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem('accessToken', data.accessToken);
          
          // Retry original request with new token
          const retryHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.accessToken}`,
          };
          response = await fetch(url, { ...options, headers: retryHeaders });
        } else {
          // Refresh failed, clear session
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } catch (err) {
        console.error('Session refresh failed:', err);
      }
    }
  }

  // Handle errors
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};
