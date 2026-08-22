export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/user') {
      const userId = url.searchParams.get('id');

      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // جلب التوكن تلقائياً من ملف المتغيرات أو إعدادات Cloudflare
      const BOT_TOKEN = env.BOT_TOKEN;

      if (!BOT_TOKEN)
        return new Response(JSON.stringify({ error: 'BOT_TOKEN is missing in environment' }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      try {
        const response = await fetch(`https://discord.com/api/v9/users/1217944125555474565/badges`, {
          headers: {
            'Authorization': `Bot ${BOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    return env.ASSETS ? env.ASSETS.fetch(request) : fetch(request);
  }
};
