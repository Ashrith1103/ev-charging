<template>
  <div id="layout">
    <AppNav v-if="auth.isLoggedIn" />
    <main :class="['main-content', { 'with-nav': auth.isLoggedIn }]">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from './Stores/auth'
import AppNav from './Components/AppNav.vue'

const auth = useAuthStore()
</script>

<style>
#layout { display: flex; flex-direction: column; min-height: 100vh; }
.main-content { flex: 1; }
.main-content.with-nav { padding-top: 64px; }
</style>