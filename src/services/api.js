import { images } from '../assets/images.js'

const CATEGORIES = [
  { id: 'all',     icon: 'sparkles', labelKey: 'cat.all' },
  { id: 'hot',     icon: 'flame',    labelKey: 'cat.hot' },
  { id: 'dairy',   icon: 'dairy',    labelKey: 'cat.dairy' },
  { id: 'bread',   icon: 'bread',    labelKey: 'cat.bread' },
  { id: 'sweets',  icon: 'candy',    labelKey: 'cat.sweets' },
  { id: 'fruits',  icon: 'apple',    labelKey: 'cat.fruits' },
  { id: 'drinks',  icon: 'cup',      labelKey: 'cat.drinks' },
  { id: 'snacks',  icon: 'snack',    labelKey: 'cat.snacks' },
]

const PRODUCTS = [
  {
    id: 1,
    name: { uz: 'Tuxum 10 dona', ru: 'Яйца 10 штук', en: 'Eggs 10 pcs' },
    description: { uz: 'Yangi uy tuxumlari, 10 donali qadoq', ru: 'Свежие домашние яйца, упаковка 10 шт', en: 'Fresh farm eggs, pack of 10' },
    price: 20000, image: images.eggs, badge: null, category: 'dairy', isFeatured: true,
  },
  {
    id: 2,
    name: { uz: 'Kola Zero 0.5l', ru: 'Кола зеро 0,5', en: 'Cola Zero 0.5l' },
    description: { uz: 'Shakartsiz gazlangan ichimlik', ru: 'Газированный напиток без сахара', en: 'Sugar-free carbonated drink' },
    price: 7000, image: images.cola, badge: null, category: 'drinks', isFeatured: true,
  },
  {
    id: 3,
    name: { uz: 'Orbit Fresh', ru: 'Орбит фреш', en: 'Orbit Fresh' },
    description: { uz: 'Yalpiz ta\'mli saqich', ru: 'Жевательная резинка со вкусом мяты', en: 'Mint flavored chewing gum' },
    price: 5000, image: images.orbit, badge: 'NEW', category: 'sweets', isFeatured: false,
  },
  {
    id: 4,
    name: { uz: 'Non', ru: 'Хлеб', en: 'Bread' },
    description: { uz: 'Yangi pishirilgan tandirda non', ru: 'Свежевыпеченный хлеб', en: 'Freshly baked bread' },
    price: 3000, image: images.bread, badge: null, category: 'bread', isFeatured: false,
  },
  {
    id: 5,
    name: { uz: 'Pishloq 200g', ru: 'Сыр 200г', en: 'Cheese 200g' },
    description: { uz: 'Tabiiy qattiq pishloq', ru: 'Натуральный твёрдый сыр', en: 'Natural hard cheese' },
    price: 25000, image: images.cheese, badge: null, category: 'dairy', isFeatured: true,
  },
  {
    id: 6,
    name: { uz: 'Sut 1l', ru: 'Молоко 1л', en: 'Milk 1l' },
    description: { uz: 'Yangi sut, 3.2% yog\'ligi', ru: 'Свежее молоко, 3.2% жирности', en: 'Fresh milk, 3.2% fat' },
    price: 12000, image: images.milk, badge: 'HOT', category: 'dairy', isFeatured: true,
  },
  {
    id: 7,
    name: { uz: 'Yogurt 400g', ru: 'Йогурт 400г', en: 'Yogurt 400g' },
    description: { uz: 'Tabiiy qatiq, 400g', ru: 'Натуральный йогурт, 400г', en: 'Natural yogurt, 400g' },
    price: 9000, image: images.milk, badge: 'NEW', category: 'dairy', isFeatured: false,
  },
  {
    id: 8,
    name: { uz: 'Lavash', ru: 'Лаваш', en: 'Lavash' },
    description: { uz: 'Yupqa lavash, 3 dona', ru: 'Тонкий лаваш, 3 шт', en: 'Thin lavash, 3 pcs' },
    price: 4000, image: images.bread, badge: null, category: 'bread', isFeatured: false,
  },
  {
    id: 9,
    name: { uz: 'Shokolad', ru: 'Шоколад', en: 'Chocolate' },
    description: { uz: 'Sutli shokolad, 100g', ru: 'Молочный шоколад, 100г', en: 'Milk chocolate, 100g' },
    price: 15000, image: images.orbit, badge: 'HOT', category: 'sweets', isFeatured: true,
  },
  {
    id: 10,
    name: { uz: 'Olma 1kg', ru: 'Яблоки 1кг', en: 'Apples 1kg' },
    description: { uz: 'Yangi, shirin olma', ru: 'Свежие, сладкие яблоки', en: 'Fresh, sweet apples' },
    price: 18000, image: images.eggs, badge: null, category: 'fruits', isFeatured: false,
  },
  {
    id: 11,
    name: { uz: 'Banan 1kg', ru: 'Бананы 1кг', en: 'Bananas 1kg' },
    description: { uz: 'Pishgan import bananlari', ru: 'Спелые импортные бананы', en: 'Ripe imported bananas' },
    price: 22000, image: images.eggs, badge: null, category: 'fruits', isFeatured: true,
  },
  {
    id: 12,
    name: { uz: 'Chips Lays', ru: 'Чипсы Лейс', en: 'Lays Chips' },
    description: { uz: 'Kartoshka chipslari, tuzli', ru: 'Картофельные чипсы, солёные', en: 'Potato chips, salted' },
    price: 10000, image: images.orbit, badge: null, category: 'snacks', isFeatured: false,
  },
  {
    id: 13,
    name: { uz: 'Suv 1.5l', ru: 'Вода 1,5л', en: 'Water 1.5l' },
    description: { uz: 'Toza ichimlik suvi', ru: 'Чистая питьевая вода', en: 'Clean drinking water' },
    price: 3500, image: images.cola, badge: null, category: 'drinks', isFeatured: false,
  },
  {
    id: 14,
    name: { uz: 'Sariyog\' 200g', ru: 'Масло 200г', en: 'Butter 200g' },
    description: { uz: 'Tabiiy sariyog\', 82%', ru: 'Натуральное масло, 82%', en: 'Natural butter, 82%' },
    price: 16000, image: images.cheese, badge: null, category: 'dairy', isFeatured: false,
  },
  {
    id: 15,
    name: { uz: 'Limon 500g', ru: 'Лимоны 500г', en: 'Lemons 500g' },
    description: { uz: 'Yangi limonlar', ru: 'Свежие лимоны', en: 'Fresh lemons' },
    price: 12000, image: images.eggs, badge: 'NEW', category: 'fruits', isFeatured: false,
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
    id: '#ORD-1042', status: 'delivering', date: '25 apr, 2026', time: '14:32', arrivalMin: 12,
    address: 'Mustaqillik ko\'chasi 52 uy',
    items: [
      { name: { uz: 'Tuxum 10 dona', ru: 'Яйца 10 штук', en: 'Eggs 10 pcs' }, qty: 1, price: 20000 },
      { name: { uz: 'Kola Zero 0.5l', ru: 'Кола зеро 0,5', en: 'Cola Zero 0.5l' }, qty: 2, price: 7000 },
      { name: { uz: 'Non', ru: 'Хлеб', en: 'Bread' }, qty: 1, price: 3000 },
    ],
    total: 37000,
  },
  {
    id: '#ORD-1041', status: 'preparing', date: '25 apr, 2026', time: '14:10', arrivalMin: 25,
    address: 'Mustaqillik ko\'chasi 52 uy',
    items: [
      { name: { uz: 'Orbit Fresh', ru: 'Орбит фреш', en: 'Orbit Fresh' }, qty: 3, price: 5000 },
      { name: { uz: 'Pishloq 200g', ru: 'Сыр 200г', en: 'Cheese 200g' }, qty: 1, price: 25000 },
    ],
    total: 40000,
  },
  {
    id: '#ORD-1038', status: 'delivered', date: '24 apr, 2026', time: '11:15', arrivalMin: 0,
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

export async function getCategories() { await delay(); return CATEGORIES }
export async function getProducts() { await delay(); return PRODUCTS }
export async function getFeaturedProducts() { await delay(); return PRODUCTS.filter((p) => p.isFeatured) }
export async function getPromoBanners() { await delay(); return BANNERS }
export async function getOrderHistory() { await delay(); return ORDERS }

export async function getUserProfile() {
  await delay()
  return { name: 'Guest', phone: '+998 90 123 45 67', ordersCount: 45, favoritesCount: 12, couponsCount: 2, referralCode: 'BAZAR-XK42M' }
}

export async function placeOrder(orderData) {
  await delay(200)
  return { success: true, orderId: '#ORD-' + Math.floor(1000 + Math.random() * 9000) }
}
