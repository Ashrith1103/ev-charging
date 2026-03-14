import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../Api/axios'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user  = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => user.value?.role || 'customer')
  const isExecutive = computed(() => role.value === 'executive')
  const isCustomer = computed(() => role.value === 'customer')

  async function login(email, password, expectedRole = null) {
    const { data } = await api.post('/auth/login', { email, password })

    if (expectedRole && data.user?.role !== expectedRole) {
      throw new Error(`This account is ${data.user?.role || 'unknown'}. Please use ${expectedRole} login.`)
    }

    token.value = data.token
    user.value  = data.user
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  async function register(name, email, password, role = 'customer') {
    const { data } = await api.post('/auth/register', { name, email, password, role })
    token.value = data.token
    user.value  = data.user
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  function logout() {
    token.value = null
    user.value  = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, role, isLoggedIn, isExecutive, isCustomer, login, register, logout }
})