<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">CHARGING STATIONS</h1>
        <p class="page-sub">{{ store.stations.length }} stations in network</p>
      </div>
      <div class="header-actions">
        <button class="map-btn" @click="goToMap">Open Map View</button>
        <button v-if="canManage" class="add-btn" @click="showForm = true">+ Add Station</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label>Status</label>
        <select v-model="filters.status" @change="applyFilters">
          <option value="">All</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Connector</label>
        <select v-model="filters.connectorType" @change="applyFilters">
          <option value="">All</option>
          <option v-for="ct in connectorTypes" :key="ct">{{ ct }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Min Power (kW)</label>
        <input v-model.number="filters.minPower" type="number" min="0" placeholder="0" @input="applyFilters" />
      </div>
      <div class="filter-group">
        <label>Search</label>
        <input v-model="filters.search" type="text" placeholder="Station name…" @input="applyFilters" />
      </div>
      <button class="reset-btn" @click="resetFilters">Reset</button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="state-box">
      <div class="spinner"></div>
      <p>Loading stations…</p>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="state-box error">{{ store.error }}</div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="state-box">
      <p style="font-size:40px">⚡</p>
      <p>{{ canManage ? 'No stations found. Add one!' : 'No stations found.' }}</p>
    </div>

    <!-- Grid -->
    <div v-else class="station-grid">
      <Transition name="slide" v-for="station in filtered" :key="station.id">
        <div class="station-card">
          <div class="card-top">
            <span :class="['status-dot', station.status === 'Active' ? 'active' : 'inactive']"></span>
            <span :class="['status-label', station.status === 'Active' ? 'active' : 'inactive']">{{ station.status }}</span>
          </div>

          <h3 class="station-name">{{ station.name }}</h3>

          <div class="station-meta">
            <div class="meta-item">
              <span class="meta-key">Connector</span>
              <span class="meta-val connector-badge">{{ station.connectorType }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-key">Power</span>
              <span class="meta-val power-val">{{ station.powerOutput }} <small>kW</small></span>
            </div>
            <div class="meta-item">
              <span class="meta-key">Location</span>
              <span class="meta-val coords">{{ station.locationName || `${Number(station.latitude).toFixed(4)}, ${Number(station.longitude).toFixed(4)}` }}</span>
            </div>
            <div v-if="canManage" class="meta-item">
              <span class="meta-key">Added by</span>
              <span class="meta-val">{{ station.creator?.name || '—' }}</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-navigate" @click="navigateToStation(station)">Navigate</button>
            <button v-if="canManage" class="btn-edit" @click="editStation(station)">Edit</button>
            <button v-if="canManage" class="btn-delete" @click="confirmDelete(station)">Delete</button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Station Form Modal -->
    <StationForm
      v-if="showForm"
      :station="editTarget"
      @close="closeForm"
      @saved="store.fetchStations()"
    />

    <!-- Delete Confirm Modal -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="overlay" @click.self="deleteTarget = null">
        <div class="confirm-modal">
          <h3>Delete Station?</h3>
          <p>Are you sure you want to delete <strong>{{ deleteTarget.name }}</strong>? This cannot be undone.</p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="deleteTarget = null">Cancel</button>
            <button class="btn-confirm-delete" :disabled="deleting" @click="handleDelete">
              {{ deleting ? 'Deleting…' : 'Yes, Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStationStore } from '../Stores/stations'
import { useAuthStore } from '../Stores/auth'
import StationForm from '../Components/StationForm.vue'

const store = useStationStore()
const auth = useAuthStore()
const router = useRouter()
const connectorTypes = ['Type 1', 'Type 2', 'CCS', 'CHAdeMO', 'Tesla']
const canManage = computed(() => auth.isExecutive)

const showForm   = ref(false)
const editTarget = ref(null)
const deleteTarget = ref(null)
const deleting   = ref(false)

const filters = ref({ status: '', connectorType: '', minPower: '', search: '' })

const filtered = computed(() => {
  return store.stations.filter(s => {
    if (filters.value.status && s.status !== filters.value.status) return false
    if (filters.value.connectorType && s.connectorType !== filters.value.connectorType) return false
    if (filters.value.minPower && Number(s.powerOutput) < filters.value.minPower) return false
    if (filters.value.search && !s.name.toLowerCase().includes(filters.value.search.toLowerCase())) return false
    return true
  })
})

function applyFilters() { /* reactive, filtered computed handles it */ }
function resetFilters() { filters.value = { status: '', connectorType: '', minPower: '', search: '' } }
function goToMap() { router.push('/map') }

function navigateToStation(station) {
  const destination = `${station.latitude},${station.longitude}`

  if (!navigator.geolocation) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`, '_blank')
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const origin = `${position.coords.latitude},${position.coords.longitude}`
      const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`
      window.open(url, '_blank')
    },
    () => {
      const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`
      window.open(fallbackUrl, '_blank')
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

function editStation(station) {
  if (!canManage.value) return
  editTarget.value = station
  showForm.value   = true
}
function closeForm() {
  showForm.value   = false
  editTarget.value = null
}
function confirmDelete(station) {
  if (!canManage.value) return
  deleteTarget.value = station
}

async function handleDelete() {
  if (!canManage.value || !deleteTarget.value) return
  deleting.value = true
  try {
    await store.deleteStation(deleteTarget.value.id)
    deleteTarget.value = null
  } finally {
    deleting.value = false
  }
}

onMounted(() => store.fetchStations())
</script>

<style scoped>
.dashboard { padding: 32px; max-width: 1400px; margin: 0 auto; }

.page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 32px;
}
.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.page-title {
  font-family: var(--font-head);
  font-size: 40px; letter-spacing: 4px;
  color: var(--text);
  line-height: 1;
}
.page-sub { font-family: var(--font-mono); font-size: 12px; color: var(--muted); margin-top: 6px; }

.map-btn {
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--accent);
  padding: 12px 18px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.map-btn:hover { background: rgba(0,229,160,0.12); }

.add-btn {
  background: var(--accent); color: #000; border: none;
  padding: 12px 24px; border-radius: 8px;
  font-weight: 700; font-size: 14px; cursor: pointer;
  transition: all 0.2s; white-space: nowrap;
}
.add-btn:hover { background: #00ffb3; box-shadow: 0 0 24px rgba(0,229,160,0.4); }

.filters {
  display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end;
  padding: 20px; background: var(--card);
  border: 1px solid var(--border); border-radius: 10px;
  margin-bottom: 28px;
}
.filter-group { display: flex; flex-direction: column; gap: 5px; }
.filter-group label { font-family: var(--font-mono); font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); }
.filter-group select, .filter-group input {
  background: var(--bg2); border: 1px solid var(--border);
  color: var(--text); padding: 8px 12px; border-radius: 6px;
  font-size: 13px; outline: none; transition: border-color 0.2s;
  min-width: 130px;
}
.filter-group select:focus, .filter-group input:focus { border-color: var(--accent); }
.filter-group select option { background: var(--bg3); }
.filter-group input::placeholder { color: var(--muted); }

.reset-btn {
  background: transparent; border: 1px solid var(--border); color: var(--muted);
  padding: 8px 16px; border-radius: 6px; cursor: pointer;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 1px;
  text-transform: uppercase; transition: all 0.2s; align-self: flex-end;
}
.reset-btn:hover { border-color: var(--danger); color: var(--danger); }

.state-box {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 80px; color: var(--muted); font-family: var(--font-mono); font-size: 13px; text-align: center;
}
.state-box.error { color: var(--danger); }
.spinner {
  width: 32px; height: 32px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.station-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.station-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  display: flex; flex-direction: column; gap: 16px;
  transition: border-color 0.2s, transform 0.2s;
}
.station-card:hover { border-color: rgba(0,229,160,0.3); transform: translateY(-2px); }

.card-top { display: flex; align-items: center; gap: 8px; }
.status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  animation: pulse 2s infinite;
}
.status-dot.active { background: var(--accent); box-shadow: 0 0 6px var(--accent); }
.status-dot.inactive { background: var(--muted); animation: none; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

.status-label { font-family: var(--font-mono); font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
.status-label.active { color: var(--accent); }
.status-label.inactive { color: var(--muted); }

.station-name {
  font-size: 18px; font-weight: 600; color: var(--text);
  line-height: 1.3;
}

.station-meta { display: flex; flex-direction: column; gap: 10px; }
.meta-item { display: flex; justify-content: space-between; align-items: center; }
.meta-key { font-family: var(--font-mono); font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
.meta-val { font-size: 13px; color: var(--text); }

.connector-badge {
  font-family: var(--font-mono); font-size: 11px;
  background: rgba(0,229,160,0.1); color: var(--accent);
  padding: 3px 10px; border-radius: 12px;
  border: 1px solid rgba(0,229,160,0.2);
}
.power-val { font-family: var(--font-head); font-size: 20px; color: var(--accent2); }
.power-val small { font-size: 12px; font-family: var(--font-mono); color: var(--muted); }
.coords { font-family: var(--font-mono); font-size: 12px; color: var(--muted); }

.card-actions { display: flex; gap: 8px; padding-top: 4px; border-top: 1px solid var(--border); }
.btn-navigate, .btn-edit, .btn-delete {
  flex: 1; padding: 8px; border-radius: 6px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s; border: 1px solid;
}
.btn-navigate { background: transparent; border-color: var(--accent2); color: var(--accent2); }
.btn-navigate:hover { background: rgba(0,255,255,0.1); }
.btn-edit { background: transparent; border-color: var(--accent); color: var(--accent); }
.btn-edit:hover { background: rgba(0,229,160,0.1); }
.btn-delete { background: transparent; border-color: var(--danger); color: var(--danger); }
.btn-delete:hover { background: rgba(255,69,96,0.1); }

/* Delete Confirm Modal */
.overlay {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.confirm-modal {
  background: var(--bg3); border: 1px solid var(--border); border-radius: 12px;
  padding: 32px; max-width: 420px; width: 100%;
  display: flex; flex-direction: column; gap: 16px;
}
.confirm-modal h3 { font-family: var(--font-head); font-size: 22px; letter-spacing: 2px; color: var(--danger); }
.confirm-modal p { color: var(--muted); font-size: 14px; line-height: 1.6; }
.confirm-modal strong { color: var(--text); }
.confirm-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
.btn-cancel { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 10px 20px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { border-color: var(--text); color: var(--text); }
.btn-confirm-delete { background: var(--danger); border: none; color: #fff; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-confirm-delete:hover:not(:disabled) { background: #ff1f42; }
.btn-confirm-delete:disabled { opacity: 0.5; cursor: not-allowed; }
</style>