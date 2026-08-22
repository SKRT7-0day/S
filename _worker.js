export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/user') {
      const userId = url.searchParams.get('id');

      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const BOT_TOKEN = 'YOUR_DISCORD_BOT_TOKEN_HERE'; 

      try {
        const discordResponse = await fetch(`https://discord.com/api/v9/users/${userId}`, {
          headers: {
            'Authorization': `Bot ${BOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await discordResponse.json();

        return new Response(JSON.stringify(data), {
          status: discordResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*' 
          }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};
