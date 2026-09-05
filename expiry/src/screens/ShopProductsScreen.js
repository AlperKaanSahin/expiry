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
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { fetchShopProducts, addShopProduct, updateShopProduct, deleteShopProduct } from '../services/api';
import { COLORS, SPACING, RADIUS, TYPE_SCALE } from '../theme';
import { showErrorToast } from '../utils/errorHandler';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import Card from '../components/common/Card';
import ScreenHeader from '../components/common/ScreenHeader';

const EMPTY_FORM = { name: '', price: '', quantity: '' };
const LIMIT = 10;

const formatDate = (dateStr) => {
  if (!dateStr) return 'Tarih yok';
  return new Date(dateStr).toLocaleDateString('tr-TR');
};

const ShopProductsScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadProducts = async (pageNumber = 1, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      setError(null);
      const data = await fetchShopProducts(pageNumber, LIMIT);
      setProducts(data.products);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadProducts(1); }, []);

  const openModal = (product = null) => {
    setSelectedProduct(product);
    setFormData(product ? {
      name: product.name,
      price: product.price.toString(),
      quantity: product.quantity.toString()
    } : EMPTY_FORM);
    setExpiryDate(product?.expiryDate ? new Date(product.expiryDate) : new Date());
    setErrors({});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedProduct(null);
    setFormData(EMPTY_FORM);
    setErrors({});
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Ürün adı zorunlu';
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Geçerli bir fiyat girin';
    }
    if (!formData.quantity || isNaN(parseInt(formData.quantity)) || parseInt(formData.quantity) < 0) {
      newErrors.quantity = 'Geçerli bir stok miktarı girin';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        expiryDate: expiryDate.toISOString(),
      };

      if (selectedProduct) {
        await updateShopProduct(selectedProduct.id, payload);
        Toast.show({ type: 'success', text1: 'Güncellendi', text2: 'Ürün başarıyla güncellendi' });
      } else {
        await addShopProduct(payload);
        Toast.show({ type: 'success', text1: 'Eklendi', text2: 'Ürün başarıyla eklendi' });
      }

      closeModal();
      loadProducts(selectedProduct ? page : 1);
    } catch (error) {
      showErrorToast(error, Toast);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (product) => {
    Alert.alert(
      'Ürünü Sil',
      `"${product.name}" ürününü silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(product.id);
              await deleteShopProduct(product.id);
              Toast.show({ type: 'success', text1: 'Silindi', text2: 'Ürün başarıyla silindi' });
              const targetPage = (products.length === 1 && page > 1) ? page - 1 : page;
              loadProducts(targetPage);
            } catch (error) {
              showErrorToast(error, Toast);
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  const renderProduct = ({ item }) => (
    <Card style={styles.card} shadow="sm">
      <View style={styles.cardBody}>
        <Text style={styles.productName}>{item.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="attach-money" size={14} color={COLORS.primary} />
            <Text style={styles.metaText}>{item.price} ₺</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="inventory" size={14} color={COLORS.primary} />
            <Text style={styles.metaText}>Stok: {item.quantity}</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="event" size={14} color={COLORS.primary} />
            <Text style={styles.metaText}>{formatDate(item.expiryDate)}</Text>
          </View>
        </View>
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
    return <LoadingState text="Yükleniyor..." />;
  }

  if (error) {
    return (
      <ErrorState
        subtitle="Ürünler yüklenirken bir hata oluştu."
        onRetry={loadProducts}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScreenHeader title="Ürünlerim" rightIcon="add" onRightPress={() => openModal()} />

      <FlatList
        data={products}
        keyExtractor={item => item.id.toString()}
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProducts(1, true)}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState icon="package-variant-closed" title="Henüz ürün eklemediniz">
            <TouchableOpacity style={styles.emptyButton} onPress={() => openModal()}>
              <Text style={styles.emptyButtonText}>İlk Ürününü Ekle</Text>
            </TouchableOpacity>
          </EmptyState>
        }
      />

      {total > LIMIT && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
            onPress={() => loadProducts(page - 1)}
            disabled={page === 1}
          >
            <Icon name="chevron-left" size={20} color={page === 1 ? COLORS.textMuted : COLORS.white} />
          </TouchableOpacity>

          <Text style={styles.pageInfo}>{page} / {Math.ceil(total / LIMIT)}</Text>

          <TouchableOpacity
            style={[styles.pageBtn, page >= Math.ceil(total / LIMIT) && styles.pageBtnDisabled]}
            onPress={() => loadProducts(page + 1)}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          <TouchableOpacity style={styles.overlayTouch} onPress={closeModal} activeOpacity={1} />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedProduct ? 'Ürün Düzenle' : 'Yeni Ürün'}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <Icon name="close" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ürün Adı</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={formData.name}
                  onChangeText={text => {
                    setFormData({ ...formData, name: text });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  placeholder="Ürün adı girin"
                  placeholderTextColor={COLORS.textMuted}
                  returnKeyType="done"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                  <Text style={styles.inputLabel}>Fiyat (₺)</Text>
                  <TextInput
                    style={[styles.input, errors.price && styles.inputError]}
                    value={formData.price}
                    onChangeText={text => {
                      setFormData({ ...formData, price: text });
                      if (errors.price) setErrors({ ...errors, price: null });
                    }}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textMuted}
                    returnKeyType="next"
                  />
                  {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Stok</Text>
                  <TextInput
                    style={[styles.input, errors.quantity && styles.inputError]}
                    value={formData.quantity}
                    onChangeText={text => {
                      setFormData({ ...formData, quantity: text });
                      if (errors.quantity) setErrors({ ...errors, quantity: null });
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Son Kullanma Tarihi</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.inputValueText}>{expiryDate.toLocaleDateString('tr-TR')}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={expiryDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      // Tek aşamalı (sadece tarih) native diyalog — mode="datetime" ile
                      // yaşanan çift-diyalog "dismiss" hatası burada geçerli değil,
                      // Android'de tek bir DatePickerDialog açılıyor.
                      setShowDatePicker(false);
                      if (event.type === 'set' && date) {
                        setExpiryDate(date);
                      }
                    }}
                  />
                )}
              </View>

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
                    <Text style={styles.submitText}>Kaydet</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  list: { paddingHorizontal: SPACING.xxl, paddingBottom: SPACING.xxxl + SPACING.md },

  card: { flexDirection: 'row', alignItems: 'center' },
  cardBody: { flex: 1 },
  productName: { ...TYPE_SCALE.bodySemiBold, fontSize: 15, color: COLORS.text, marginBottom: SPACING.sm },
  metaRow: { flexDirection: 'row', gap: SPACING.md, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 13, color: COLORS.textMuted },
  cardActions: { flexDirection: 'row', gap: 4 },
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.md, gap: SPACING.lg,
  },
  pageBtn: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  pageBtnDisabled: { backgroundColor: COLORS.border },
  pageInfo: { fontSize: 14, fontWeight: '600', color: COLORS.text, minWidth: 50, textAlign: 'center' },

  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayTouch: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.xxl, paddingBottom: SPACING.xxxl,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.xl,
  },
  modalTitle: { ...TYPE_SCALE.h3, fontSize: 18, color: COLORS.text },
  inputGroup: { marginBottom: SPACING.lg },
  inputLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500', marginBottom: SPACING.xs + 2 },
  input: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md, padding: SPACING.md,
    fontSize: 15, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },
  inputValueText: { fontSize: 15, color: COLORS.text },
  inputError: { borderColor: COLORS.red },
  errorText: { fontSize: 12, color: COLORS.red, marginTop: SPACING.xs },
  row: { flexDirection: 'row' },

  modalButtons: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
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
  submitText: { fontSize: 15, fontWeight: '600', color: COLORS.white },
});

export default ShopProductsScreen;