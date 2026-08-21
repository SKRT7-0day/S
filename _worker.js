export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // إعدادات الهيدرز للـ CORS لمنع حظر المتصفح للطلبات
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    // الاستجابة لطلبات المعاينة Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // معالجة مسار الشارات /discord-badges
    if (url.pathname === "/discord-badges") {
      const id = url.searchParams.get("id");

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing ID parameter" }),
          { status: 400, headers: corsHeaders }
        );
      }

      try {
        // جلب البيانات من ديسكورد (أو عبر البروكسي/الـ API الخاص بك)
        const response = await fetch(`https://discord.com/api/v9/users/${id}/profile`, {
          headers: {
            "Authorization": env.DISCORD_TOKEN || "", // توكن الحساب أو البوت المضاف في متغيرات البيئة
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
          }
        });

        if (!response.ok) {
          return new Response(
            JSON.stringify({ success: false, error: "Discord API returned status " + response.status }),
            { status: response.status, headers: corsHeaders }
          );
        }

        const data = await response.json();

        return new Response(JSON.stringify({ success: true, data }), {
          status: 200,
          headers: corsHeaders
        });

      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, error: err.message }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // توجيه باقي الطلبات للملفات العادية (index.html, badges.html, إلخ)
    return env.ASSETS.fetch(request);
  }
};

