<script setup>
// src/views/SplashView.vue
import { onMounted } from 'vue'
import { useRouter } from '../router/index.js'
import { images } from '../assets/images.js'

const { navigate } = useRouter()

onMounted(() => {
  setTimeout(() => navigate('home'), 2500)
})
</script>

<template>
  <div
    class="w-full min-h-screen flex flex-col relative overflow-hidden"
    style="background: #2DB84B"
  >
    <!-- BAZAR MARKET текст -->
    <div class="flex-1 flex items-center justify-center">
      <h1
        class="text-white font-black tracking-wider text-center"
        style="font-size: 34px; letter-spacing: 3px"
      >
        BAZAR MARKET
      </h1>
    </div>

    <!-- Логотип внизу по центру большой -->
    <div class="flex items-end justify-center w-full">
      <img
        :src="images.logo"
        alt="Bazar Market Logo"
        class="object-contain"
        style="
          width: 320px;
          height: 320px;
          margin-bottom: -30px;
        "
      />
    </div>
  </div>
</template>