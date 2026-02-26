import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'axolotly_token';

interface TokenPayload {
  sub: string;
  role: 'parent' | 'kid';
  is_admin?: boolean;
  exp: number;
}

export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getUserFromToken(): TokenPayload | null {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    if (decoded.exp * 1000 < Date.now()) {
      removeToken();
      return null;
    }
    return decoded;
  } catch {
    removeToken();
    return null;
  }
}
