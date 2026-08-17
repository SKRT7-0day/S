// This runs in front of your static site. Any request that doesn't match
// a special route below (like /api/discord-badges) gets served exactly as
// before — index.html, oneko.js, badges.html, everything — no change to
// your existing site at all.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/discord-badges') {
      return handleDiscordBadges(request, env);
    }

    // Everything else: serve the static files exactly like before.
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
    const botToken = await env.DISCORD_BOT_TOKEN.get();
    const discordRes = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!discordRes.ok) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const user = await discordRes.json();
    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith('a_') ? 'gif' : 'png'}`
      : null;

    return new Response(JSON.stringify({
      username: user.global_name || user.username,
      avatar: avatarUrl,
      public_flags: user.public_flags || 0,
      premium_type: user.premium_type || 0,
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Lookup failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
