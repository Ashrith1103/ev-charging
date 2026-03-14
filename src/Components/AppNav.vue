<template>
  <nav class="nav">
    <div class="nav-left">
      <span class="logo">⚡ EVCHARGE</span>
      <div class="nav-links">
        <RouterLink to="/"    class="nav-link">Stations</RouterLink>
        <RouterLink to="/map" class="nav-link">Map View</RouterLink>
      </div>
    </div>
    <div class="nav-right">
      <span class="user-badge">{{ auth.user?.name }}</span>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../Stores/auth'
import { useRouter } from 'vue-router'

const auth   = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  height: 64px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px;
  background: rgba(10,10,15,0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
.nav-left  { display: flex; align-items: center; gap: 40px; }
.nav-right { display: flex; align-items: center; gap: 20px; }

.logo {
  font-family: var(--font-head);
  font-size: 24px;
  letter-spacing: 3px;
  color: var(--accent);
  text-shadow: 0 0 20px rgba(0,229,160,0.4);
}

.nav-links { display: flex; gap: 4px; }

.nav-link {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--muted);
  padding: 6px 14px;
  border-radius: 4px;
  transition: all 0.2s;
}
.nav-link:hover,
.nav-link.router-link-active {
  color: var(--accent);
  background: rgba(0,229,160,0.08);
}

.user-badge {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
  padding: 5px 12px;
  border: 1px solid var(--border);
  border-radius: 20px;
}

.logout-btn {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: transparent;
  color: var(--danger);
  border: 1px solid var(--danger);
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}
.logout-btn:hover {
  background: var(--danger);
  color: #fff;
}
</style>