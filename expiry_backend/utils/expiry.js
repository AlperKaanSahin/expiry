// SKT (son kullanma tarihi) karşılaştırmaları için tek doğru kaynak. Gün bazlı
// karşılaştırma yapılır (saat/dakika önemsiz) — SKT'si bugün olan ürün hâlâ
// satılabilir kabul edilir (orderService.assertPackageProductsNotExpired'daki
// mantıkla tutarlı, o fonksiyona dokunulmadı).
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isDateExpired(expiryDate) {
  if (!expiryDate) return false;
  return startOfDay(expiryDate) < startOfDay(new Date());
}

module.exports = { startOfDay, isDateExpired };