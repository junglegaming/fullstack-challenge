import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    // Exchange code for token with Keycloak
    const tokenResponse = await fetch(
      "http://localhost:8080/realms/crash-game/protocol/openid-connect/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: "crash-game-client",
          code,
          redirect_uri: "http://localhost:3002/api/auth/callback",
        }),
      },
    );

    if (!tokenResponse.ok) {
      throw new Error("Token exchange failed");
    }

    const tokens = await tokenResponse.json();

    // Create response with redirect
    const response = NextResponse.redirect(new URL("/game", request.url));

    // Store tokens in localStorage (client-side) via a cookie that JS can read
    response.cookies.set("kc_token", tokens.access_token, {
      httpOnly: false,
      maxAge: tokens.expires_in,
      path: "/",
    });
    response.cookies.set("kc_refresh", tokens.refresh_token, {
      httpOnly: false,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
