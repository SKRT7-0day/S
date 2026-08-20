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
    // قراءة التوكن سواء كان Secrets Store أو Variable عادي
    let token = env.DISCORD_TOKEN;
    if (token && typeof token === 'object' && typeof token.get === 'function') {
      token = await token.get('DISCORD_TOKEN') || await token.get();
    }

    if (!token) {
      return new Response(JSON.stringify({ error: 'DISCORD_TOKEN is missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const discordRes = await fetch(`https://discord.com/api/v9/users/${userId}/profile`, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    });

    if (!discordRes.ok) {
      return new Response(JSON.stringify({ error: `Discord API error: ${discordRes.status}` }), {
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
