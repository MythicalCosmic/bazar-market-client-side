<script setup>
import { currentRoute, transitionName } from './router/index.js'

import SplashView         from './views/SplashView.vue'
import HomeView           from './views/HomeView.vue'
import CategoriesView     from './views/CategoriesView.vue'
import CartView           from './views/CartView.vue'
import CheckoutView       from './views/CheckoutView.vue'
import OrdersView         from './views/OrdersView.vue'
import ProfileView        from './views/ProfileView.vue'
import SettingsView       from './views/SettingsView.vue'
import SupportView        from './views/SupportView.vue'
import FavoritesView      from './views/FavoritesView.vue'
import PaymentMethodsView from './views/PaymentMethodsView.vue'
import LoginView          from './views/LoginView.vue'
import RegisterView       from './views/RegisterView.vue'
import VerifyView         from './views/VerifyView.vue'
import AddressesView      from './views/AddressesView.vue'
import CouponsView        from './views/CouponsView.vue'
import BottomNav          from './components/BottomNav.vue'

const showNav = ['home', 'categories', 'favorites', 'orders', 'profile']
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <main class="flex-1 overflow-y-auto">
      <Transition :name="transitionName" mode="out-in">
        <SplashView         v-if="currentRoute === 'splash'"          key="splash"   />
        <HomeView           v-else-if="currentRoute === 'home'"           key="home"     />
        <CategoriesView     v-else-if="currentRoute === 'categories'"     key="cats"     />
        <FavoritesView      v-else-if="currentRoute === 'favorites'"      key="favorites"/>
        <CartView           v-else-if="currentRoute === 'cart'"           key="cart"     />
        <CheckoutView       v-else-if="currentRoute === 'checkout'"       key="checkout" />
        <OrdersView         v-else-if="currentRoute === 'orders'"         key="orders"   />
        <ProfileView        v-else-if="currentRoute === 'profile'"        key="profile"  />
        <SettingsView       v-else-if="currentRoute === 'settings'"       key="settings" />
        <SupportView        v-else-if="currentRoute === 'support'"        key="support"  />
        <PaymentMethodsView v-else-if="currentRoute === 'payment-methods'" key="payments" />
        <LoginView          v-else-if="currentRoute === 'login'"           key="login"    />
        <RegisterView       v-else-if="currentRoute === 'register'"       key="register" />
        <VerifyView         v-else-if="currentRoute === 'verify'"         key="verify"   />
        <AddressesView      v-else-if="currentRoute === 'addresses'"      key="addresses"/>
        <CouponsView        v-else-if="currentRoute === 'coupons'"        key="coupons"  />
      </Transition>
    </main>

    <BottomNav v-if="showNav.includes(currentRoute)" />
  </div>
</template>
