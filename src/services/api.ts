import { dispatchLocalApiRequest, LocalApiError } from './storage/apiEngine';

let activeSessionToken: string | null = null;

export function setAccessToken(token: string | null) {
  activeSessionToken = token;
}

export function getAccessToken() {
  return activeSessionToken;
}

interface RequestOptions {
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export const api = {
  get: (url: string, config?: RequestOptions) =>
    dispatchLocalApiRequest({
      method: 'GET',
      url,
      queryParams: config?.params,
      activeToken: activeSessionToken,
    }),
  post: (url: string, data?: any, config?: RequestOptions) =>
    dispatchLocalApiRequest({
      method: 'POST',
      url,
      body: data,
      queryParams: config?.params,
      activeToken: activeSessionToken,
    }),
  put: (url: string, data?: any, config?: RequestOptions) =>
    dispatchLocalApiRequest({
      method: 'PUT',
      url,
      body: data,
      queryParams: config?.params,
      activeToken: activeSessionToken,
    }),
  patch: (url: string, data?: any, config?: RequestOptions) =>
    dispatchLocalApiRequest({
      method: 'PATCH',
      url,
      body: data,
      queryParams: config?.params,
      activeToken: activeSessionToken,
    }),
  delete: (url: string, config?: RequestOptions) =>
    dispatchLocalApiRequest({
      method: 'DELETE',
      url,
      queryParams: config?.params,
      activeToken: activeSessionToken,
    }),
};

export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof LocalApiError) {
    return err.response.data.message || err.message || fallback;
  }
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as any).response;
    if (resp?.data?.message) return String(resp.data.message);
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
