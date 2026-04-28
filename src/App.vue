<script setup>
// src/App.vue
import { currentRoute } from './router/index.js'

import SplashView     from './views/SplashView.vue'
import HomeView       from './views/HomeView.vue'
import CategoriesView from './views/CategoriesView.vue'
import CartView       from './views/CartView.vue'
import CheckoutView   from './views/CheckoutView.vue'
import OrdersView     from './views/OrdersView.vue'
import ProfileView    from './views/ProfileView.vue'
import BottomNav      from './components/BottomNav.vue'

// Routes that show bottom nav
const showNav = ['home', 'categories', 'orders', 'profile']
</script>

<template>
  <div class="flex flex-col min-h-screen">

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto">
      <Transition name="fade" mode="out-in">
        <SplashView     v-if="currentRoute === 'splash'"      key="splash"   />
        <HomeView       v-else-if="currentRoute === 'home'"       key="home"     />
        <CategoriesView v-else-if="currentRoute === 'categories'" key="cats"     />
        <CartView       v-else-if="currentRoute === 'cart'"       key="cart"     />
        <CheckoutView   v-else-if="currentRoute === 'checkout'"   key="checkout" />
        <OrdersView     v-else-if="currentRoute === 'orders'"     key="orders"   />
        <ProfileView    v-else-if="currentRoute === 'profile'"    key="profile"  />
      </Transition>
    </main>

    <!-- Bottom nav — hidden on splash, cart, checkout -->
    <BottomNav v-if="showNav.includes(currentRoute)" />

  </div>
</template>
