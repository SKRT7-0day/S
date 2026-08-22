const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Discord Badges Lookup</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --bg-color: #0f1117;
      --card-bg: rgba(23, 27, 38, 0.7);
      --border-color: rgba(255, 255, 255, 0.08);
      --accent-color: #5865F2;
      --text-main: #ffffff;
      --text-sub: #949ba4;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    body {
      background-color: var(--bg-color);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      background-image: radial-gradient(circle at 50% 0%, rgba(88, 101, 242, 0.15), transparent 50%);
    }

    .container {
      width: 100%;
      max-width: 420px;
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }

    .search-box {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .search-box input {
      flex: 1;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 12px 16px;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: 0.3s;
    }

    .search-box input:focus {
      border-color: var(--accent-color);
      box-shadow: 0 0 10px rgba(88, 101, 242, 0.3);
    }

    .search-box button {
      background: var(--accent-color);
      border: none;
      border-radius: 12px;
      padding: 0 18px;
      color: #fff;
      cursor: pointer;
      font-size: 14px;
      transition: 0.2s;
    }

    .search-box button:hover {
      opacity: 0.9;
      transform: scale(0.98);
    }

    .profile-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .avatar-wrapper {
      position: relative;
      margin-bottom: 15px;
    }

    .avatar {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.1);
      object-fit: cover;
    }

    .username {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .user-tag {
      font-size: 13px;
      color: var(--text-sub);
      margin-bottom: 16px;
    }

    .badges-container {
      width: 100%;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
      padding: 14px;
      border: 1px solid var(--border-color);
      margin-top: 10px;
    }

    .badges-title {
      font-size: 12px;
      color: var(--text-sub);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      text-align: left;
    }

    .badges-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
    }

    .badge-item {
      background: rgba(255, 255, 255, 0.05);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .status-msg {
      padding: 20px;
      color: var(--text-sub);
      font-size: 14px;
    }

    .error-msg {
      color: #ed4245;
    }

    .loader {
      border: 3px solid rgba(255,255,255,0.1);
      border-radius: 50%;
      border-top: 3px solid var(--accent-color);
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
      margin: 10px auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="search-box">
      <input type="text" id="userIdInput" placeholder="Enter Discord User ID" value="1217944125555474565">
      <button onclick="fetchUserData()"><i class="fa-solid fa-magnifying-glass"></i></button>
    </div>

    <div id="displayArea" class="profile-card">
      <div class="status-msg">Click search to load profile</div>
    </div>
  </div>

  <script>
    const BADGES_MAP = {
      1: { name: "Discord Staff", icon: "fa-solid fa-shield-cat" },
      2: { name: "Partnered Server Owner", icon: "fa-solid fa-handshake" },
      4: { name: "HypeSquad Events", icon: "fa-solid fa-burst" },
      8: { name: "Bug Hunter Level 1", icon: "fa-solid fa-bug" },
      64: { name: "House Bravery", icon: "fa-solid fa-shield-halved" },
      128: { name: "House Brilliance", icon: "fa-solid fa-gem" },
      256: { name: "House Balance", icon: "fa-solid fa-scale-balanced" },
      512: { name: "Early Supporter", icon: "fa-solid fa-piggy-bank" },
      16384: { name: "Bug Hunter Level 2", icon: "fa-solid fa-file-code" },
      131072: { name: "Verified Developer", icon: "fa-solid fa-code" },
      4194304: { name: "Active Developer", icon: "fa-solid fa-terminal" }
    };

    function getBadges(flags) {
      let userBadges = [];
      for (let flag in BADGES_MAP) {
        if ((flags & flag) == flag) {
          userBadges.push(BADGES_MAP[flag]);
        }
      }
      return userBadges;
    }

    async function fetchUserData() {
      const userId = document.getElementById('userIdInput').value.trim();
      const displayArea = document.getElementById('displayArea');

      if (!userId) {
        displayArea.innerHTML = \`<div class="status-msg error-msg">Please enter a valid User ID</div>\`;
        return;
      }

      displayArea.innerHTML = \`<div class="loader"></div>\`;

      try {
        const response = await fetch(\`/api/user?id=\${userId}\`);
        
        if (!response.ok) throw new Error("User not found or API error");
        
        const data = await response.json();

        const avatarUrl = data.avatar 
          ? \`https://cdn.discordapp.com/avatars/\${data.id}/\${data.avatar}.png?size=256\`
          : \`https://cdn.discordapp.com/embed/avatars/\${(data.id >> 22) % 6}.png\`;

        const badges = getBadges(data.public_flags || 0);

        let badgesHTML = badges.length > 0 
          ? badges.map(b => \`<div class="badge-item"><i class="\${b.icon}"></i> \${b.name}</div>\`).join('')
          : \`<div class="status-msg">No Public Badges</div>\`;

        displayArea.innerHTML = \`
          <div class="avatar-wrapper">
            <img class="avatar" src="\${avatarUrl}" alt="Avatar">
          </div>
          <div class="username">\${data.global_name || data.username}</div>
          <div class="user-tag">@\${data.username} • ID: \${data.id}</div>
          
          <div class="badges-container">
            <div class="badges-title">Public Badges (\${badges.length})</div>
            <div class="badges-grid">\${badgesHTML}</div>
          </div>
        \`;

      } catch (err) {
        displayArea.innerHTML = \`<div class="status-msg error-msg">Failed to fetch user data</div>\`;
      }
    }

    window.onload = fetchUserData;
  </script>
</body>
</html>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/badges' || url.pathname === '/') {
      return new Response(HTML_CONTENT, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

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

