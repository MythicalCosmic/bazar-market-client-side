import { images } from '../assets/images.js'

export const CATEGORIES = [
  { id: 'all',    label: 'Новинки',          emoji: '✨', icon: '🆕' },
  { id: 'hot',    label: 'Горячие',           emoji: '🔥', icon: '🔥' },
  { id: 'dairy',  label: 'Молочные Продукция',emoji: '🥛', icon: '🥛' },
  { id: 'bread',  label: 'Хлеб Выпечка',     emoji: '🍞', icon: '🍞' },
  { id: 'sweets', label: 'Снеки Сладости',    emoji: '🍬', icon: '🍬' },
  { id: 'fruits', label: 'Фрукты',            emoji: '🍎', icon: '🍎' },
]

export const PRODUCTS = [
  { id: 1, name: 'Яйца 10 штук',  price: 20000, image: images.eggs,   badge: null,  category: 'dairy'  },
  { id: 2, name: 'Кола зеро 0,5', price: 7000,  image: images.cola,   badge: null,  category: 'all'    },
  { id: 3, name: 'Орбит фреш',    price: 5000,  image: images.orbit,  badge: 'NEW', category: 'sweets' },
  { id: 4, name: 'Хлеб',          price: 3000,  image: images.bread,  badge: null,  category: 'bread'  },
  { id: 5, name: 'Сыр 200г',      price: 25000, image: images.cheese, badge: null,  category: 'dairy'  },
  { id: 6, name: 'Молоко 1л',     price: 12000, image: images.milk,   badge: 'HOT', category: 'dairy'  },
]
