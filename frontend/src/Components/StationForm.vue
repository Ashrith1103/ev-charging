<template>
  <Teleport to="body">
    <div class="overlay" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">{{ isEdit ? 'EDIT STATION' : 'NEW STATION' }}</h2>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <form class="form" @submit.prevent="handleSubmit">
          <div class="form-row">
            <div class="field">
              <label>Station Name</label>
              <input v-model="form.name" type="text" placeholder="e.g. Downtown Hub" required />
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label>Location Name</label>
              <input v-model="form.locationName" type="text" placeholder="e.g. MG Road, Bengaluru" />
            </div>
          </div>

          <div class="form-row two-col">
            <div class="field">
              <label>Latitude</label>
              <input v-model.number="form.latitude" type="number" step="any" placeholder="12.9716" required />
            </div>
            <div class="field">
              <label>Longitude</label>
              <input v-model.number="form.longitude" type="number" step="any" placeholder="77.5946" required />
            </div>
          </div>

          <div class="form-row two-col">
            <div class="field">
              <label>Power Output (kW)</label>
              <input v-model.number="form.powerOutput" type="number" min="0" step="0.1" placeholder="150" required />
            </div>
            <div class="field">
              <label>Status</label>
              <select v-model="form.status">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label>Connector Type</label>
              <div class="connector-pills">
                <button
                  v-for="ct in connectorTypes" :key="ct"
                  type="button"
                  :class="['pill', { active: form.connectorType === ct }]"
                  @click="form.connectorType = ct"
                >{{ ct }}</button>
              </div>
            </div>
          </div>

          <div v-if="error" class="error-msg">{{ error }}</div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="$emit('close')">Cancel</button>
            <button type="submit" class="btn-submit" :disabled="loading">
              <span v-if="loading">Saving…</span>
              <span v-else>{{ isEdit ? 'Update Station' : 'Create Station' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useStationStore } from '../Stores/stations'

const props = defineProps({
  station: { type: Object, default: null }
})
const emit = defineEmits(['close', 'saved'])

const store = useStationStore()
const isEdit = !!props.station
const loading = ref(false)
const error   = ref('')

const connectorTypes = ['Type 1', 'Type 2', 'CCS', 'CHAdeMO', 'Tesla']

const form = ref({
  name:          props.station?.name          || '',
  locationName:  props.station?.locationName  || '',
  latitude:      props.station?.latitude      || '',
  longitude:     props.station?.longitude     || '',
  powerOutput:   props.station?.powerOutput   || '',
  status:        props.station?.status        || 'Active',
  connectorType: props.station?.connectorType || 'CCS',
})

async function handleSubmit() {
  error.value   = ''
  loading.value = true
  try {
    if (isEdit) {
      await store.updateStation(props.station.id, form.value)
    } else {
      await store.createStation(form.value)
    }
    emit('saved')
    emit('close')
  } catch (err) {
    error.value = err.response?.data?.message || 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal {
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 100%; max-width: 560px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.8);
  overflow: hidden;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24px 28px;
  border-bottom: 1px solid var(--border);
}
.modal-title {
  font-family: var(--font-head);
  font-size: 22px;
  letter-spacing: 3px;
  color: var(--accent);
}
.close-btn {
  background: none; border: none; color: var(--muted);
  font-size: 18px; cursor: pointer; transition: color 0.2s;
}
.close-btn:hover { color: var(--text); }

.form { padding: 28px; display: flex; flex-direction: column; gap: 20px; }
.form-row { display: flex; flex-direction: column; gap: 12px; }
.two-col { flex-direction: row; gap: 16px; }
.two-col .field { flex: 1; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--muted);
}
.field input, .field select {
  background: var(--bg2);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 10px 14px;
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.field input:focus, .field select:focus { border-color: var(--accent); }
.field input::placeholder { color: var(--muted); }
.field select option { background: var(--bg3); }

.connector-pills { display: flex; gap: 8px; flex-wrap: wrap; }
.pill {
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 7px 14px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s;
}
.pill:hover { border-color: var(--accent); color: var(--accent); }
.pill.active { border-color: var(--accent); background: rgba(0,229,160,0.12); color: var(--accent); }

.error-msg {
  background: rgba(255,69,96,0.1);
  border: 1px solid rgba(255,69,96,0.3);
  color: var(--danger);
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
}

.form-actions { display: flex; gap: 12px; justify-content: flex-end; padding-top: 4px; }
.btn-cancel {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--muted);
  padding: 10px 22px;
  border-radius: 6px;
  cursor: pointer;
  font-family: var(--font-body);
  transition: all 0.2s;
}
.btn-cancel:hover { border-color: var(--text); color: var(--text); }
.btn-submit {
  background: var(--accent);
  border: none;
  color: #000;
  padding: 10px 28px;
  border-radius: 6px;
  cursor: pointer;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
}
.btn-submit:hover:not(:disabled) { background: #00ffb3; }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
</style>