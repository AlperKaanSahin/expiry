const crypto = require('crypto');
const Iyzipay = require('iyzipay');

describe('iyzicoService.verifyWebhookSignature', () => {
  const originalSecretKey = process.env.IYZICO_SECRET_KEY;

  beforeAll(() => {
    process.env.IYZICO_SECRET_KEY = 'test-secret-key';
  });

  afterAll(() => {
    process.env.IYZICO_SECRET_KEY = originalSecretKey;
  });


  const iyzicoService = require('../../services/iyzicoService');

  const samplePayload = {
    iyziEventType: 'CHECKOUT_FORM_AUTH',
    iyziPaymentId: '123456',
    token: 'abc-token-def',
    paymentConversationId: 'order-1-1789800000000',
    status: 'SUCCESS',
  };

  function buildValidSignature(payload, secretKey = process.env.IYZICO_SECRET_KEY) {
    const key = `${secretKey}${payload.iyziEventType}${payload.iyziPaymentId}${payload.token}${payload.paymentConversationId}${payload.status}`;
    return crypto.createHmac('sha256', secretKey).update(key).digest('hex');
  }

  it('doğru imzayı kabul eder', () => {
    const signature = buildValidSignature(samplePayload);
    expect(iyzicoService.verifyWebhookSignature(samplePayload, signature)).toBe(true);
  });

  it('yanlış bir imzayı (başka bir payload için üretilmiş) reddeder', () => {
    const wrongSignature = buildValidSignature({ ...samplePayload, status: 'FAILURE' });
    expect(iyzicoService.verifyWebhookSignature(samplePayload, wrongSignature)).toBe(false);
  });

  it('payload\'daki tek bir alan (iyziPaymentId) değişirse aynı imza artık geçersiz olur', () => {
    const signature = buildValidSignature(samplePayload);
    const tamperedPayload = { ...samplePayload, iyziPaymentId: '999999' };

    expect(iyzicoService.verifyWebhookSignature(tamperedPayload, signature)).toBe(false);
  });

  it('payload\'daki status alanı değişirse (SUCCESS -> FAILURE) aynı imza artık geçersiz olur', () => {
    const signature = buildValidSignature(samplePayload);
    const tamperedPayload = { ...samplePayload, status: 'FAILURE' };

    expect(iyzicoService.verifyWebhookSignature(tamperedPayload, signature)).toBe(false);
  });

  it('imza header\'ı undefined ise exception fırlatmadan false döner', () => {
    expect(iyzicoService.verifyWebhookSignature(samplePayload, undefined)).toBe(false);
  });

  it('imza header\'ı null ise exception fırlatmadan false döner', () => {
    expect(iyzicoService.verifyWebhookSignature(samplePayload, null)).toBe(false);
  });

  it('imza header\'ı boş string ise exception fırlatmadan false döner', () => {
    expect(iyzicoService.verifyWebhookSignature(samplePayload, '')).toBe(false);
  });

  it('farklı uzunlukta bir imza verilirse exception fırlatmadan false döner (timingSafeEqual crash koruması)', () => {
    expect(iyzicoService.verifyWebhookSignature(samplePayload, 'cok-kisa-bir-deger')).toBe(false);
  });

  it('yanlış secretKey ile üretilmiş bir imzayı reddeder', () => {
    const signature = buildValidSignature(samplePayload, 'baska-bir-secret');
    expect(iyzicoService.verifyWebhookSignature(samplePayload, signature)).toBe(false);
  });
});

describe('iyzicoService.isValidTcNo', () => {
  const { isValidTcNo } = require('../../services/iyzicoService');

  it('geçerli checksum\'lı bir TC no\'yu kabul eder (projede test placeholder\'ı olarak kullanılan değer)', () => {
    expect(isValidTcNo('12345678950')).toBe(true);
  });

  it('son hanesi bozuk (checksum tutmayan) bir TC no\'yu reddeder', () => {
    expect(isValidTcNo('12345678951')).toBe(false);
  });

  it('0 ile başlayan bir TC no\'yu reddeder', () => {
    expect(isValidTcNo('01234567890')).toBe(false);
  });

  it('10 haneli (eksik) bir TC no\'yu reddeder', () => {
    expect(isValidTcNo('1234567895')).toBe(false);
  });

  it('12 haneli (fazla) bir TC no\'yu reddeder', () => {
    expect(isValidTcNo('123456789501')).toBe(false);
  });

  it('rakam olmayan karakter içeren bir TC no\'yu reddeder', () => {
    expect(isValidTcNo('1234567895a')).toBe(false);
  });

  it('null için exception fırlatmadan false döner', () => {
    expect(isValidTcNo(null)).toBe(false);
  });

  it('undefined için exception fırlatmadan false döner', () => {
    expect(isValidTcNo(undefined)).toBe(false);
  });
});

describe('iyzicoService.isValidTurkishIban', () => {
  const { isValidTurkishIban } = require('../../services/iyzicoService');

  it('geçerli checksum\'lı bir Türk IBAN\'ını kabul eder', () => {
    expect(isValidTurkishIban('TR330006100519786457841326')).toBe(true);
  });

  it('son hanesi bozuk (checksum tutmayan) bir IBAN\'ı reddeder', () => {
    expect(isValidTurkishIban('TR330006100519786457841327')).toBe(false);
  });

  it('TR ile başlamayan bir IBAN\'ı reddeder', () => {
    expect(isValidTurkishIban('DE330006100519786457841326')).toBe(false);
  });

  it('yanlış uzunlukta (1 hane eksik) bir IBAN\'ı reddeder', () => {
    expect(isValidTurkishIban('TR33000610051978645784132')).toBe(false);
  });

  it('boşluklu girilen geçerli bir IBAN\'ı kabul eder (kullanıcı 4\'lü gruplar halinde yapıştırabilir)', () => {
    expect(isValidTurkishIban('TR33 0006 1005 1978 6457 8413 26')).toBe(true);
  });

  it('küçük harfle başlayan "tr" prefix\'ini de kabul eder (case-insensitive)', () => {
    expect(isValidTurkishIban('tr330006100519786457841326')).toBe(true);
  });

  it('null için exception fırlatmadan false döner', () => {
    expect(isValidTurkishIban(null)).toBe(false);
  });
});

describe('iyzicoService.isValidVkn', () => {
  const { isValidVkn } = require('../../services/iyzicoService');

  it('10 haneli bir VKN\'yi kabul eder', () => {
    expect(isValidVkn('1234567890')).toBe(true);
  });

  it('9 haneli (eksik) bir VKN\'yi reddeder', () => {
    expect(isValidVkn('123456789')).toBe(false);
  });

  it('11 haneli (fazla) bir VKN\'yi reddeder', () => {
    expect(isValidVkn('12345678901')).toBe(false);
  });

  it('rakam olmayan karakter içeren bir VKN\'yi reddeder', () => {
    expect(isValidVkn('123456789a')).toBe(false);
  });

  it('null için exception fırlatmadan false döner', () => {
    expect(isValidVkn(null)).toBe(false);
  });
});