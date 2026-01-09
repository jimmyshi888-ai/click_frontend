<template>
  <div class="login-page">
    <div class="card">
      <h2 class="title">{{ isLoginMode ? '歡迎回來' : '新玩家註冊' }}</h2>

      <form @submit.prevent="handleSubmit">
        <div class="form-group" v-if="!isLoginMode">
          <label>玩家暱稱</label>
          <input v-model="form.username" type="text" placeholder="例如：點點大師" :required="!isLoginMode" />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" placeholder="輸入信箱" required />
        </div>

        <div class="form-group">
          <label>密碼</label>
          <input v-model="form.password" type="password" placeholder="至少 6 個字元" required />
          <small v-if="!isLoginMode" class="hint">密碼長度需大於 6 碼</small>
        </div>

        <button type="submit" :disabled="isLoading" class="btn-primary">
          {{ isLoading ? '處理中...' : (isLoginMode ? '登入遊戲' : '註冊帳號') }}
        </button>
      </form>

      <p class="switch-mode">
        {{ isLoginMode ? '還沒有帳號嗎？' : '已經有帳號了？' }}
        <span @click="toggleMode">{{ isLoginMode ? '點此註冊' : '點此登入' }}</span>
      </p>

      <p v-if="message" :class="['message', isError ? 'error' : 'success']">
        {{ message }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { api } from '@/api'; 
import { useRouter } from 'vue-router'; 
import { useUserStore } from '@/store.js';

const router = useRouter();
const userStore = useUserStore();

const isLoginMode = ref(true); 
const isLoading = ref(false);
const message = ref('');
const isError = ref(false);

const form = reactive({ username: '', email: '', password: '' });

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value;
  message.value = ''; 
  isError.value = false;
};

const validateForm = () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(form.email)) return '請輸入正確的 Email 格式';
  if (form.password.length < 6) return '密碼長度至少需要 6 個字元';
  if (!isLoginMode.value && !form.username.trim()) return '請輸入玩家暱稱';
  return null;
};

const handleSubmit = async () => {
  message.value = '';
  isError.value = false;
  const validationError = validateForm();
  if (validationError) {
    isError.value = true;
    message.value = validationError;
    return;
  }
  isLoading.value = true;
  try {
    let result;
    if (isLoginMode.value) {
      result = await api.login(form.email, form.password);
      userStore.login(result.user);
      // alert(`歡迎回來，${result.user.username}！`); // 覺得煩可以註解掉
      router.push('/game'); 
    } else {
      result = await api.register(form.username, form.email, form.password);
      message.value = '註冊成功！請切換到登入頁面進行登入。';
      setTimeout(() => { 
        isLoginMode.value = true; 
        form.password = ''; 
      }, 1500);
    }
  } catch (error) {
    isError.value = true;
    if (isLoginMode.value) {
      message.value = '帳號或密碼錯誤'; 
    } else {
      message.value = error.message;
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-page { 
  display: flex; 
  justify-content: center; 
  align-items: center; /* 垂直置中 */
  min-height: 80vh; /* 確保高度足夠 */
  padding: 20px;
}

.card {
  background: white; 
  /* ★ 1. 寬度加大 */
  width: 100%; 
  max-width: 480px; /* 原本是 350px */
  
  /* ★ 2. 內距加大 */
  padding: 3rem; /* 原本是 2rem */
  
  border-radius: 30px;
  text-align: center;
  
  /* ★ 3. 增加遊戲風格邊框與陰影 */
  border: 4px solid #000;
  box-shadow: 10px 10px 0 rgba(0,0,0,0.2);
}

.title {
  /* ★ 4. 標題加大 */
  font-size: 2.5rem;
  margin-bottom: 30px;
  color: #333;
  font-weight: 900;
}

.form-group { 
  margin-bottom: 25px; 
  text-align: left; 
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 1.1rem; /* 標籤字體加大 */
  color: #555;
}

input { 
  width: 100%; 
  /* ★ 5. 輸入框加大 */
  padding: 15px; 
  font-size: 1.1rem;
  
  border: 2px solid #ccc; 
  border-radius: 12px; 
  box-sizing: border-box; 
  transition: border-color 0.3s;
}

input:focus {
  border-color: #4CAF50;
  outline: none;
}

.hint {
  color: #888;
  font-size: 0.9rem;
  margin-top: 5px;
  display: block;
}

.btn-primary {
  width: 100%; 
  /* ★ 6. 按鈕加大 */
  padding: 15px; 
  font-size: 1.3rem;
  font-weight: bold;
  
  background-color: #4CAF50; 
  color: white;
  border: 3px solid #000; /* 增加邊框 */
  border-radius: 50px; 
  cursor: pointer; 
  margin-top: 20px;
  box-shadow: 0 4px 0 #2e7d32; /* 按鈕立體感 */
  transition: all 0.1s;
}

.btn-primary:hover {
  background-color: #45a049;
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 #2e7d32;
}

.btn-primary:disabled { 
  background-color: #ccc; 
  border-color: #999;
  box-shadow: none;
  cursor: not-allowed; 
}

.switch-mode { 
  margin-top: 25px; 
  font-size: 1rem; 
}

.switch-mode span { 
  color: #4CAF50; 
  cursor: pointer; 
  font-weight: bold; 
  text-decoration: underline; 
  margin-left: 5px;
}

.message { 
  margin-top: 20px; 
  font-weight: bold; 
  padding: 15px; 
  border-radius: 10px; 
  font-size: 1rem;
}
.success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
</style>