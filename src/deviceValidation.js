export const deviceModelOptions = [
  {
    brand: 'Apple',
    models: ['iPhone', 'iPad', 'MacBook', 'iMac', 'Apple Watch', 'AirPods'],
  },
  {
    brand: 'Samsung',
    models: [
      'Samsung Galaxy',
      'Samsung Galaxy Tab',
      'Samsung Galaxy Watch',
      'Samsung Galaxy Buds',
      'Samsung Galaxy Z Flip',
      'Samsung Galaxy Z Fold',
    ],
  },
  {
    brand: 'Google',
    models: ['Google Pixel', 'Google Chromebook', 'Google Nest'],
  },
  {
    brand: 'Dell',
    models: ['Dell Latitude', 'Dell Inspiron', 'Dell XPS', 'Dell Alienware'],
  },
  {
    brand: 'HP',
    models: ['HP ProBook', 'HP EliteBook', 'HP Pavilion', 'HP Omen'],
  },
  {
    brand: 'Lenovo',
    models: ['Lenovo ThinkPad', 'Lenovo IdeaPad', 'Lenovo Legion', 'Lenovo Yoga'],
  },
  {
    brand: 'ASUS',
    models: ['ASUS ROG', 'ASUS Zenbook', 'ASUS Vivobook'],
  },
  {
    brand: 'Acer',
    models: ['Acer Predator', 'Acer Aspire'],
  },
  {
    brand: 'MSI',
    models: ['MSI Stealth', 'MSI Raider'],
  },
  {
    brand: 'Microsoft',
    models: ['Microsoft Surface'],
  },
  {
    brand: 'Sony',
    models: ['Sony PlayStation 5 (PS5)', 'Sony PlayStation 4 (PS4)', 'Sony Xperia'],
  },
  {
    brand: 'Nintendo',
    models: ['Nintendo Switch'],
  },
  {
    brand: 'Xbox',
    models: ['Xbox Series X', 'Xbox Series S'],
  },
]

const allowedDevicePatterns = [
  /\b(?:apple|iphone|ipad|macbook|imac|apple\s?watch|airpods)\b/i,
  /\b(?:samsung|galaxy|galaxy\s?(?:tab|watch|buds)|z\s?flip|z\s?fold)\b/i,
  /\b(?:google|pixel|chromebook|nest)\b/i,
  /\b(?:dell|latitude|inspiron|xps|alienware)\b/i,
  /\b(?:hp|probook|elitebook|pavilion|omen)\b/i,
  /\b(?:lenovo|thinkpad|ideapad|legion|yoga)\b/i,
  /\b(?:asus|rog|zenbook|vivobook)\b/i,
  /\b(?:acer|predator|aspire)\b/i,
  /\b(?:msi|stealth|raider)\b/i,
  /\b(?:microsoft|surface)\b/i,
  /\b(?:sony|playstation|ps[45]|xperia)\b/i,
  /\b(?:nintendo|switch)\b/i,
  /\b(?:xbox|series\s?[xs])\b/i,
]

export function getDeviceModelError(deviceModel) {
  const normalizedModel = deviceModel.trim()
  if (!normalizedModel) return 'Device model is required.'

  if (!allowedDevicePatterns.some((pattern) => pattern.test(normalizedModel))) {
    return 'Please enter a recognized consumer electronic device brand or model (e.g., iPhone, MacBook, Galaxy, ThinkPad, PS5).'
  }

  return ''
}
