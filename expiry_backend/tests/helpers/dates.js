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

module.exports = { futureDate, futureIso };