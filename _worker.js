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
    let token = env.DISCORD_TOKEN;
    if (token && typeof token === 'object' && typeof token.get === 'function') {
      token = await token.get('DISCORD_TOKEN') || await token.get();
    }

    const discordRes = await fetch(`https://discord.com/api/v10/users/${userId}`, {
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

    const user = await discordRes.json();
    const flags = user.public_flags || 0;

    const badgeMap = [
      { flag: 1 << 0, name: 'Discord Staff', icon: 'discord_employee' },
      { flag: 1 << 1, name: 'Partnered Server Owner', icon: 'discord_partner' },
      { flag: 1 << 2, name: 'HypeSquad Events', icon: 'hypesquad_events' },
      { flag: 1 << 3, name: 'Bug Hunter Level 1', icon: 'bug_hunter_level_1' },
      { flag: 1 << 6, name: 'HypeSquad Bravery', icon: 'hypesquad_bravery' },
      { flag: 1 << 7, name: 'HypeSquad Brilliance', icon: 'hypesquad_brilliance' },
      { flag: 1 << 8, name: 'HypeSquad Balance', icon: 'hypesquad_balance' },
      { flag: 1 << 9, name: 'Early Supporter', icon: 'early_supporter' },
      { flag: 1 << 14, name: 'Bug Hunter Level 2', icon: 'bug_hunter_level_2' },
      { flag: 1 << 17, name: 'Early Verified Bot Developer', icon: 'early_verified_bot_developer' },
      { flag: 1 << 18, name: 'Active Developer', icon: 'active_developer' },
    ];

    const badges = badgeMap
      .filter(b => (flags & b.flag) === b.flag)
      .map(b => ({
        description: b.name,
        iconUrl: `https://cdn.discordapp.com/badge-icons/${b.icon}.png`,
      }));

    return new Response(JSON.stringify({
      username: user.global_name || user.username,
      avatar: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith('a_') ? 'gif' : 'png'}`
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
