const { parsePagination, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../../utils/pagination');

describe('parsePagination', () => {
  it('eksik query için varsayılan page ve limit döner', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE });
    expect(parsePagination()).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE });
  });

  it('geçerli değerleri olduğu gibi kullanır', () => {
    expect(parsePagination({ page: '3', limit: '25' })).toEqual({ page: 3, limit: 25 });
  });

  it('limit üst sınırı aşarsa MAX_PAGE_SIZE\'a indirilir', () => {
    expect(parsePagination({ limit: '1000000' }).limit).toBe(MAX_PAGE_SIZE);
  });

  it('negatif, sıfır ya da geçersiz page ve limit varsayılana düşer', () => {
    expect(parsePagination({ page: '-5', limit: '-1' })).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE });
    expect(parsePagination({ page: '0', limit: '0' })).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE });
    expect(parsePagination({ page: 'abc', limit: 'xyz' })).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE });
  });

  it('defaultLimit ve maxLimit override edilebilir', () => {
    expect(parsePagination({}, { defaultLimit: 20 }).limit).toBe(20);
    expect(parsePagination({ limit: '500' }, { maxLimit: 100 }).limit).toBe(100);
  });
});