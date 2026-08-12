const API_BASE_URL = 'http://localhost:5000/api';

const buildHeaders = (token?: string, isJson = true) => {
  const headers = new Headers();

  if (isJson) {
    headers.append('Content-Type', 'application/json');
  }

  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  return headers;
};

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
  isJson = true
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: buildHeaders(token, isJson)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed.' }));
    throw new Error(error.message || 'Request failed.');
  }

  return response.json() as Promise<T>;
};

export { API_BASE_URL };
