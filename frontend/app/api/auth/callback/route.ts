import { NextRequest, NextResponse } from "next/server";

const KEYCLOAK_URL =
  process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080";
const REALM = "crash-game";
const CLIENT_ID = "crash-game-client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("OIDC error:", error, searchParams.get("error_description"));
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Read PKCE verifier from cookie
  const verifier = request.cookies.get("pkce_verifier")?.value;

  if (!verifier) {
    console.error("Missing PKCE verifier cookie");
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(
      `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: CLIENT_ID,
          code,
          redirect_uri: new URL("/api/auth/callback", request.url).toString(),
          code_verifier: verifier,
        }),
      },
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      throw new Error("Token exchange failed");
    }

    const tokens = await tokenResponse.json();
    const expiresAt = Date.now() + tokens.expires_in * 1000;

    // Build HTML that stores tokens in localStorage and redirects
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Authenticating...</title>
  <script>
    localStorage.setItem('kc_token', ${JSON.stringify(tokens.access_token)});
    localStorage.setItem('kc_refresh', ${JSON.stringify(tokens.refresh_token)});
    localStorage.setItem('kc_expiry', ${JSON.stringify(expiresAt.toString())});
    ${tokens.id_token ? `localStorage.setItem('kc_id_token', ${JSON.stringify(tokens.id_token)});` : ""}
    // Clear verifier cookie
    document.cookie = 'pkce_verifier=; path=/api/auth/callback; max-age=0';
    // Set auth cookie for middleware
    document.cookie = 'kc_auth=true; path=/; max-age=${60 * 60 * 24 * 30}';
    window.location.href = '/game';
  </script>
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>`;

    const response = new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });

    // Also set auth cookie server-side (not httpOnly)
    response.cookies.set("kc_auth", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
    });

    return response;
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
