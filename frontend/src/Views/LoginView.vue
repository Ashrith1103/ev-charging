<template>
  <div class="auth-page">
    <div class="auth-bg">
      <div class="grid-lines"></div>
    </div>

    <div class="auth-card">
      <div class="brand">
        <div class="brand-icon">⚡</div>
        <h1 class="brand-name">EVCHARGE</h1>
        <p class="brand-sub">{{ loginAsExecutive ? 'Executive Login' : 'Customer Login' }}</p>
      </div>

      <form class="form" @submit.prevent="handleLogin">
        <div class="field">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="you@example.com" required autocomplete="email" />
        </div>
        <div class="field">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="••••••••" required autocomplete="current-password" />
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Signing in…' : (loginAsExecutive ? 'Sign In (Executive)' : 'Sign In') }}
        </button>

        <button type="button" class="role-toggle" @click="toggleLoginMode">
          {{ loginAsExecutive ? 'Switch to Customer Login' : 'Executive login?' }}
        </button>
      </form>

      <p class="switch-link">
        No account? <RouterLink to="/register">Register here</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../Stores/auth'

const auth     = useAuthStore()
const router   = useRouter()
const email    = ref('')
const password = ref('')
const loginAsExecutive = ref(false)
const loading  = ref(false)
const error    = ref('')

function toggleLoginMode() {
  loginAsExecutive.value = !loginAsExecutive.value
  error.value = ''
}

async function handleLogin() {
  error.value   = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value, loginAsExecutive.value ? 'executive' : 'customer')
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
  background: var(--bg);
}
.auth-bg {
  position: absolute; inset: 0; pointer-events: none;
}
.grid-lines {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(0,229,160,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,229,160,0.04) 1px, transparent 1px);
  background-size: 60px 60px;
}
.auth-card {
  position: relative; z-index: 1;
  width: 100%; max-width: 420px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 0 80px rgba(0,229,160,0.06), 0 32px 64px rgba(0,0,0,0.6);
}

.brand { text-align: center; margin-bottom: 40px; }
.brand-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 8px;
  filter: drop-shadow(0 0 16px rgba(0,229,160,0.6));
}
.brand-name {
  font-family: var(--font-head);
  font-size: 36px;
  letter-spacing: 8px;
  color: var(--accent);
  text-shadow: 0 0 30px rgba(0,229,160,0.3);
}
.brand-sub {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--muted);
  text-transform: uppercase;
  margin-top: 6px;
}

.form { display: flex; flex-direction: column; gap: 18px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--muted);
}
.field input {
  background: var(--bg2);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.field input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(0,229,160,0.1);
}
.field input::placeholder { color: var(--muted); }

.error-msg {
  background: rgba(255,69,96,0.1);
  border: 1px solid rgba(255,69,96,0.3);
  color: var(--danger);
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
}

.submit-btn {
  background: var(--accent);
  border: none;
  color: #000;
  padding: 14px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  font-family: var(--font-body);
  letter-spacing: 0.5px;
  cursor: pointer;
  margin-top: 6px;
  transition: all 0.2s;
}
.submit-btn:hover:not(:disabled) {
  background: #00ffb3;
  box-shadow: 0 0 24px rgba(0,229,160,0.4);
}
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.role-toggle {
  margin-top: 8px;
  background: transparent;
  border: none;
  color: var(--muted);
  font-size: 12px;
  text-align: center;
  cursor: pointer;
  text-decoration: underline;
}
.role-toggle:hover { color: var(--accent); }

.switch-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--muted);
}
.switch-link a { color: var(--accent); text-decoration: none; }
.switch-link a:hover { text-decoration: underline; }
</style>