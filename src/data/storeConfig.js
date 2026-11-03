
const storeConfig = {
  brandName: 'CHRIS KAY',
  brandNumber: '01',
  tagline: 'Wear your own story.',
  announcement: 'Independent fashion · Est. 2026',

  currency: 'GHS',
  locale: 'en-GH',

  contactEmail: 'nb0592495@gmail.com',

  theme: {
    background: '#0a0a0a',
    surface: '#101010',
    text: '#ffffff',
    muted: '#a3a3a3',
    accent: '#ffffff',
  },
}

export function formatPrice(amount) {
  return new Intl.NumberFormat(storeConfig.locale, {
    style: 'currency',
    currency: storeConfig.currency,
  }).format(amount)
}

export default storeConfig
