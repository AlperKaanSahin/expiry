const pad = (n) => String(n).padStart(2, '0');

// Bugünden `days` gün sonrasının YEREL takvim günü (YYYY-MM-DD). Servisteki
// isDateExpired/startOfDay yerel gün kullandığı için UTC değil yerel hesaplanır.
function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Bugünden `days` gün sonrasının, verilen UTC saatindeki ISO zaman damgası.
function futureIso(days, hourUtc = 10) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hourUtc, 0, 0, 0);
  return d.toISOString();
}

// Ham SQL replacements'ına Date nesnesi verilirse Sequelize onu process'in YEREL saat
// dilimine göre biçimlendirir; model üzerinden yazılan DATETIME değerleri ise UTC
// saklanıyor. Yerel saat UTC değilse (örn. UTC+3) değer kayar. Ham SQL'de zaman
// damgasını bu fonksiyonla UTC 'YYYY-MM-DD HH:mm:ss' string'i olarak ver.
function utcSqlDateTime(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

module.exports = { futureDate, futureIso, utcSqlDateTime };