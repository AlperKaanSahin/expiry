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
import { COLORS } from '../theme/colors';
import { showErrorToast } from '../utils/errorHandler';

const EMPTY_FORM = { name: '', price: '', quantity: '' };

const formatDate = (dateStr) => {
  if (!dateStr) return 'Tarih yok';
  return new Date(dateStr).toLocaleDateString('tr-TR');
};

const ShopProductsScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadProducts = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await fetchShopProducts();
      setProducts(data);
    } catch (error) {
      showErrorToast(error, Toast);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

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
      loadProducts();
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
              loadProducts();
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
    <View style={styles.card}>
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
        <Text style={styles.heroName}>Ürünlerim</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id.toString()}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadProducts(true)}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="inventory-2" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>Henüz ürün eklemediniz</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => openModal()}>
                <Text style={styles.emptyButtonText}>İlk Ürününü Ekle</Text>
              </TouchableOpacity>
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
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
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
                <DateTimePicker
                  value={expiryDate}
                  mode="date"
                  display="default"
                  onChange={(_, date) => { if (date) setExpiryDate(date); }}
                />
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

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardBody: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 13, color: COLORS.textMuted },
  cardActions: { flexDirection: 'row', gap: 4 },
  iconButton: { padding: 6, width: 32, alignItems: 'center' },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
  emptyButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
  },
  emptyButtonText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayTouch: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 32,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500', marginBottom: 6 },
  input: {
    backgroundColor: COLORS.bg,
    borderRadius: 10, padding: 12,
    fontSize: 15, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },
  inputError: { borderColor: COLORS.red },
  errorText: { fontSize: 12, color: COLORS.red, marginTop: 4 },
  row: { flexDirection: 'row' },

  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
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
    justifyContent: 'center',
  },
  submitText: { fontSize: 15, fontWeight: '600', color: COLORS.white },
});

export default ShopProductsScreen;