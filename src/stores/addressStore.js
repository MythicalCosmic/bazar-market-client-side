import { ref } from 'vue'
import { getAddresses, addAddressAPI, deleteAddressAPI, setDefaultAddressAPI } from '../services/api.js'
import { getToken } from '../services/http.js'

const addresses = ref([])
let loaded = false

export function useAddresses() {
  async function loadAddresses(force = false) {
    if (!getToken()) return
    if (loaded && !force) return
    try {
      addresses.value = await getAddresses()
      loaded = true
    } catch {}
  }

  async function addAddress(data) {
    try {
      const result = await addAddressAPI({
        latitude: data.lat,
        longitude: data.lng,
        address_text: data.address,
        label: data.label || '',
        entrance: data.entrance || '',
        floor: data.floor || '',
        apartment: data.apartment || '',
        comment: data.comment || '',
        is_default: data.isDefault || false,
      })
      loaded = false
      await loadAddresses()
      return result
    } catch (e) {
      throw e
    }
  }

  async function removeAddress(id) {
    addresses.value = addresses.value.filter(a => a.id !== id)
    try {
      await deleteAddressAPI(id)
    } catch {
      loaded = false
      await loadAddresses()
    }
  }

  async function setDefault(id) {
    addresses.value.forEach(a => { a.isDefault = a.id === id })
    try {
      await setDefaultAddressAPI(id)
    } catch {
      loaded = false
      await loadAddresses()
    }
  }

  function resetAddresses() {
    addresses.value = []
    loaded = false
  }

  return { addresses, loadAddresses, addAddress, removeAddress, setDefault, resetAddresses }
}
