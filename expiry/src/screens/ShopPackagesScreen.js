import React, { useState, useCallback } from 'react';
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
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import {
  fetchShopOwnPackages,
  addShopPackage,
  updateShopPackage,
  deleteShopPackage,
  fetchShopProducts,
  fetchAllShopProducts,
} from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPE_SCALE } from '../theme';
import { showErrorToast } from '../utils/errorHandler';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import Card from '../components/common/Card';
import Chip from '../components/common/Chip';
import ScreenHeader from '../components/common/ScreenHeader';

const EMPTY_FORM = { name: '', price: '', description: '', quantity: '1' };
const LIMIT = 10;

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

const formatDateTime = (date) =>
  date.toLocaleString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// Teslimat aralığı için hızlı seçim seçenekleri — sadece deliveryStart/deliveryEnd'i
// dolduran birer kısayol, hâlâ istenirse aşağıdaki özel tarih seçicilerle üzerine yazılabilir.
const buildQuickPresets = () => {
  const now = new Date();

  const in2hStart = new Date(now);
  const in2hEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const eveningStart = new Date(now);
  eveningStart.setHours(18, 0, 0, 0);
  const eveningEnd = new Date(now);
  eveningEnd.setHours(21, 0, 0, 0);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = new Date(tomorrow);
  tomorrowStart.setHours(9, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(20, 0, 0, 0);

  return [
    { key: '2h', label: '2 Saat İçinde', start: in2hStart, end: in2hEnd },
    { key: 'evening', label: 'Bu Akşam', start: eveningStart, end: eveningEnd },
    { key: 'tomorrow', label: 'Yarın', start: tomorrowStart, end: tomorrowEnd },
  ];
};

// Android'de mode="datetime" için deklaratif <DateTimePicker> kullanmak
// (önce tarih diyalogu, sonra saat diyalogu arka arkaya) kütüphanenin bilinen
// bir hatasına yol açıyor ("Cannot read property 'dismiss' of undefined").
// Android'in kendi önerdiği çözüm: imperative API ile iki diyalogu manuel
// olarak art arda açmak. iOS'ta tek bir kompakt kontrol olduğu için sorun yok,
// orada deklaratif component'e devam ediyoruz.
const openAndroidDateTimePicker = (currentValue, onPicked) => {
  DateTimePickerAndroid.open({
    value: currentValue,
    mode: 'date',
    onChange: (dateEvent, pickedDate) => {
      if (dateEvent.type !== 'set' || !pickedDate) return;
      DateTimePickerAndroid.open({
        value: pickedDate,
        mode: 'time',
        onChange: (timeEvent, pickedTime) => {
          if (timeEvent.type !== 'set' || !pickedTime) return;
          const combined = new Date(pickedDate);
          combined.setHours(pickedTime.getHours(), pickedTime.getMinutes());
          onPicked(combined);
        },
      });
    },
  });
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
  const [selectedPresetKey, setSelectedPresetKey] = useState(null);
  const [quickPresets, setQuickPresets] = useState([]);
  const [autoPriceDropEnabled, setAutoPriceDropEnabled] = useState(false);
  const [priceDropInterval, setPriceDropInterval] = useState('');
  const [priceDropAmount, setPriceDropAmount] = useState('');
  const [minPriceDropLimit, setMinPriceDropLimit] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const loadPackages = async (pageNumber = 1, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(false);

    try {
      const data = await fetchShopOwnPackages(pageNumber, LIMIT);
      setPackages(data.packages);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      setError(true);
      showErrorToast(err, Toast);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  React.useEffect(() => { loadPackages(1); }, []);

  const openModal = async (pkg = null) => {
    setModalVisible(true);
    setModalLoading(true);
    setQuickPresets(buildQuickPresets());
    setSelectedPresetKey(null);
    setProductSearch('');

    try {
      const products = await fetchAllShopProducts();
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
    } catch (err) {
      showErrorToast(err, Toast);
      setModalVisible(false);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalError('');
    setSelectedPackage(null);
    setFormData(EMPTY_FORM);
    setSelectedProducts([]);
    setProductSearch('');
  };

  const applyPreset = (preset) => {
    setDeliveryStart(preset.start);
    setDeliveryEnd(preset.end);
    setSelectedPresetKey(preset.key);
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

  const handleDelete = (pkg) => {
    Alert.alert(
      'Paketi Sil',
      `"${pkg.name}" paketini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(pkg.id);
              await deleteShopPackage(pkg.id);
              Toast.show({ type: 'success', text1: 'Silindi', text2: 'Paket başarıyla silindi' });
              const targetPage = (packages.length === 1 && page > 1) ? page - 1 : page;
              loadPackages(targetPage);
            } catch (err) {
              showErrorToast(err, Toast);
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    setModalError('');

    if (!formData.name.trim()) {
      setModalError('Paket adı zorunlu');
      return;
    }

    if (selectedProducts.length === 0) {
      setModalError('En az bir ürün seçmelisiniz');
      return;
    }

    if (deliveryEnd <= deliveryStart) {
      setModalError('Teslimat bitiş zamanı başlangıçtan sonra olmalı');
      return;
    }

    try {
      setSubmitting(true);

      const cleanedProducts = selectedProducts.map(p => {
        const productInfo = allProducts.find(prod => prod.id === p.id);
        return {
          id: p.id,
          quantity: p.quantity && parseInt(p.quantity) > 0 ? parseInt(p.quantity) : 1,
          price: productInfo ? parseFloat(productInfo.price) : 0,
        };
      });

      const totalProductsPrice = cleanedProducts.reduce((sum, p) => {
        const productInfo = allProducts.find(prod => prod.id === p.id);
        const price = productInfo ? parseFloat(productInfo.price) : 0;
        return sum + price * p.quantity;
      }, 0);

      if (autoPriceDropEnabled) {
        const minLimit = parseFloat(minPriceDropLimit);
        const packagePrice = formData.price ? parseFloat(formData.price) : null;

        if (!minPriceDropLimit || isNaN(minLimit) || minLimit <= 0) {
          setModalError("Minimum fiyat 0'dan büyük olmalı!");
          setSubmitting(false);
          return;
        }

        if (packagePrice !== null && minLimit > packagePrice) {
          setModalError("Minimum fiyat, paket fiyatından fazla olamaz!");
          setSubmitting(false);
          return;
        }

        if (packagePrice === null && minLimit > totalProductsPrice) {
          setModalError("Minimum fiyat, ürünlerin toplam fiyatından fazla olamaz!");
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        name: formData.name.trim(),
        price: formData.price ? parseFloat(formData.price) : null,
        description: formData.description,
        quantity: formData.quantity ? parseInt(formData.quantity) : 1,
        deliveryStart: deliveryStart.toISOString(),
        deliveryEnd: deliveryEnd.toISOString(),
        products: cleanedProducts,
        autoPriceDropEnabled,
        priceDropAmount: autoPriceDropEnabled ? parseFloat(priceDropAmount) : null,
        priceDropInterval: autoPriceDropEnabled ? parseInt(priceDropInterval) : null,
        minPriceDropLimit: autoPriceDropEnabled ? parseFloat(minPriceDropLimit) : null,
      };

      if (selectedPackage) {
        await updateShopPackage(selectedPackage.id, payload);
        Toast.show({ type: 'success', text1: 'Güncellendi', text2: 'Paket başarıyla güncellendi' });
      } else {
        await addShopPackage(payload);
        Toast.show({ type: 'success', text1: 'Eklendi', text2: 'Paket başarıyla eklendi' });
      }
      closeModal();
      loadPackages(selectedPackage ? page : 1);
    } catch (err) {
      showErrorToast(err, Toast);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = productSearch.trim()
    ? allProducts.filter(p => (p.name || '').toLowerCase().includes(productSearch.trim().toLowerCase()))
    : allProducts;

  const renderPackage = ({ item }) => (
    <Card style={styles.card} shadow="sm">
      <View style={styles.cardBody}>
        <Text style={styles.packageName}>{item.name}</Text>
        <Text style={styles.packagePrice}>
          {item.price != null && item.price !== '' ? item.price : item.totalPrice} ₺
        </Text>
        <View style={styles.metaRow}>
          <Icon name="inventory-2" size={14} color={COLORS.textMuted} />
          <Text style={styles.metaText}>Stok: {item.quantity ?? '-'} kutu</Text>
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
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={styles.iconButton}
          disabled={deletingId === item.id}
        >
          {deletingId === item.id ? (
            <ActivityIndicator size={20} color={COLORS.red} />
          ) : (
            <Icon name="delete" size={20} color={COLORS.red} />
          )}
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState onRetry={() => loadPackages(1)} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScreenHeader title="Paketlerim" rightIcon="add" onRightPress={() => openModal()} />

      <FlatList
        data={packages}
        keyExtractor={item => item.id.toString()}
        renderItem={renderPackage}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPackages(1, true)}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState icon="package-variant-closed" title="Henüz paket eklemediniz">
            <TouchableOpacity style={styles.emptyButton} onPress={() => openModal()}>
              <Text style={styles.emptyButtonText}>İlk Paketini Ekle</Text>
            </TouchableOpacity>
          </EmptyState>
        }
      />

      {total > LIMIT && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
            onPress={() => loadPackages(page - 1)}
            disabled={page === 1}
          >
            <Icon name="chevron-left" size={20} color={page === 1 ? COLORS.textMuted : COLORS.white} />
          </TouchableOpacity>

          <Text style={styles.pageInfo}>{page} / {Math.ceil(total / LIMIT)}</Text>

          <TouchableOpacity
            style={[styles.pageBtn, page >= Math.ceil(total / LIMIT) && styles.pageBtnDisabled]}
            onPress={() => loadPackages(page + 1)}
            disabled={page >= Math.ceil(total / LIMIT)}
          >
            <Icon name="chevron-right" size={20} color={page >= Math.ceil(total / LIMIT) ? COLORS.textMuted : COLORS.white} />
          </TouchableOpacity>
        </View>
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

            {modalLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ paddingVertical: 60 }} />
            ) : (
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
                  <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
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

                <Text style={styles.deliverySummary}>
                  {formatDeliveryRange(deliveryStart, deliveryEnd)}
                </Text>

                <View style={styles.presetRow}>
                  {quickPresets.map(preset => (
                    <Chip
                      key={preset.key}
                      label={preset.label}
                      active={selectedPresetKey === preset.key}
                      onPress={() => applyPreset(preset)}
                    />
                  ))}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Başlangıç</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => {
                      if (Platform.OS === 'android') {
                        openAndroidDateTimePicker(deliveryStart, (date) => {
                          setDeliveryStart(date);
                          setSelectedPresetKey(null);
                        });
                      } else {
                        setShowStartPicker(true);
                      }
                    }}
                  >
                    <Text style={styles.inputValueText}>{formatDateTime(deliveryStart)}</Text>
                  </TouchableOpacity>
                  {Platform.OS === 'ios' && showStartPicker && (
                    <DateTimePicker
                      value={deliveryStart}
                      mode="datetime"
                      display="default"
                      onChange={(event, date) => {
                        setShowStartPicker(false);
                        if (event.type === 'set' && date) {
                          setDeliveryStart(date);
                          setSelectedPresetKey(null);
                        }
                      }}
                    />
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bitiş</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => {
                      if (Platform.OS === 'android') {
                        openAndroidDateTimePicker(deliveryEnd, (date) => {
                          setDeliveryEnd(date);
                          setSelectedPresetKey(null);
                        });
                      } else {
                        setShowEndPicker(true);
                      }
                    }}
                  >
                    <Text style={styles.inputValueText}>{formatDateTime(deliveryEnd)}</Text>
                  </TouchableOpacity>
                  {Platform.OS === 'ios' && showEndPicker && (
                    <DateTimePicker
                      value={deliveryEnd}
                      mode="datetime"
                      display="default"
                      onChange={(event, date) => {
                        setShowEndPicker(false);
                        if (event.type === 'set' && date) {
                          setDeliveryEnd(date);
                          setSelectedPresetKey(null);
                        }
                      }}
                    />
                  )}
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
                      <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
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

                {allProducts.length === 0 ? (
                  <Text style={styles.noProductsText}>
                    Henüz ürün eklemediniz. Önce Ürünlerim ekranından ürün ekleyin.
                  </Text>
                ) : (
                  <>
                    {allProducts.length > 5 && (
                      <View style={styles.productSearchBox}>
                        <Icon name="search" size={18} color={COLORS.textMuted} />
                        <TextInput
                          style={styles.productSearchInput}
                          placeholder="Ürün ara..."
                          placeholderTextColor={COLORS.textMuted}
                          value={productSearch}
                          onChangeText={setProductSearch}
                        />
                        {productSearch.length > 0 && (
                          <TouchableOpacity onPress={() => setProductSearch('')}>
                            <Icon name="close" size={18} color={COLORS.textMuted} />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {filteredProducts.length === 0 ? (
                      <Text style={styles.noProductsText}>Sonuç bulunamadı</Text>
                    ) : (
                      filteredProducts.map(item => {
                        const selected = selectedProducts.find(p => p.id === item.id);
                        return (
                          <View key={item.id} style={styles.productRow}>
                            <TouchableOpacity
                              onPress={() => handleProductSelect(item.id)}
                              style={[styles.checkbox, selected && styles.checkboxActive]}
                            >
                              {selected && <Icon name="check" size={16} color={COLORS.white} />}
                            </TouchableOpacity>
                            <View style={styles.productInfo}>
                              <Text style={styles.productName}>{item.name}</Text>
                              <Text style={styles.productStock}>Stok: {item.quantity ?? '-'} adet</Text>
                            </View>
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
                      })
                    )}
                  </>
                )}

                {modalError ? (
                  <Text style={styles.errorText}>{modalError}</Text>
                ) : null}

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                    <Text style={styles.cancelText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    {submitting ? (
                      <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                      <Text style={styles.submitText}>
                        {selectedPackage ? 'Güncelle' : 'Ekle'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  list: { paddingHorizontal: SPACING.xxl, paddingBottom: SPACING.xxxl + SPACING.md },

  // CARD
  card: { flexDirection: 'row' },
  cardBody: { flex: 1 },
  packageName: { ...TYPE_SCALE.bodySemiBold, fontSize: 15, color: COLORS.text, marginBottom: 4 },
  packagePrice: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginBottom: SPACING.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  metaText: { ...TYPE_SCALE.captionMuted, fontSize: 12, color: COLORS.textMuted },
  productList: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  description: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  cardActions: { gap: 4 },
  iconButton: { padding: 6, width: 32, alignItems: 'center' },

  emptyButton: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primaryLight,
  },
  emptyButtonText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.lg,
  },
  pageBtn: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  pageBtnDisabled: { backgroundColor: COLORS.border },
  pageInfo: { fontSize: 14, fontWeight: '600', color: COLORS.text, minWidth: 50, textAlign: 'center' },

  // MODAL
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    paddingBottom: SPACING.xxxl + SPACING.md,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: { ...TYPE_SCALE.h3, fontSize: 18, color: COLORS.text },

  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: SPACING.md, marginTop: SPACING.sm,
  },
  inputGroup: { marginBottom: SPACING.lg },
  inputLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500', marginBottom: SPACING.xs + 2 },
  input: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputValueText: { fontSize: 15, color: COLORS.text },
  multiline: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },

  // TESLİMAT
  deliverySummary: {
    fontSize: 14, fontWeight: '600', color: COLORS.text,
    marginBottom: SPACING.md,
  },
  presetRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: SPACING.sm, marginBottom: SPACING.lg,
  },

  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.lg,
  },

  // ÜRÜNLER
  productSearchBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 42,
    marginBottom: SPACING.md,
  },
  productSearchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  noProductsText: {
    fontSize: 13, color: COLORS.textMuted,
    marginBottom: SPACING.lg, fontStyle: 'italic',
  },
  productRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm + 2, gap: SPACING.sm },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, color: COLORS.text },
  productStock: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  quantityInput: {
    width: 56, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.sm, padding: 6, textAlign: 'center',
    fontSize: 14, color: COLORS.text, backgroundColor: COLORS.white,
  },

  errorText: { color: COLORS.red, fontSize: 13, textAlign: 'center', marginBottom: SPACING.md },

  modalButtons: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg },
  cancelButton: {
    flex: 1, paddingVertical: SPACING.md + 2, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: COLORS.textMuted },
  submitButton: {
    flex: 1, paddingVertical: SPACING.md + 2, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  submitText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});

export default ShopPackagesScreen;