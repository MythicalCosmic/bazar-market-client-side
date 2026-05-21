<script setup>
import ProductCard from './ProductCard.vue'
import { useI18n } from '../i18n/index.js'

const props = defineProps({
  title: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  italic: { type: String, default: '' },
  products: { type: Array, default: () => [] },
  onSeeAll: { type: Function, default: null },
  seeAllLabel: { type: String, default: '' },
  number: { type: String, default: '' },
})

const { t } = useI18n()
</script>

<template>
  <section v-if="products.length" class="mt-8">
    <!-- Editorial section header -->
    <div class="px-5 mb-4">
      <div class="flex items-end justify-between gap-4 mb-2.5">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1.5">
            <span v-if="number" class="num-label text-[11px] tabular">№ {{ number }}</span>
            <span v-if="number && eyebrow" class="block w-4 h-px" style="background: var(--hairline)"></span>
            <p v-if="eyebrow" class="eyebrow-sm">{{ eyebrow }}</p>
          </div>
          <h2 class="display text-[26px]" style="color: var(--text-primary);">
            <span v-if="italic" class="serif-italic" style="color: var(--terracotta);">{{ italic }}</span>{{ italic ? ' ' : '' }}{{ title }}
          </h2>
        </div>
        <button v-if="onSeeAll" @click="onSeeAll" class="see-all-btn btn-press flex-shrink-0">
          <span class="eyebrow-sm">{{ seeAllLabel || t('home.see_all') }}</span>
          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
            <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div class="hairline"></div>
    </div>

    <div class="scroll-x flex gap-3 px-5 pb-1 snap-x snap-mandatory">
      <div
        v-for="product in products"
        :key="product.id"
        class="flex-shrink-0 w-[170px] snap-start"
      >
        <ProductCard :product="product" />
      </div>
      <!-- Trailing spacer so the last card can snap fully into view -->
      <div class="flex-shrink-0 w-px"></div>
    </div>
  </section>
</template>

<style scoped>
.see-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-primary);
  padding: 4px 0;
}
</style>
