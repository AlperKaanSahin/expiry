import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  StyleSheet,
  RefreshControl,
  StatusBar,
  ScrollView,
  Switch,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import {
  fetchShopOwnPackages,
  addShopPackage,
  updateShopPackage,
  deleteShopPackage,
  fetchShopProducts,
} from '../services/api';
import { COLORS } from '../theme/colors';

const EMPTY_FORM = { name: '', price: '', description: '', quantity: '1' };

const formatDeliveryRange = (start, end) => {
  if (!start || !end) return '-';
  const s = new Date(start);
  const e = new Date(end);
  const sameDay =
    s.getDate() === e.getDate() &&
    s.getMonth() === e.getMonth() &&
    s.getFullYear() === e.getFullYear();

  const dateStr = s.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  const startTime = s.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const endTime = e.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  if (sameDay) return `${dateStr} ${startTime} - ${endTime}`;
  const endDateStr = e.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  return `${dateStr} ${startTime} - ${endDateStr} ${endTime}`;
};

const ShopPackagesScreen = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [deliveryStart, setDeliveryStart] = useState(new Date());
  const [deliveryEnd, setDeliveryEnd] = useState(new Date());
  const [autoPriceDropEnabled, setAutoPriceDropEnabled] = useState(false);
  const [priceDropInterval, setPriceDropInterval] = useState('');
  const [priceDropAmount, setPriceDropAmount] = useState('');
  const [minPriceDropLimit, setMinPriceDropLimit] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [modalError, setModalError] = useState('');

  const loadPackages = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await fetchShopOwnPackages();
      setPackages(data);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Hata', text2: err.toString() });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadPackages(); }, []);

  const openModal = async (pkg = null) => {
    try {
      const products = await fetchShopProducts();
      setAllProducts(products);
      setSelectedPackage(pkg);
      setFormData(pkg ? {
        name: pkg.name || '',
        price: pkg.price != null ? pkg.price.toString() : '',
        description: pkg.description || '',
        quantity: pkg.quantity != null ? pkg.quantity.toString() : '1',
      } : EMPTY_FORM);

      const isAutoDrop = pkg && (
        pkg.autoPriceDropEnabled === true ||
        pkg.autoPriceDropEnabled === 1 ||
        pkg.autoPriceDropEnabled === '1' ||
        pkg.autoPriceDropEnabled === 'true'
      );

      setAutoPriceDropEnabled(!!isAutoDrop);
      setPriceDropInterval(isAutoDrop && pkg.priceDropInterval != null ? pkg.priceDropInterval.toString() : '');
      setPriceDropAmount(isAutoDrop && pkg.priceDropAmount != null ? pkg.priceDropAmount.toString() : '');
      setMinPriceDropLimit(pkg?.minPriceDropLimit != null ? pkg.minPriceDropLimit.toString() : '');
      setDeliveryStart(pkg?.deliveryStart ? new Date(pkg.deliveryStart) : new Date());
      setDeliveryEnd(pkg?.deliveryEnd ? new Date(pkg.deliveryEnd) : new Date());
      setSelectedProducts(pkg?.products ? pkg.products.map(p => ({ id: p.id, quantity: p.quantity })) : []);
      setModalError('');
      setModalVisible(true);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Hata', text2: err.toString() });
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalError('');
    setSelectedPackage(null);
    setFormData(EMPTY_FORM);
  };

  const handleProductSelect = (productId) => {
    if (selectedProducts.some(p => p.id === productId)) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, { id: productId, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (productId, quantity) => {
    setSelectedProducts(selectedProducts.map(p =>
      p.id === productId ? { ...p, quantity: quantity.replace(/[^0-9]/g, '') } : p
    ));
  };

  const handleDelete = async (id, quantity) => {
    if (quantity > 1) {
      Toast.show({
        type: 'info',
        text1: 'Silme',
        text2: 'Tüm kutular silinecek',
      });
      await deleteShopPackage(id);
    } else {
      await deleteShopPackage(id);
    }
    await loadPackages();
    Toast.show({ type: 'success', text1: 'Silindi', text2: 'Paket silindi' });
  };

 const handleSubmit = async () => {
  console.log("🚀 START");

  try {
    console.log("🧪 BUILDING DATA...");

    // 1. PRODUCTS CLEAN
    const cleanedProducts = selectedProducts.map(p => {
      const productInfo = allProducts.find(prod => prod.id === p.id);

      return {
        id: p.id,
        quantity: p.quantity && parseInt(p.quantity) > 0
          ? parseInt(p.quantity)
          : 1,
        price: productInfo ? parseFloat(productInfo.price) : 0,
      };
    });

    // 2. TOTAL PRICE (optional validation için)
    const totalProductsPrice = cleanedProducts.reduce((sum, p) => {
      const productInfo = allProducts.find(prod => prod.id === p.id);
      const price = productInfo ? parseFloat(productInfo.price) : 0;
      return sum + price * p.quantity;
    }, 0);

    // 3. VALIDATION
    if (autoPriceDropEnabled) {
      const minLimit = parseFloat(minPriceDropLimit);
      const packagePrice = formData.price ? parseFloat(formData.price) : null;

      if (!minPriceDropLimit || isNaN(minLimit) || minLimit <= 0) {
        setModalError("Minimum fiyat 0'dan büyük olmalı!");
        return;
      }

      if (packagePrice !== null && minLimit > packagePrice) {
        setModalError("Minimum fiyat, paket fiyatından fazla olamaz!");
        return;
      }

      if (packagePrice === null && minLimit > totalProductsPrice) {
        setModalError("Minimum fiyat, ürünlerin toplam fiyatından fazla olamaz!");
        return;
      }
    }

    // 4. PAYLOAD
    const payload = {
      name: formData.name,
      price: formData.price ? parseFloat(formData.price) : null,
      description: formData.description,
      quantity: formData.quantity ? parseInt(formData.quantity) : 1,
      deliveryStart: deliveryStart.toISOString(),
      deliveryEnd: deliveryEnd.toISOString(),
      products: cleanedProducts,
      autoPriceDropEnabled,
      priceDropAmount: autoPriceDropEnabled
        ? parseFloat(priceDropAmount)
        : null,
      priceDropInterval: autoPriceDropEnabled
        ? parseInt(priceDropInterval)
        : null,
      minPriceDropLimit: autoPriceDropEnabled
        ? parseFloat(minPriceDropLimit)
        : null,
    };

    console.log("📦 PAYLOAD READY:", payload);

    // 5. API CALL
    console.log("📡 CALLING API...");

    if (selectedPackage) {
      const res = await updateShopPackage(selectedPackage.id, payload);
      console.log("✅ UPDATED:", res);

      Toast.show({
        type: "success",
        text1: "Güncellendi",
        text2: "Paket başarıyla güncellendi",
      });
    } else {
      const res = await addShopPackage(payload);
      console.log("✅ CREATED:", res);

      Toast.show({
        type: "success",
        text1: "Eklendi",
        text2: "Paket başarıyla eklendi",
      });
    }

    // 6. CLEANUP
    closeModal();
    loadPackages();

  } catch (err) {
    console.log("❌ ERROR:", err);
    console.log("❌ RESPONSE:", err?.response?.data);

    Toast.show({
      type: "error",
      text1: "Hata",
      text2: err?.response?.data?.error || err.toString(),
    });
  }

  console.log("🏁 END");
};

  const renderPackage = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <Text style={styles.packageName}>{item.name}</Text>
        <Text style={styles.packagePrice}>
          {item.price != null && item.price !== '' ? item.price : item.totalPrice} ₺
        </Text>
        <View style={styles.metaRow}>
          <Icon name="inventory-2" size={14} color={COLORS.textMuted} />
          <Text style={styles.metaText}>Kalan: {item.quantity ?? '-'} kutu</Text>
        </View>
        <View style={styles.metaRow}>
          <Icon name="schedule" size={14} color={COLORS.textMuted} />
          <Text style={styles.metaText}>{formatDeliveryRange(item.deliveryStart, item.deliveryEnd)}</Text>
        </View>
        {item.products?.length > 0 && (
          <Text style={styles.productList} numberOfLines={2}>
            {item.products.map(p => `${p.name} (${p.quantity})`).join(', ')}
          </Text>
        )}
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => openModal(item)} style={styles.iconButton}>
          <Icon name="edit" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id, item.quantity)} style={styles.iconButton}>
          <Icon name="delete" size={20} color={COLORS.red} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>expiry</Text>
          <View style={styles.dot} />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Icon name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* HERO */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Shop Paneli</Text>
        <Text style={styles.heroName}>Paketlerim</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={packages}
          keyExtractor={item => item.id.toString()}
          renderItem={renderPackage}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPackages(true)}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="inventory-2" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>Henüz paket eklemediniz</Text>
            </View>
          }
        />
      )}

      {/* MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedPackage ? 'Paket Düzenle' : 'Yeni Paket'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* TEMEL BİLGİLER */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Paket Adı</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={text => setFormData({ ...formData, name: text })}
                  placeholder="Paket adı girin"
                  placeholderTextColor={COLORS.textMuted}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Fiyat (₺)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.price}
                    onChangeText={text => setFormData({ ...formData, price: text })}
                    keyboardType="numeric"
                    placeholder="Opsiyonel"
                    placeholderTextColor={COLORS.textMuted}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Adet</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.quantity}
                    onChangeText={text => setFormData({ ...formData, quantity: text.replace(/[^0-9]/g, '') })}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor={COLORS.textMuted}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Açıklama</Text>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={formData.description}
                  onChangeText={text => setFormData({ ...formData, description: text })}
                  placeholder="Paket hakkında kısa bilgi"
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={3}
                  maxLength={250}
                  blurOnSubmit
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>

              {/* TESLİMAT */}
              <Text style={styles.sectionLabel}>Teslimat Aralığı</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Başlangıç</Text>
                <DateTimePicker
                  value={deliveryStart}
                  mode="datetime"
                  display="default"
                  onChange={(_, date) => date && setDeliveryStart(date)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bitiş</Text>
                <DateTimePicker
                  value={deliveryEnd}
                  mode="datetime"
                  display="default"
                  onChange={(_, date) => date && setDeliveryEnd(date)}
                />
              </View>

              {/* OTOMATİK FİYAT DÜŞÜŞÜ */}
              <Text style={styles.sectionLabel}>Otomatik Fiyat Düşüşü</Text>
              <View style={styles.switchRow}>
                <Text style={styles.inputLabel}>Etkinleştir</Text>
                <Switch
                  value={autoPriceDropEnabled}
                  onValueChange={setAutoPriceDropEnabled}
                  trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                  thumbColor={autoPriceDropEnabled ? COLORS.primary : COLORS.textMuted}
                />
              </View>

              {autoPriceDropEnabled && (
                <>
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Kaç saatte bir?</Text>
                      <TextInput
                        style={styles.input}
                        value={priceDropInterval}
                        onChangeText={setPriceDropInterval}
                        keyboardType="numeric"
                        placeholder="Örn: 1"
                        placeholderTextColor={COLORS.textMuted}
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Kaç TL düşsün?</Text>
                      <TextInput
                        style={styles.input}
                        value={priceDropAmount}
                        onChangeText={setPriceDropAmount}
                        keyboardType="numeric"
                        placeholder="Örn: 5"
                        placeholderTextColor={COLORS.textMuted}
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                      />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Minimum Fiyat (₺)</Text>
                    <TextInput
                      style={styles.input}
                      value={minPriceDropLimit}
                      onChangeText={setMinPriceDropLimit}
                      keyboardType="numeric"
                      placeholder="Örn: 50"
                      placeholderTextColor={COLORS.textMuted}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>
                </>
              )}

              {/* ÜRÜNLER */}
              <Text style={styles.sectionLabel}>Ürünler</Text>
              {allProducts.map(item => {
                const selected = selectedProducts.find(p => p.id === item.id);
                return (
                  <View key={item.id} style={styles.productRow}>
                    <TouchableOpacity
                      onPress={() => handleProductSelect(item.id)}
                      style={[styles.checkbox, selected && styles.checkboxActive]}
                    >
                      {selected && <Icon name="check" size={16} color={COLORS.white} />}
                    </TouchableOpacity>
                    <Text style={styles.productName}>{item.name}</Text>
                    {selected && (
                      <TextInput
                        value={selected.quantity?.toString() || ''}
                        onChangeText={q => handleQuantityChange(item.id, q)}
                        keyboardType="numeric"
                        style={styles.quantityInput}
                        placeholder="Adet"
                        placeholderTextColor={COLORS.textMuted}
                      />
                    )}
                  </View>
                );
              })}

              {modalError ? (
                <Text style={styles.errorText}>{modalError}</Text>
              ) : null}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.cancelText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitText}>
                    {selectedPackage ? 'Güncelle' : 'Ekle'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.bg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginBottom: 2 },
  addButton: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },

  hero: { paddingHorizontal: 20, marginBottom: 16 },
  heroLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 2 },
  heroName: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },

  loader: { marginTop: 40 },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },

  // CARD
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardBody: { flex: 1 },
  packageName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  packagePrice: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  metaText: { fontSize: 12, color: COLORS.textMuted },
  productList: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  description: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  cardActions: { gap: 4 },
  iconButton: { padding: 6 },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },

  // MODAL
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500', marginBottom: 6 },
  input: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  multiline: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  // PRODUCTS
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  checkbox: {
    width: 24, height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  productName: { flex: 1, fontSize: 14, color: COLORS.text },
  quantityInput: {
    width: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 6,
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },

  errorText: {
    color: COLORS.red,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },

  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelButton: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: COLORS.textMuted },
  submitButton: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: COLORS.primary, alignItems: 'center',
  },
  submitText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});

export default ShopPackagesScreen;