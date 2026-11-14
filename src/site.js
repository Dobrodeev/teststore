// Общие данные магазина: контакты, адрес, график. Единственное место, где их нужно менять.
require('dotenv').config({ quiet: true });

const url = (process.env.SITE_URL || 'http://localhost:3100').trim().replace(/\/+$/, '');

module.exports = {
  name: 'КанцМаркет',
  url,
  phone: { display: '044 123-45-67', tel: '+380441234567' },
  messenger: { display: '067 123-45-67', tel: '+380671234567' },
  email: 'info@kanzmarket.kiev.ua',
  address: { city: 'Киев', street: 'ул. Братиславская, 7', office: 'офис 2' },
  geo: { latitude: '50.4760874', longitude: '30.6180725' },
  hours: { text: 'Пн–Пт 10:00–17:00', schema: 'Mo-Fr 10:00-17:00', opens: '10:00', closes: '17:00' },
  mapsUrl: 'https://maps.app.goo.gl/yA5rHkK83regR5QAA',
  mapsEmbedUrl: 'https://www.google.com/maps?q=50.4760874,30.6180725&z=17&hl=ru&output=embed',
  socials: [
    'https://www.facebook.com/kanzmarket',
    'https://www.instagram.com/kanzmarket',
    'https://t.me/kanzmarket',
  ],
  ogImage: '/img/og-cover.jpg',
};
