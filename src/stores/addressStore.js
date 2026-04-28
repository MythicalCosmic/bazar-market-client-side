import { ref } from 'vue'

const addresses = ref(JSON.parse(localStorage.getItem('bazar-addresses') || '[]'))

function save() {
  localStorage.setItem('bazar-addresses', JSON.stringify(addresses.value))
}

let nextId = addresses.value.length ? Math.max(...addresses.value.map(a => a.id)) + 1 : 1

export function useAddresses() {
  function addAddress(label, address) {
    addresses.value.push({ id: nextId++, label, address, isDefault: addresses.value.length === 0 })
    save()
  }

  function removeAddress(id) {
    const idx = addresses.value.findIndex(a => a.id === id)
    if (idx !== -1) {
      addresses.value.splice(idx, 1)
      if (addresses.value.length && !addresses.value.some(a => a.isDefault)) {
        addresses.value[0].isDefault = true
      }
      save()
    }
  }

  function setDefault(id) {
    addresses.value.forEach(a => { a.isDefault = a.id === id })
    save()
  }

  return { addresses, addAddress, removeAddress, setDefault }
}
