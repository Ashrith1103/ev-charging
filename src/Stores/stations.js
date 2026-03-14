import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../Api/axios'

export const useStationStore = defineStore('stations', () => {
  const stations = ref([])
  const loading  = ref(false)
  const error    = ref('')

  async function fetchStations(filters = {}) {
    loading.value = true
    error.value   = ''
    try {
      const { data } = await api.get('/stations', { params: filters })
      stations.value = data.stations
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load stations'
    } finally {
      loading.value = false
    }
  }

  async function createStation(payload) {
    const { data } = await api.post('/stations', payload)
    stations.value.unshift(data)
    return data
  }

  async function updateStation(id, payload) {
    const { data } = await api.put(`/stations/${id}`, payload)
    const idx = stations.value.findIndex(s => s.id === id)
    if (idx !== -1) stations.value[idx] = data
    return data
  }

  async function deleteStation(id) {
    await api.delete(`/stations/${id}`)
    stations.value = stations.value.filter(s => s.id !== id)
  }

  return { stations, loading, error, fetchStations, createStation, updateStation, deleteStation }
})