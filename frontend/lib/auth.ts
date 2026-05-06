export interface JwtPayload {
  sub?: string;
  preferred_username?: string;
  email?: string;
  exp?: number;
  iat?: number;
}

export function parseJwt(token: string): JwtPayload {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

export function getUsernameFromToken(token: string | null): string {
  if (!token) return "Player";
  const payload = parseJwt(token);
  return payload.preferred_username || payload.sub || "Player";
}
