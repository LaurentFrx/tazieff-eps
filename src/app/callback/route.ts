const DEFAULT_BASE_URL = "https://tazieff-eps.vercel.app";

function buildAuthResponse(params: {
  provider: string;
  token?: string;
  error?: string;
}) {
  const { provider, token, error } = params;
  const payload = error
    ? `authorization:${provider}:error:${JSON.stringify({ error })}`
    : `authorization:${provider}:success:${JSON.stringify({ token, provider })}`;

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Authentification</title>
  </head>
  <body>
    <script>
      (function () {
        function sendMessage(origin) {
          window.opener.postMessage(${JSON.stringify(payload)}, origin);
        }

        function receiveMessage(event) {
          sendMessage(event.origin);
          window.removeEventListener("message", receiveMessage, false);
          window.close();
        }

        window.addEventListener("message", receiveMessage, false);
        window.opener.postMessage("authorizing:${provider}", "*");
      })();
    </script>
  </body>
</html>`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") ?? "github";
  const code = searchParams.get("code");

  if (!code) {
    return new Response(buildAuthResponse({ provider, error: "Missing code." }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 400,
    });
  }

  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response(
      buildAuthResponse({ provider, error: "Missing OAuth env vars." }),
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
        status: 500,
      },
    );
  }

  const baseUrl = process.env.OAUTH_BASE_URL ?? DEFAULT_BASE_URL;
  const redirectUri = `${baseUrl}/callback`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  const data = (await tokenResponse.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenResponse.ok || !data.access_token) {
    const message = data.error_description ?? data.error ?? "OAuth failed.";
    return new Response(buildAuthResponse({ provider, error: message }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 400,
    });
  }

  return new Response(
    buildAuthResponse({ provider, token: data.access_token }),
    {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}
