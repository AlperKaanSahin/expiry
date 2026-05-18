const { Package, Shop, PackageProduct, ShopProduct, PackageUnit } = require('../models');

module.exports = {
  // Sadece giriş yapan marketin paketlerini döndür
  list: async (req, res) => {
    try {
      const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
      if (!shop) return res.json([]);

      // Tüm paketleri çek (isSold filtresi olmadan)
      const packages = await Package.findAll({
        where: { shopId: shop.id },
        include: [
          {
            model: PackageProduct,
            include: [
              {
                model: ShopProduct,
                attributes: ['id', 'name', 'price']
              }
            ]
          }
        ]
      });

      // Sadece kalan kutusu olanları döndür
      const result = [];
      for (const pkg of packages) {
        const products = (pkg.PackageProducts || [])
          .filter(pp => pp && pp.ShopProduct)
          .map(pp => ({
            id: pp.ShopProduct.id,
            name: pp.ShopProduct.name,
            price: pp.ShopProduct.price,
            quantity: pp.quantity
          }));

        const totalPrice = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

        // Kalan kutu sayısı
        const remainingUnits = await PackageUnit.count({ where: { packageId: pkg.id, isSold: false } });

        if (remainingUnits > 0) {
          result.push({
            id: pkg.id,
            name: pkg.name,
            price: pkg.price,
            description: pkg.description,
            deliveryStart: pkg.deliveryStart,
            deliveryEnd: pkg.deliveryEnd,
            products,
            totalPrice,
            autoPriceDropEnabled: pkg.autoPriceDropEnabled ?? false,
            priceDropInterval: pkg.priceDropInterval ?? '',
            priceDropAmount: pkg.priceDropAmount ?? '',
            minPriceDropLimit: pkg.minPriceDropLimit ?? '',
            quantity: remainingUnits // Sadece kalan kutu adedi!
          });
        }
      }

      res.json(result);

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Paketler yüklenemedi' });
    }
  },


  // Yeni paket oluştur
  create: async (req, res) => {
    try {
      const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
      if (!shop) return res.status(400).json({ error: 'Market bulunamadı' });

      const { name, description, price, products, deliveryStart, deliveryEnd, autoPriceDropEnabled, priceDropAmount, priceDropInterval, minPriceDropLimit, quantity } = req.body;



      // Ürünlerin toplam fiyatını hesapla
      let calculatedPrice = 0;
      if (Array.isArray(products)) {
        calculatedPrice = products.reduce((sum, p) => sum + (Number(p.price) * Number(p.quantity)), 0);
      }
      const finalPrice = price !== undefined && price !== null && price !== '' ? Number(price) : calculatedPrice;

      // Paketi oluştur
      const newPackage = await Package.create({
        name,
        description,
        price: finalPrice,
        shopId: shop.id,
        deliveryStart,
        deliveryEnd,
        autoPriceDropEnabled,
        priceDropAmount,
        priceDropInterval,
        minPriceDropLimit,
        quantity
      });

      // Her zaman quantity kadar PackageUnit oluştur
      for (let i = 0; i < (Number(quantity) || 1); i++) {
        await PackageUnit.create({ packageId: newPackage.id, isSold: false });
      }

      // Ürünleri ilişkilendir ve stoktan düş
      if (Array.isArray(products)) {
        for (const p of products) {
          await PackageProduct.create({
            packageId: newPackage.id,
            shopProductId: p.id,
            quantity: p.quantity,
            price: p.price
          });
          // Ürün stoktan düş
          const product = await ShopProduct.findByPk(p.id);
          if (product) {
            const toplamDusulecek = (Number(quantity) || 1) * (Number(p.quantity) || 1);
            product.quantity = Math.max(0, (product.quantity || 0) - toplamDusulecek);
            await product.save();
          }
        }
      }

      res.json(newPackage);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Paket oluşturulamadı' });
    }
  },
  delete: async (req, res) => {
    try {
      const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
      if (!shop) return res.status(400).json({ error: 'Market bulunamadı' });

      const { id } = req.params;
      const { count } = req.body; 

      const pkg = await Package.findOne({ where: { id, shopId: shop.id } });
      if (!pkg) return res.status(404).json({ error: 'Paket bulunamadı' });

      // Kalan kutu sayısını PackageUnit tablosundan bul
      const remainingUnits = await PackageUnit.count({ where: { packageId: pkg.id, isSold: false } });

      if (remainingUnits <= 1 || !count) {
        // quantity 1 ise veya count yoksa: paketi tamamen sil
        await PackageProduct.destroy({ where: { packageId: pkg.id } });
        await PackageUnit.destroy({ where: { packageId: pkg.id } });
        await Package.destroy({ where: { id: pkg.id, shopId: shop.id } });
        return res.json({ success: true, deletedAll: true });
      } else {
        // quantity > 1 ve count varsa: sadece istenen kadar PackageUnit sil
        const unitsToDelete = await PackageUnit.findAll({
          where: { packageId: pkg.id, isSold: false },
          order: [['id', 'DESC']],
          limit: Number(count)
        });
        for (const unit of unitsToDelete) {
          await unit.destroy();
        }
        // quantity değerini güncelle
        const newQuantity = await PackageUnit.count({ where: { packageId: pkg.id, isSold: false } });
        await pkg.update({ quantity: newQuantity });

        return res.json({ success: true, deletedCount: unitsToDelete.length, remaining: newQuantity });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Paket silinemedi' });
    }
  },
  update: async (req, res) => {
    try {
      const shop = await Shop.findOne({ where: { ownerId: req.user.id } });
      if (!shop) return res.status(400).json({ error: 'Market bulunamadı' });

      const { id } = req.params;
      const { name, description, price, products, deliveryStart, deliveryEnd, autoPriceDropEnabled, priceDropAmount, priceDropInterval, minPriceDropLimit, quantity } = req.body;

      // Ürünlerin toplam fiyatını hesapla
      let calculatedPrice = 0;
      if (Array.isArray(products)) {
        calculatedPrice = products.reduce((sum, p) => sum + (Number(p.price) * Number(p.quantity)), 0);
      }

      // Eğer price gelmezse ürünlerin toplam fiyatını kullan
      const finalPrice = price !== undefined && price !== null && price !== '' ? Number(price) : calculatedPrice;

      const pkg = await Package.findOne({ where: { id, shopId: shop.id } });
      if (!pkg) return res.status(404).json({ error: 'Paket bulunamadı' });

      await pkg.update({
        name,
        description,
        price: finalPrice,
        deliveryStart,
        deliveryEnd,
        autoPriceDropEnabled,
        priceDropAmount,
        priceDropInterval,
        minPriceDropLimit,
        quantity
      });

      // Ürün ilişkilerini güncelle
      if (Array.isArray(products)) {
        await PackageProduct.destroy({ where: { packageId: pkg.id } });
        for (const p of products) {
          await PackageProduct.create({
            packageId: pkg.id,
            shopProductId: p.id,
            quantity: p.quantity,
            price: p.price
          });
        }
      }

      // PackageUnit güncellemesi
      const currentCount = await PackageUnit.count({ where: { packageId: pkg.id } });
      if (quantity > currentCount) {
        // Eksik olan kadar yeni PackageUnit ekle
        for (let i = 0; i < quantity - currentCount; i++) {
          await PackageUnit.create({ packageId: pkg.id, isSold: false });
        }
      } else if (quantity < currentCount) {
        // Fazla olan ve satılmamış PackageUnit'leri sil
        const unitsToDelete = await PackageUnit.findAll({
          where: { packageId: pkg.id, isSold: false },
          order: [['id', 'DESC']],
          limit: currentCount - quantity
        });
        for (const unit of unitsToDelete) {
          await unit.destroy();
        }
      }

      // quantity değerini PackageUnit tablosundan güncelle
      const remainingUnits = await PackageUnit.count({ where: { packageId: pkg.id, isSold: false } });
      await pkg.update({ quantity: remainingUnits });

      res.json({ success: true, package: pkg });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Paket güncellenemedi' });
    }
  },

};