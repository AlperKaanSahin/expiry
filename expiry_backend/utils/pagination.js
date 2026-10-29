const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

// page/limit query parametrelerini güvenli sayılara çevirir. limit üst sınırsız olursa
// ?limit=1000000 tüm tabloyu tek istekte çeker; page negatif olursa negatif OFFSET SQL
// hatası (500) verir. Geçersiz/eksik değerlerde varsayılana düşer.
function parsePagination(query = {}, { defaultLimit = DEFAULT_PAGE_SIZE, maxLimit = MAX_PAGE_SIZE } = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);

  const requested = parseInt(query.limit, 10);
  const limit = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, maxLimit)
    : defaultLimit;

  return { page, limit };
}

module.exports = { parsePagination, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE };