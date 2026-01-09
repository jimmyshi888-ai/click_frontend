import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  // 1. 狀態：存使用者的資料
  const user = ref(null);
  const isLoggedIn = ref(false); // 判斷是否登入

  // 2. 動作：登入
  function login(userData) {
    user.value = userData;
    isLoggedIn.value = true;
    // (進階) 這裡可以把資料存入 localStorage，這樣重新整理網頁才不會被登出
    localStorage.setItem('user', JSON.stringify(userData));
  }

  // 3. 動作：登出
  function logout() {
    user.value = null;
    isLoggedIn.value = false;
    localStorage.removeItem('user');
  }

  // 4. 初始化檢查 (重新整理網頁時，檢查有沒有舊的登入紀錄)
  function checkLogin() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      user.value = JSON.parse(storedUser);
      isLoggedIn.value = true;
    }
  }

  return { user, isLoggedIn, login, logout, checkLogin };
});