import { NextResponse } from "next/server";

const DEFAULT_BASE_URL = "https://tazieff-eps.vercel.app";

export async function GET(request: Request) {
  const clientId = process.env.OAUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Missing OAUTH_CLIENT_ID" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") ?? "github";
  if (provider !== "github") {
    return NextResponse.json(
      { error: `Unsupported provider: ${provider}` },
      { status: 400 },
    );
  }

  const baseUrl = process.env.OAUTH_BASE_URL ?? DEFAULT_BASE_URL;
  const redirectUri = `${baseUrl}/callback`;
  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "repo,user");

  return NextResponse.redirect(authUrl.toString());
}
