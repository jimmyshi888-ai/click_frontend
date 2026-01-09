const BASE_URL = 'https://click-backend-3cpi.onrender.com'; 

export const api = {
  // 註冊
  async register(username, email, password) {
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    return handleResponse(res);
  },

  // 登入
  async login(email, password) {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  // 更新分數
  async updateScore(userId, coins, total_clicks) {
    const res = await fetch(`${BASE_URL}/api/update-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, coins, total_clicks })
    });
    return handleResponse(res);
  },

  // ★ 新增：抽獎 (必須放在 api 物件的大括號裡面)
  async gacha(userId, count = 1) {
    const res = await fetch(`${BASE_URL}/api/gacha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, count }) // 傳送次數
    });
    return handleResponse(res);
  },
  // ★ 新增：取得背包 (之前 server.js 有加，但 api.js 可能還沒寫)
  async getInventory(userId) {
    const res = await fetch(`${BASE_URL}/api/inventory/${userId}`);
    return handleResponse(res);
  },

  // ★ 新增：合成
  async synthesize(userId, materialIds) {
    const res = await fetch(`${BASE_URL}/api/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, materialIds })
    });
    return handleResponse(res);
  },
  // ★ 新增：取得排行榜
  async getLeaderboard() {
    const res = await fetch(`${BASE_URL}/api/leaderboard`);
    return handleResponse(res);
  },

  // ★ 新增：領取全服獎勵
  async claimGlobalReward(userId,target) {
    const res = await fetch(`${BASE_URL}/api/claim-global-reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId,target })
    });
    return handleResponse(res);
  }
};

// 輔助函式 (放在最外面)
async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '連線錯誤');
  return data;
}