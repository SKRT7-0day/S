export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/discord-badges') {
      return handleDiscordBadges(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleDiscordBadges(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  }

  if (request.method !== 'GET') {
    return new Response('Not found', { status: 404 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('id');
  if (!userId || !/^\d{15,25}$/.test(userId)) {
    return new Response(JSON.stringify({ error: 'Invalid user ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    // جلب التوكن باستخدام الاسم الجديد DC_ACCOUNT_TOKEN
    let token = env.DC_ACCOUNT_TOKEN;
    if (token && typeof token === 'object' && typeof token.get === 'function') {
      token = await token.get('DC_ACCOUNT_TOKEN') || await token.get();
    }

    if (!token) {
      return new Response(JSON.stringify({ error: 'DC_ACCOUNT_TOKEN is missing in Cloudflare' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const discordRes = await fetch(`https://discord.com/api/v9/users/${userId}/profile`, {
      headers: {
        'Authorization': token.trim(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9028 Chrome/120.0.6099.291 Electron/28.2.10 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      return new Response(JSON.stringify({ error: `Discord API Error ${discordRes.status}: ${errText}` }), {
        status: discordRes.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const data = await discordRes.json();

    const badges = (data.badges || []).map(b => ({
      id: b.id,
      description: b.description,
      iconUrl: `https://cdn.discordapp.com/badge-icons/${b.icon}.png`,
    }));

    return new Response(JSON.stringify({
      username: data.user.global_name || data.user.username,
      avatar: data.user.avatar
        ? `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.${data.user.avatar.startsWith('a_') ? 'gif' : 'png'}`
        : null,
      badges: badges,
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

