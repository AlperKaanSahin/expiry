jest.mock('../../config/iyzico');

const getIyzico = require('../../config/iyzico');
const {
  initializeCheckoutForm,
  retrieveCheckoutForm,
  approvePaymentTransaction,
  createOrUpdateSubMerchant,
} = require('../../services/iyzicoService');

// util.promisify(fn).bind(namespace) — fn'nin (request, callback) imzasında olması
// yeterli, promisify'ın gerçek Iyzipay SDK'sı olup olmadığını bilmesine gerek yok.
function fakeCallbackFn(implementation) {
  return jest.fn((request, callback) => {
    try {
      const result = implementation(request);
      callback(null, result);
    } catch (err) {
      callback(err);
    }
  });
}

describe('iyzicoService.initializeCheckoutForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('basket item\'ları doğru kurar — subMerchantKey/subMerchantPrice olan item dahil edilir', async () => {
    const createFn = fakeCallbackFn(() => ({
      status: 'success', token: 'tok-1', paymentPageUrl: 'https://pay.example',
    }));
    getIyzico.mockReturnValue({
      checkoutFormInitialize: { create: createFn },
    });

    const order = { id: 1, paidPrice: 66 };
    const basketItems = [
      { id: 'op-1-0', name: 'Paket', price: 55, subMerchantKey: 'sm-key', subMerchantPrice: 55 },
    ];
    const user = { id: 5, firstName: 'A', lastName: 'B', email: 'a@b.com', address: null };

    await initializeCheckoutForm(order, basketItems, user, '1.2.3.4', 'https://cb.example/callback');

    const request = createFn.mock.calls[0][0];
    expect(request.basketItems).toHaveLength(1);
    expect(request.basketItems[0]).toMatchObject({
      id: 'op-1-0', price: '55.00', subMerchantKey: 'sm-key', subMerchantPrice: '55.00',
    });
  });

  it('subMerchantKey/subMerchantPrice olmayan bir item (fee) bu alanları hiç içermez', async () => {
    const createFn = fakeCallbackFn(() => ({ status: 'success', token: 't', paymentPageUrl: 'u' }));
    getIyzico.mockReturnValue({ checkoutFormInitialize: { create: createFn } });

    const order = { id: 1, paidPrice: 66 };
    const basketItems = [{ id: 'fee-1', name: 'Hizmet bedeli', price: 11 }];
    const user = { id: 5, firstName: 'A', lastName: 'B', email: 'a@b.com' };

    await initializeCheckoutForm(order, basketItems, user, '1.2.3.4', 'https://cb.example');

    const request = createFn.mock.calls[0][0];
    expect(request.basketItems[0]).not.toHaveProperty('subMerchantKey');
    expect(request.basketItems[0]).not.toHaveProperty('subMerchantPrice');
  });

  it('price alanını tüm basketItems\'ın toplamı olarak, paidPrice\'ı order.paidPrice\'dan kurar (ikisi de 2 ondalıklı string)', async () => {
    const createFn = fakeCallbackFn(() => ({ status: 'success', token: 't', paymentPageUrl: 'u' }));
    getIyzico.mockReturnValue({ checkoutFormInitialize: { create: createFn } });

    const order = { id: 1, paidPrice: 66 };
    const basketItems = [
      { id: 'op-1-0', name: 'Paket', price: 55, subMerchantKey: 'sm', subMerchantPrice: 55 },
      { id: 'fee-1', name: 'Fee', price: 11 },
    ];
    const user = { id: 5, firstName: 'A', lastName: 'B', email: 'a@b.com' };

    await initializeCheckoutForm(order, basketItems, user, '1.2.3.4', 'https://cb.example');

    const request = createFn.mock.calls[0][0];
    expect(request.price).toBe('66.00');
    expect(request.paidPrice).toBe('66.00');
  });

  it('buyer.identityNumber her zaman sabit placeholder değeri kullanır (kullanıcıdan gerçek TCKN istenmiyor)', async () => {
    const createFn = fakeCallbackFn(() => ({ status: 'success', token: 't', paymentPageUrl: 'u' }));
    getIyzico.mockReturnValue({ checkoutFormInitialize: { create: createFn } });

    const order = { id: 1, paidPrice: 55 };
    const basketItems = [{ id: 'op-1-0', name: 'Paket', price: 55, subMerchantKey: 'sm', subMerchantPrice: 55 }];
    const user = { id: 7, firstName: 'C', lastName: 'D', email: 'c@d.com', address: null };

    await initializeCheckoutForm(order, basketItems, user, '1.2.3.4', 'https://cb.example');

    const request = createFn.mock.calls[0][0];
    expect(request.buyer.identityNumber).toBe('12345678950');
    expect(request.buyer.id).toBe('7');
    expect(request.buyer.ip).toBe('1.2.3.4');
  });

  it('callbackUrl\'i request\'e olduğu gibi geçirir', async () => {
    const createFn = fakeCallbackFn(() => ({ status: 'success', token: 't', paymentPageUrl: 'u' }));
    getIyzico.mockReturnValue({ checkoutFormInitialize: { create: createFn } });

    const order = { id: 1, paidPrice: 55 };
    const basketItems = [{ id: 'op-1-0', name: 'Paket', price: 55, subMerchantKey: 'sm', subMerchantPrice: 55 }];
    const user = { id: 7, firstName: 'C', lastName: 'D', email: 'c@d.com' };

    await initializeCheckoutForm(order, basketItems, user, '1.2.3.4', 'https://cb.example/callback');

    expect(createFn.mock.calls[0][0].callbackUrl).toBe('https://cb.example/callback');
  });

  it('Iyzico status: failure dönerse AppError(502) fırlatır', async () => {
    const createFn = fakeCallbackFn(() => ({ status: 'failure', errorMessage: 'Geçersiz istek' }));
    getIyzico.mockReturnValue({ checkoutFormInitialize: { create: createFn } });

    const order = { id: 1, paidPrice: 55 };
    const basketItems = [{ id: 'op-1-0', name: 'Paket', price: 55, subMerchantKey: 'sm', subMerchantPrice: 55 }];
    const user = { id: 7, firstName: 'C', lastName: 'D', email: 'c@d.com' };

    await expect(
      initializeCheckoutForm(order, basketItems, user, '1.2.3.4', 'https://cb.example')
    ).rejects.toMatchObject({ statusCode: 502, message: 'Geçersiz istek' });
  });

  it('callback\'e sistem hatası (network/timeout) gelirse AppError(502) fırlatır', async () => {
    const createFn = jest.fn((request, callback) => callback(new Error('ECONNREFUSED')));
    getIyzico.mockReturnValue({ checkoutFormInitialize: { create: createFn } });

    const order = { id: 1, paidPrice: 55 };
    const basketItems = [{ id: 'op-1-0', name: 'Paket', price: 55, subMerchantKey: 'sm', subMerchantPrice: 55 }];
    const user = { id: 7, firstName: 'C', lastName: 'D', email: 'c@d.com' };

    await expect(
      initializeCheckoutForm(order, basketItems, user, '1.2.3.4', 'https://cb.example')
    ).rejects.toMatchObject({ statusCode: 502 });
  });
});

describe('iyzicoService.retrieveCheckoutForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('başarılı sonucu olduğu gibi döner', async () => {
    const retrieveFn = fakeCallbackFn(() => ({ paymentStatus: 'SUCCESS', itemTransactions: [] }));
    getIyzico.mockReturnValue({ checkoutForm: { retrieve: retrieveFn } });

    const result = await retrieveCheckoutForm('tok-123');

    expect(result).toEqual({ paymentStatus: 'SUCCESS', itemTransactions: [] });
    expect(retrieveFn.mock.calls[0][0]).toMatchObject({ token: 'tok-123' });
  });

  it('sistem hatası gelirse AppError(502) fırlatır', async () => {
    const retrieveFn = jest.fn((request, callback) => callback(new Error('timeout')));
    getIyzico.mockReturnValue({ checkoutForm: { retrieve: retrieveFn } });

    await expect(retrieveCheckoutForm('tok-123')).rejects.toMatchObject({ statusCode: 502 });
  });
});

describe('iyzicoService.approvePaymentTransaction', () => {
  beforeEach(() => jest.clearAllMocks());

  it('başarılı sonucu döner, paymentTransactionId\'yi request\'e doğru geçirir', async () => {
    const approveFn = fakeCallbackFn(() => ({ status: 'success' }));
    getIyzico.mockReturnValue({ approval: { create: approveFn } });

    const result = await approvePaymentTransaction('tx-999');

    expect(result).toEqual({ status: 'success' });
    expect(approveFn.mock.calls[0][0]).toMatchObject({ paymentTransactionId: 'tx-999' });
  });

  it('Iyzico status: failure dönerse AppError(502) fırlatır', async () => {
    const approveFn = fakeCallbackFn(() => ({ status: 'failure', errorMessage: 'Zaten onaylanmış' }));
    getIyzico.mockReturnValue({ approval: { create: approveFn } });

    await expect(approvePaymentTransaction('tx-999')).rejects.toMatchObject({
      statusCode: 502, message: 'Zaten onaylanmış',
    });
  });

  it('sistem hatası gelirse AppError(502) fırlatır', async () => {
    const approveFn = jest.fn((request, callback) => callback(new Error('ECONNRESET')));
    getIyzico.mockReturnValue({ approval: { create: approveFn } });

    await expect(approvePaymentTransaction('tx-999')).rejects.toMatchObject({ statusCode: 502 });
  });
});

describe('iyzicoService.createOrUpdateSubMerchant', () => {
  beforeEach(() => jest.clearAllMocks());

  it('PERSONAL tipte identityNumber gönderir, taxOffice/taxNumber/legalCompanyTitle göndermez', async () => {
    const createFn = fakeCallbackFn(() => ({ status: 'success', subMerchantKey: 'sm-key-new' }));
    getIyzico.mockReturnValue({ subMerchant: { create: createFn, update: jest.fn() } });

    const shop = { id: 1, address: 'Adres', phone: '5551112233', name: 'Market', subMerchantKey: null };
    const data = {
      subMerchantType: 'PERSONAL', iban: 'TR33...', email: 'a@b.com',
      identityNumber: '12345678950', contactName: 'A', contactSurname: 'B',
    };

    await createOrUpdateSubMerchant(shop, data);

    const request = createFn.mock.calls[0][0];
    expect(request.identityNumber).toBe('12345678950');
    expect(request).not.toHaveProperty('taxOffice');
    expect(request).not.toHaveProperty('legalCompanyTitle');
  });

  it('LIMITED_OR_JOINT_STOCK_COMPANY tipte taxOffice/taxNumber/legalCompanyTitle gönderir, identityNumber=taxNumber olur', async () => {
    const createFn = fakeCallbackFn(() => ({ status: 'success', subMerchantKey: 'sm-key-new' }));
    getIyzico.mockReturnValue({ subMerchant: { create: createFn, update: jest.fn() } });

    const shop = { id: 2, address: 'Adres', phone: '5551112233', name: 'Şirket', subMerchantKey: null };
    const data = {
      subMerchantType: 'LIMITED_OR_JOINT_STOCK_COMPANY', iban: 'TR33...', email: 'a@b.com',
      taxOffice: 'Kadıköy', taxNumber: '1234567890', legalCompanyTitle: 'ABC Ltd.',
      contactName: 'A', contactSurname: 'B',
    };

    await createOrUpdateSubMerchant(shop, data);

    const request = createFn.mock.calls[0][0];
    expect(request.taxOffice).toBe('Kadıköy');
    expect(request.taxNumber).toBe('1234567890');
    expect(request.legalCompanyTitle).toBe('ABC Ltd.');
    expect(request.identityNumber).toBe('1234567890'); // taxNumber ile aynı değer
  });

  it('shop.subMerchantKey zaten varsa update fonksiyonunu çağırır, subMerchantType/subMerchantExternalId göndermez', async () => {
    const updateFn = fakeCallbackFn(() => ({ status: 'success', subMerchantKey: 'sm-key-existing' }));
    getIyzico.mockReturnValue({ subMerchant: { create: jest.fn(), update: updateFn } });

    const shop = { id: 3, address: 'Adres', phone: '555', name: 'Market', subMerchantKey: 'sm-key-existing' };
    const data = {
      subMerchantType: 'PERSONAL', iban: 'TR33...', email: 'a@b.com',
      identityNumber: '12345678950', contactName: 'A', contactSurname: 'B',
    };

    await createOrUpdateSubMerchant(shop, data);

    expect(updateFn).toHaveBeenCalled();
    const request = updateFn.mock.calls[0][0];
    expect(request).not.toHaveProperty('subMerchantType');
    expect(request).not.toHaveProperty('subMerchantExternalId');
    expect(request.subMerchantKey).toBe('sm-key-existing');
  });

  it('shop.subMerchantKey yoksa create fonksiyonunu çağırır (update değil)', async () => {
    const createFn = fakeCallbackFn(() => ({ status: 'success', subMerchantKey: 'yeni-key' }));
    const updateFn = jest.fn();
    getIyzico.mockReturnValue({ subMerchant: { create: createFn, update: updateFn } });

    const shop = { id: 4, address: 'Adres', phone: '555', name: 'Market', subMerchantKey: null };
    const data = {
      subMerchantType: 'PERSONAL', iban: 'TR33...', email: 'a@b.com',
      identityNumber: '12345678950', contactName: 'A', contactSurname: 'B',
    };

    await createOrUpdateSubMerchant(shop, data);

    expect(createFn).toHaveBeenCalled();
    expect(updateFn).not.toHaveBeenCalled();
  });

  it('sistem hatası gelirse AppError(502) fırlatır', async () => {
    const createFn = jest.fn((request, callback) => callback(new Error('bağlantı hatası')));
    getIyzico.mockReturnValue({ subMerchant: { create: createFn, update: jest.fn() } });

    const shop = { id: 5, address: 'Adres', phone: '555', name: 'Market', subMerchantKey: null };
    const data = { subMerchantType: 'PERSONAL', iban: 'TR33...', email: 'a@b.com', identityNumber: '12345678950' };

    await expect(createOrUpdateSubMerchant(shop, data)).rejects.toMatchObject({ statusCode: 502 });
  });
});