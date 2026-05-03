<script setup>
import { currentRoute, transitionName } from './router/index.js'
import { useToast } from './composables/useToast.js'

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
import ForgotPasswordView from './views/ForgotPasswordView.vue'
import AddressesView      from './views/AddressesView.vue'
import CouponsView        from './views/CouponsView.vue'
import RewardsView        from './views/RewardsView.vue'
import ProductDetailView  from './views/ProductDetailView.vue'
import BottomNav          from './components/BottomNav.vue'
import ScrollToTop        from './components/ScrollToTop.vue'

const showNav = ['home', 'categories', 'favorites', 'orders', 'profile']
const { toasts } = useToast()
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
        <ForgotPasswordView v-else-if="currentRoute === 'forgot-password'" key="forgot"   />
        <AddressesView      v-else-if="currentRoute === 'addresses'"      key="addresses"/>
        <CouponsView        v-else-if="currentRoute === 'coupons'"        key="coupons"  />
        <RewardsView        v-else-if="currentRoute === 'rewards'"        key="rewards"  />
        <ProductDetailView  v-else-if="currentRoute === 'product'"        key="product"  />
      </Transition>
    </main>

    <BottomNav v-if="showNav.includes(currentRoute)" />
    <ScrollToTop />

    <!-- Toast notifications -->
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-full max-w-[440px] px-4">
      <TransitionGroup name="slide-up">
        <div v-for="toast in toasts" :key="toast.id"
          class="toast-item"
          :class="'toast-' + toast.type">
          <div class="toast-icon">
            <svg v-if="toast.type === 'error'" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 8v4m0 4h.01" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <svg v-else-if="toast.type === 'success'" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 16v-4m0-4h.01" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <p class="toast-text">{{ toast.message }}</p>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style>
.toast-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 14px;
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08);
}
.toast-error {
  background: rgba(239, 68, 68, 0.92);
}
.toast-success {
  background: rgba(5, 150, 105, 0.92);
}
.toast-info {
  background: rgba(59, 130, 246, 0.92);
}
.toast-icon {
  color: white;
  flex-shrink: 0;
  display: flex;
}
.toast-text {
  color: white;
  font-size: 13px;
  font-weight: 600;
  flex: 1;
  line-height: 1.3;
}
</style>
