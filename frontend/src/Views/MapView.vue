<template>
  <div class="map-page">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2 class="sidebar-title">MAP VIEW</h2>
        <p class="sidebar-sub">{{ store.stations.length }} stations</p>
      </div>

      <!-- Filter by status -->
      <div class="sidebar-filters">
        <button
          v-for="opt in ['All', 'Active', 'Inactive']" :key="opt"
          :class="['filter-tab', { active: statusFilter === opt }]"
          @click="setFilter(opt)"
        >{{ opt }}</button>
      </div>

      <div class="location-tools">
        <button class="locate-btn" :disabled="locating" @click="locateAndFindNearest">
          {{ locating ? 'Locating...' : 'Locate Nearest Station' }}
        </button>
        <p v-if="locateError" class="locate-error">{{ locateError }}</p>
      </div>

      <!-- Station list -->
      <div class="station-list">
        <div v-if="store.loading" class="list-state">Loading…</div>
        <div v-else-if="filteredStations.length === 0" class="list-state">No stations</div>
        <div
          v-else
          v-for="s in filteredStations" :key="s.id"
          :class="['list-item', { selected: selectedId === s.id }]"
          @click="focusStation(s)"
        >
          <span :class="['dot', s.status === 'Active' ? 'active' : 'inactive']"></span>
          <div class="list-info">
            <span class="list-name">{{ s.name }}</span>
            <span class="list-meta">{{ s.connectorType }} · {{ s.powerOutput }} kW</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Map -->
    <div class="map-container">
      <div id="map" ref="mapEl"></div>

      <!-- Selected station detail panel -->
      <Transition name="slide-up">
        <div v-if="selectedStation" class="detail-panel">
          <div class="detail-header">
            <div>
              <h3 class="detail-name">{{ selectedStation.name }}</h3>
              <span :class="['detail-status', selectedStation.status === 'Active' ? 'active' : 'inactive']">
                ● {{ selectedStation.status }}
              </span>
            </div>
            <button class="detail-close" @click="selectedStation = null; selectedId = null">✕</button>
          </div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="dk">Connector</span>
              <span class="dv">{{ selectedStation.connectorType }}</span>
            </div>
            <div class="detail-item">
              <span class="dk">Power Output</span>
              <span class="dv accent">{{ selectedStation.powerOutput }} kW</span>
            </div>
            <div class="detail-item">
              <span class="dk">Location</span>
              <span class="dv mono">{{ selectedStation.locationName || `${Number(selectedStation.latitude).toFixed(6)}, ${Number(selectedStation.longitude).toFixed(6)}` }}</span>
            </div>
          </div>
          <div class="detail-actions">
            <button class="navigate-btn" @click="startNavigation">Start Navigation</button>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStationStore } from '../Stores/stations'
import L from 'leaflet'

const store          = useStationStore()
const mapEl          = ref(null)
const selectedStation = ref(null)
const selectedId      = ref(null)
const statusFilter    = ref('All')
const locating         = ref(false)
const locateError      = ref('')
let map              = null
let userMarker       = null
const markers        = {}

const filteredStations = computed(() => {
  if (statusFilter.value === 'All') return store.stations
  return store.stations.filter(s => s.status === statusFilter.value)
})

function setFilter(opt) {
  statusFilter.value = opt
  rebuildMarkers()
}

// Custom marker icon
function makeIcon(status) {
  const color = status === 'Active' ? '#00e5a0' : '#666680'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <ellipse cx="16" cy="38" rx="6" ry="2" fill="rgba(0,0,0,0.3)"/>
    <path d="M16 0C9.4 0 4 5.4 4 12c0 9 12 26 12 26S28 21 28 12C28 5.4 22.6 0 16 0z" fill="${color}"/>
    <circle cx="16" cy="12" r="5" fill="#000" opacity="0.5"/>
    <text x="16" y="16" text-anchor="middle" font-size="10" fill="${color === '#00e5a0' ? '#000' : '#aaa'}">⚡</text>
  </svg>`
  return L.divIcon({
    html: svg, className: '', iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -42]
  })
}

function buildPopup(s) {
  return `
    <div style="min-width:180px;padding:4px">
      <div style="font-family:'DM Mono',monospace;font-size:11px;color:#666680;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">${s.status}</div>
      <div style="font-size:15px;font-weight:600;color:#e8e8f0;margin-bottom:12px">${s.name}</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;justify-content:space-between;font-size:12px">
          <span style="color:#666680">Connector</span>
          <span style="color:#00e5a0;font-family:'DM Mono',monospace">${s.connectorType}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px">
          <span style="color:#666680">Power</span>
          <span style="color:#0ff;font-family:'DM Mono',monospace">${s.powerOutput} kW</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px">
          <span style="color:#666680">Location</span>
          <span style="color:#e8e8f0;font-family:'DM Mono',monospace">${s.locationName || `${Number(s.latitude).toFixed(4)}, ${Number(s.longitude).toFixed(4)}`}</span>
        </div>
      </div>
    </div>
  `
}

function rebuildMarkers() {
  // Remove all existing markers
  Object.values(markers).forEach(m => m.remove())
  Object.keys(markers).forEach(k => delete markers[k])

  filteredStations.value.forEach(s => {
    if (!s.latitude || !s.longitude) return
    const marker = L.marker([s.latitude, s.longitude], { icon: makeIcon(s.status) })
      .bindPopup(buildPopup(s), { maxWidth: 240 })
      .addTo(map)

    marker.on('click', () => {
      selectedStation.value = s
      selectedId.value = s.id
    })

    markers[s.id] = marker
  })
}

function focusStation(s) {
  selectedStation.value = s
  selectedId.value       = s.id
  map.flyTo([s.latitude, s.longitude], 14, { duration: 1 })
  markers[s.id]?.openPopup()
}

function toRad(value) {
  return (Number(value) * Math.PI) / 180
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusKm * c
}

function findNearestStation(userLat, userLon) {
  let nearest = null
  let nearestDistance = Number.POSITIVE_INFINITY

  filteredStations.value.forEach((station) => {
    if (station.latitude == null || station.longitude == null) return
    const dist = distanceKm(userLat, userLon, Number(station.latitude), Number(station.longitude))
    if (dist < nearestDistance) {
      nearestDistance = dist
      nearest = station
    }
  })

  return nearest
}

function locateAndFindNearest() {
  locateError.value = ''

  if (!map) return

  if (!navigator.geolocation) {
    locateError.value = 'Geolocation is not supported in this browser.'
    return
  }

  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords

      if (userMarker) userMarker.remove()
      userMarker = L.circleMarker([latitude, longitude], {
        radius: 8,
        color: '#00e5a0',
        weight: 2,
        fillColor: '#0a0a0f',
        fillOpacity: 1,
      }).addTo(map).bindPopup('You are here')

      const nearest = findNearestStation(latitude, longitude)
      if (!nearest) {
        map.flyTo([latitude, longitude], 13, { duration: 1 })
        userMarker.openPopup()
        locateError.value = 'No station available for the selected filter.'
        locating.value = false
        return
      }

      focusStation(nearest)
      locating.value = false
    },
    () => {
      locateError.value = 'Unable to access your location. Please allow location permission.'
      locating.value = false
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

function startNavigation() {
  if (!selectedStation.value) return

  const destination = `${selectedStation.value.latitude},${selectedStation.value.longitude}`

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

onMounted(async () => {
  await store.fetchStations()

  map = L.map(mapEl.value, {
    center: [20, 0],
    zoom: 2,
    zoomControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  rebuildMarkers()

  // Fit to markers if any
  if (store.stations.length > 0) {
    const valid = store.stations.filter(s => s.latitude && s.longitude)
    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map(s => [s.latitude, s.longitude]))
      map.fitBounds(bounds, { padding: [60, 60] })
    }
  }
})

watch(filteredStations, () => { if (map) rebuildMarkers() })

onUnmounted(() => { if (map) { map.remove(); map = null } })
</script>

<style scoped>
.map-page {
  display: flex;
  height: calc(100vh - 64px);
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 300px; min-width: 300px;
  background: var(--bg2);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.sidebar-header { padding: 24px 20px 16px; border-bottom: 1px solid var(--border); }
.sidebar-title { font-family: var(--font-head); font-size: 22px; letter-spacing: 3px; color: var(--text); }
.sidebar-sub { font-family: var(--font-mono); font-size: 11px; color: var(--muted); margin-top: 4px; }

.sidebar-filters { display: flex; gap: 4px; padding: 12px 20px; border-bottom: 1px solid var(--border); }
.filter-tab {
  flex: 1; padding: 6px; border-radius: 6px;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
  background: transparent; border: 1px solid var(--border); color: var(--muted);
  cursor: pointer; transition: all 0.2s;
}
.filter-tab.active { background: rgba(0,229,160,0.1); border-color: var(--accent); color: var(--accent); }
.filter-tab:hover:not(.active) { border-color: var(--text); color: var(--text); }

.location-tools {
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
}
.locate-btn {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--accent);
  background: rgba(0,229,160,0.08);
  color: var(--accent);
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}
.locate-btn:hover:not(:disabled) { background: rgba(0,229,160,0.14); }
.locate-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.locate-error {
  margin-top: 8px;
  font-size: 11px;
  color: var(--danger);
  line-height: 1.4;
}

.station-list { flex: 1; overflow-y: auto; padding: 8px; }
.list-state { padding: 40px 20px; text-align: center; color: var(--muted); font-family: var(--font-mono); font-size: 12px; }

.list-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 8px;
  cursor: pointer; transition: all 0.15s;
  border: 1px solid transparent;
}
.list-item:hover { background: var(--bg3); }
.list-item.selected { background: rgba(0,229,160,0.07); border-color: rgba(0,229,160,0.2); }

.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot.active { background: var(--accent); box-shadow: 0 0 6px var(--accent); }
.dot.inactive { background: var(--muted); }

.list-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.list-name { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.list-meta { font-family: var(--font-mono); font-size: 11px; color: var(--muted); }

/* Map */
.map-container { flex: 1; position: relative; }
#map { width: 100%; height: 100%; }

/* Detail Panel */
.detail-panel {
  position: absolute; bottom: 24px; right: 24px; z-index: 500;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px 24px;
  min-width: 280px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  backdrop-filter: blur(12px);
}
.detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.detail-name { font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
.detail-status { font-family: var(--font-mono); font-size: 11px; letter-spacing: 1px; }
.detail-status.active { color: var(--accent); }
.detail-status.inactive { color: var(--muted); }
.detail-close { background: none; border: none; color: var(--muted); font-size: 16px; cursor: pointer; transition: color 0.2s; }
.detail-close:hover { color: var(--text); }

.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.detail-item { display: flex; flex-direction: column; gap: 3px; }
.dk { font-family: var(--font-mono); font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); }
.dv { font-size: 13px; color: var(--text); }
.dv.accent { color: var(--accent); font-family: var(--font-head); font-size: 18px; }
.dv.mono { font-family: var(--font-mono); font-size: 12px; }

.detail-actions {
  margin-top: 16px;
}
.navigate-btn {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--accent2);
  background: rgba(0,255,255,0.08);
  color: var(--accent2);
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}
.navigate-btn:hover { background: rgba(0,255,255,0.16); }

/* slide-up transition for detail panel */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.25s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(16px); }
.slide-up-leave-to { opacity: 0; transform: translateY(16px); }
</style>