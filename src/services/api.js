import { images } from '../assets/images.js'

const CATEGORIES = [
  { id: 'all',     emoji: '✨', labelKey: 'cat.all' },
  { id: 'hot',     emoji: '🔥', labelKey: 'cat.hot' },
  { id: 'dairy',   emoji: '🥛', labelKey: 'cat.dairy' },
  { id: 'bread',   emoji: '🍞', labelKey: 'cat.bread' },
  { id: 'sweets',  emoji: '🍬', labelKey: 'cat.sweets' },
  { id: 'fruits',  emoji: '🍎', labelKey: 'cat.fruits' },
  { id: 'drinks',  emoji: '🥤', labelKey: 'cat.drinks' },
  { id: 'snacks',  emoji: '🍿', labelKey: 'cat.snacks' },
]

const PRODUCTS = [
  {
    id: 1,
    name: { uz: 'Tuxum 10 dona', ru: 'Яйца 10 штук', en: 'Eggs 10 pcs' },
    price: 20000,
    image: images.eggs,
    badge: null,
    category: 'dairy',
    isFeatured: true,
  },
  {
    id: 2,
    name: { uz: 'Kola Zero 0.5l', ru: 'Кола зеро 0,5', en: 'Cola Zero 0.5l' },
    price: 7000,
    image: images.cola,
    badge: null,
    category: 'drinks',
    isFeatured: true,
  },
  {
    id: 3,
    name: { uz: 'Orbit Fresh', ru: 'Орбит фреш', en: 'Orbit Fresh' },
    price: 5000,
    image: images.orbit,
    badge: 'NEW',
    category: 'sweets',
    isFeatured: false,
  },
  {
    id: 4,
    name: { uz: 'Non', ru: 'Хлеб', en: 'Bread' },
    price: 3000,
    image: images.bread,
    badge: null,
    category: 'bread',
    isFeatured: false,
  },
  {
    id: 5,
    name: { uz: 'Pishloq 200g', ru: 'Сыр 200г', en: 'Cheese 200g' },
    price: 25000,
    image: images.cheese,
    badge: null,
    category: 'dairy',
    isFeatured: true,
  },
  {
    id: 6,
    name: { uz: 'Sut 1l', ru: 'Молоко 1л', en: 'Milk 1l' },
    price: 12000,
    image: images.milk,
    badge: 'HOT',
    category: 'dairy',
    isFeatured: true,
  },
  {
    id: 7,
    name: { uz: 'Yogurt 400g', ru: 'Йогурт 400г', en: 'Yogurt 400g' },
    price: 9000,
    image: images.milk,
    badge: 'NEW',
    category: 'dairy',
    isFeatured: false,
  },
  {
    id: 8,
    name: { uz: 'Lavash', ru: 'Лаваш', en: 'Lavash' },
    price: 4000,
    image: images.bread,
    badge: null,
    category: 'bread',
    isFeatured: false,
  },
  {
    id: 9,
    name: { uz: 'Shokolad', ru: 'Шоколад', en: 'Chocolate' },
    price: 15000,
    image: images.orbit,
    badge: 'HOT',
    category: 'sweets',
    isFeatured: true,
  },
  {
    id: 10,
    name: { uz: 'Olma 1kg', ru: 'Яблоки 1кг', en: 'Apples 1kg' },
    price: 18000,
    image: images.eggs,
    badge: null,
    category: 'fruits',
    isFeatured: false,
  },
  {
    id: 11,
    name: { uz: 'Banan 1kg', ru: 'Бананы 1кг', en: 'Bananas 1kg' },
    price: 22000,
    image: images.eggs,
    badge: null,
    category: 'fruits',
    isFeatured: true,
  },
  {
    id: 12,
    name: { uz: 'Chips Lays', ru: 'Чипсы Лейс', en: 'Lays Chips' },
    price: 10000,
    image: images.orbit,
    badge: null,
    category: 'snacks',
    isFeatured: false,
  },
  {
    id: 13,
    name: { uz: 'Suv 1.5l', ru: 'Вода 1,5л', en: 'Water 1.5l' },
    price: 3500,
    image: images.cola,
    badge: null,
    category: 'drinks',
    isFeatured: false,
  },
  {
    id: 14,
    name: { uz: 'Sariyog\' 200g', ru: 'Масло 200г', en: 'Butter 200g' },
    price: 16000,
    image: images.cheese,
    badge: null,
    category: 'dairy',
    isFeatured: false,
  },
  {
    id: 15,
    name: { uz: 'Limon 500g', ru: 'Лимоны 500г', en: 'Lemons 500g' },
    price: 12000,
    image: images.eggs,
    badge: 'NEW',
    category: 'fruits',
    isFeatured: false,
  },
]

const BANNERS = [
  {
    id: 1,
    title: { uz: '20%', ru: '20%', en: '20%' },
    subtitle: { uz: 'Kola Zero chegirmasi', ru: 'Скидка на колу зеро', en: 'Discount on Cola Zero' },
    image: images.cola,
    gradient: 'linear-gradient(135deg, #2DB84B 0%, #1aac40 55%, #0d8c30 100%)',
  },
  {
    id: 2,
    title: { uz: 'Yangi!', ru: 'Новое!', en: 'New!' },
    subtitle: { uz: 'Sut mahsulotlari yetib keldi', ru: 'Молочная продукция в наличии', en: 'Fresh dairy is here' },
    image: images.milk,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 3,
    title: { uz: 'Tekin', ru: 'Бесплатно', en: 'Free' },
    subtitle: { uz: '50k dan ortiq yetkazib berish', ru: 'Доставка от 50к', en: 'Delivery over 50k' },
    image: images.bread,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
]

const ORDERS = [
  {
    id: '#ORD-1042',
    status: 'delivering',
    date: '25 apr, 2026',
    time: '14:32',
    arrivalMin: 12,
    address: 'Mustaqillik ko\'chasi 52 uy',
    items: [
      { name: { uz: 'Tuxum 10 dona', ru: 'Яйца 10 штук', en: 'Eggs 10 pcs' }, qty: 1, price: 20000 },
      { name: { uz: 'Kola Zero 0.5l', ru: 'Кола зеро 0,5', en: 'Cola Zero 0.5l' }, qty: 2, price: 7000 },
      { name: { uz: 'Non', ru: 'Хлеб', en: 'Bread' }, qty: 1, price: 3000 },
    ],
    total: 37000,
  },
  {
    id: '#ORD-1041',
    status: 'preparing',
    date: '25 apr, 2026',
    time: '14:10',
    arrivalMin: 25,
    address: 'Mustaqillik ko\'chasi 52 uy',
    items: [
      { name: { uz: 'Orbit Fresh', ru: 'Орбит фреш', en: 'Orbit Fresh' }, qty: 3, price: 5000 },
      { name: { uz: 'Pishloq 200g', ru: 'Сыр 200г', en: 'Cheese 200g' }, qty: 1, price: 25000 },
    ],
    total: 40000,
  },
  {
    id: '#ORD-1038',
    status: 'delivered',
    date: '24 apr, 2026',
    time: '11:15',
    arrivalMin: 0,
    address: 'Mustaqillik ko\'chasi 52 uy',
    items: [
      { name: { uz: 'Sut 1l', ru: 'Молоко 1л', en: 'Milk 1l' }, qty: 2, price: 12000 },
    ],
    total: 24000,
  },
]

function delay(ms = 80) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function getCategories() {
  await delay()
  return CATEGORIES
}

export async function getProducts() {
  await delay()
  return PRODUCTS
}

export async function getFeaturedProducts() {
  await delay()
  return PRODUCTS.filter((p) => p.isFeatured)
}

export async function getPromoBanners() {
  await delay()
  return BANNERS
}

export async function getOrderHistory() {
  await delay()
  return ORDERS
}

export async function getUserProfile() {
  await delay()
  return {
    name: 'Guest',
    phone: '+998 90 123 45 67',
    ordersCount: 45,
    favoritesCount: 12,
    couponsCount: 2,
  }
}

export async function placeOrder(orderData) {
  await delay(200)
  return {
    success: true,
    orderId: '#ORD-' + Math.floor(1000 + Math.random() * 9000),
  }
}
