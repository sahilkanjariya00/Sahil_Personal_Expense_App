import { KEY } from "./constants";

export const createQueryUrl = (url: string, params: Record<string, any>): string => {
const keys = Object.keys(params);
  
  if (keys.length === 0) {
    return url;
  }

  const queryStringParts: string[] = [];

  keys.forEach(key => {
    const encodedKey = encodeURIComponent(key);
    const encodedValue = encodeURIComponent(params[key]);
    queryStringParts.push(`${encodedKey}=${encodedValue}`);
  });

  const queryString = queryStringParts.join('&');

  const separator = url.includes('?') ? '&' : '?';

  return `${url}${separator}${queryString}`;
}

export const formatINR = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

export function getToken(): string | null {
  return localStorage.getItem(KEY);
}
export function setToken(token: string) {
  localStorage.setItem(KEY, token);
}
export function clearToken() {
  localStorage.removeItem(KEY);
}
export function isLoggedIn(): boolean {
  return !!getToken();
}

