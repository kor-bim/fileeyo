const toppings = [
  'alfalfa',
  'almonds',
  'anchovies',
  'artichoke',
  'avocado',
  'bacon',
  'basil',
  'bayleaves',
  'bbqchicken',
  'beans',
  'beef',
  'beetroot',
  'bluecheese',
  'brie',
  'broccoli',
  'cajunchicken',
  'camembert',
  'capers',
  'capicolla',
  'cardamon',
  'carrot',
  'cauliflower',
  'cheddar',
  'chickenmasala',
  'chickentikka',
  'chili',
  'chives',
  'chorizo',
  'cilantro',
  'colby',
  'coriander',
  'crayfish',
  'cumin',
  'dill',
  'duck',
  'eggplant',
  'fenugreek',
  'feta',
  'fungi',
  'garlic',
  'goatcheese',
  'gorgonzola',
  'gouda',
  'ham',
  'jalapeno',
  'laurel',
  'leeks',
  'lettuce',
  'limburger',
  'lobster',
  'manchego',
  'marjoram',
  'meatballs',
  'melon',
  'montereyjack',
  'mozzarella',
  'muenster',
  'mushrooms',
  'olives',
  'onion',
  'oregano',
  'oysters',
  'parsley',
  'parmesan',
  'peanuts',
  'peas',
  'pecans',
  'pepperoni',
  'peppers',
  'pineapple',
  'pinenuts',
  'pistachios',
  'prawn',
  'prosciutto',
  'provolone',
  'ricotta',
  'romano',
  'roquefort',
  'rosemary',
  'salami',
  'salmon',
  'sausage',
  'scallions',
  'shallots',
  'shrimp',
  'snowpeas',
  'spinach',
  'squash',
  'squid',
  'sweetcorn',
  'tomatoes',
  'tuna',
  'turkey',
  'venison',
  'walnuts',
  'watercress',
  'whitebait',
  'zucchini'
]

export const redisConfig = {
  redisURL: 'redis://localhost:6379/0',
  channel: {
    ttl: 60 * 60 // 1 hour
  },
  bodyKeys: {
    uploaderPeerID: {
      min: 3,
      max: 256
    },
    slug: {
      min: 3,
      max: 256
    }
  },
  shortSlug: {
    numChars: 8,
    chars: '0123456789abcdefghijklmnopqrstuvwxyz',
    maxAttempts: 8
  },
  longSlug: {
    numWords: 4,
    words: toppings,
    maxAttempts: 8
  }
}
