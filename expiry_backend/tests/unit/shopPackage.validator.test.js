const { validationResult } = require('express-validator');
const shopPackageValidator = require('../../validators/shopPackage.validator');

// express-validator zincirlerini gerçek middleware çağrısı yapmadan test etmek için
// her rule'u sahte bir req üzerinde .run() ile çalıştırıp validationResult topluyoruz.
// Bu, validate.js middleware'ini mock'lamadan gerçek validasyon mantığını test eder.
async function runValidation(rules, body) {
  const req = { body };
  await Promise.all(rules.map(rule => rule.run(req)));
  return validationResult(req);
}

const validPackageBase = {
  name: 'Test Paketi',
  quantity: 1,
  deliveryStart: '2027-01-01T10:00:00Z',
  deliveryEnd: '2027-01-01T18:00:00Z',
};

describe('shopPackage.validator.createPackage', () => {
  it('name gönderilmezse hata vermez (opsiyonel)', async () => {
    const result = await runValidation(shopPackageValidator.createPackage, {
      quantity: 1,
      deliveryStart: '2027-01-01T10:00:00Z',
      deliveryEnd: '2027-01-01T18:00:00Z',
      products: [{ id: 1, quantity: 1 }],
    });

    const nameErrors = result.array().filter(e => e.path === 'name');
    expect(nameErrors).toHaveLength(0);
  });

  it('name boş string gönderilirse hata vermez (checkFalsy)', async () => {
    const result = await runValidation(shopPackageValidator.createPackage, {
      ...validPackageBase,
      name: '',
      products: [{ id: 1, quantity: 1 }],
    });

    const nameErrors = result.array().filter(e => e.path === 'name');
    expect(nameErrors).toHaveLength(0);
  });

  it('products dizisi eksikse hata döner', async () => {
    const result = await runValidation(shopPackageValidator.createPackage, {
      ...validPackageBase,
    });

    expect(result.isEmpty()).toBe(false);
  });

  it('products boş dizi ise hata döner', async () => {
    const result = await runValidation(shopPackageValidator.createPackage, {
      ...validPackageBase,
      products: [],
    });

    expect(result.isEmpty()).toBe(false);
  });

  it('bir üründe hem id hem newProduct varsa hata döner', async () => {
    const result = await runValidation(shopPackageValidator.createPackage, {
      ...validPackageBase,
      products: [{
        id: 1,
        newProduct: { name: 'Ekmek', price: 10, expiryDate: '2027-01-01' },
        quantity: 1,
      }],
    });

    expect(result.isEmpty()).toBe(false);
  });

  it('bir üründe id de newProduct de yoksa hata döner', async () => {
    const result = await runValidation(shopPackageValidator.createPackage, {
      ...validPackageBase,
      products: [{ quantity: 1 }],
    });

    expect(result.isEmpty()).toBe(false);
  });

  it('geçerli id ile ürün gönderilirse hata vermez', async () => {
    const result = await runValidation(shopPackageValidator.createPackage, {
      ...validPackageBase,
      products: [{ id: 1, quantity: 2 }],
    });

    expect(result.isEmpty()).toBe(true);
  });

  it('geçerli newProduct ile ürün gönderilirse hata vermez', async () => {
    const result = await runValidation(shopPackageValidator.createPackage, {
      ...validPackageBase,
      products: [{
        newProduct: { name: 'Taze Poğaça', price: 15, expiryDate: '2027-01-01' },
        quantity: 1,
      }],
    });

    expect(result.isEmpty()).toBe(true);
  });

  it('newProduct.expiryDate eksikse hata döner', async () => {
    const result = await runValidation(shopPackageValidator.createPackage, {
      ...validPackageBase,
      products: [{
        newProduct: { name: 'Taze Poğaça', price: 15 },
        quantity: 1,
      }],
    });

    expect(result.isEmpty()).toBe(false);
  });

  it('newProduct.expiryDate geçersiz formatta ise hata döner', async () => {
    const result = await runValidation(shopPackageValidator.createPackage, {
      ...validPackageBase,
      products: [{
        newProduct: { name: 'Taze Poğaça', price: 15, expiryDate: 'geçersiz-tarih' },
        quantity: 1,
      }],
    });

    expect(result.isEmpty()).toBe(false);
  });

  it('newProduct.name boşsa hata döner', async () => {
    const result = await runValidation(shopPackageValidator.createPackage, {
      ...validPackageBase,
      products: [{
        newProduct: { name: '  ', price: 15, expiryDate: '2027-01-01' },
        quantity: 1,
      }],
    });

    expect(result.isEmpty()).toBe(false);
  });

  it('newProduct.price negatifse hata döner', async () => {
    const result = await runValidation(shopPackageValidator.createPackage, {
      ...validPackageBase,
      products: [{
        newProduct: { name: 'Taze Poğaça', price: -5, expiryDate: '2027-01-01' },
        quantity: 1,
      }],
    });

    expect(result.isEmpty()).toBe(false);
  });

  it('ürün quantity 0 veya eksikse hata döner', async () => {
    const result = await runValidation(shopPackageValidator.createPackage, {
      ...validPackageBase,
      products: [{ id: 1, quantity: 0 }],
    });

    expect(result.isEmpty()).toBe(false);
  });

  it('deliveryStart/deliveryEnd geçersizse hata döner', async () => {
    const result = await runValidation(shopPackageValidator.createPackage, {
      ...validPackageBase,
      deliveryStart: 'geçersiz',
      products: [{ id: 1, quantity: 1 }],
    });

    const deliveryErrors = result.array().filter(e => e.path === 'deliveryStart');
    expect(deliveryErrors.length).toBeGreaterThan(0);
  });
});

describe('shopPackage.validator.updatePackage', () => {
  it('products gönderilmezse hata vermez (opsiyonel)', async () => {
    const result = await runValidation(shopPackageValidator.updatePackage, {
      name: 'Güncellenmiş Ad',
    });

    expect(result.isEmpty()).toBe(true);
  });

  it('name boş string gönderilirse hata vermez (checkFalsy, otomatik isme düşer)', async () => {
    const result = await runValidation(shopPackageValidator.updatePackage, {
      name: '',
      products: [{ id: 1, quantity: 1 }],
    });

    const nameErrors = result.array().filter(e => e.path === 'name');
    expect(nameErrors).toHaveLength(0);
  });

  it('products gönderilirse aynı id/newProduct kuralları uygulanır', async () => {
    const result = await runValidation(shopPackageValidator.updatePackage, {
      products: [{
        newProduct: { name: 'Yeni Ürün', price: 10 }, // expiryDate eksik
        quantity: 1,
      }],
    });

    expect(result.isEmpty()).toBe(false);
  });

  it('geçerli newProduct ile products gönderilirse hata vermez', async () => {
    const result = await runValidation(shopPackageValidator.updatePackage, {
      products: [{
        newProduct: { name: 'Yeni Ürün', price: 10, expiryDate: '2027-01-01' },
        quantity: 1,
      }],
    });

    expect(result.isEmpty()).toBe(true);
  });
});