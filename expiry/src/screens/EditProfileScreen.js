import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { getProfile, updateProfile } from '../services/api';
import { COLORS } from '../theme/colors';

const EditProfileScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', address: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await getProfile();
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: user.phone || '',
          address: user.address || '',
        });
      } catch (err) {
        Toast.show({ type: 'error', text1: 'Hata', text2: err.toString() });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName) {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Ad ve soyad zorunlu' });
      return;
    }
    try {
      setSaving(true);
      await updateProfile(formData);
      Toast.show({ type: 'success', text1: 'Güncellendi', text2: 'Profiliniz güncellendi' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Hata', text2: err.toString() });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.appName}>expiry</Text>
          <View style={styles.dot} />
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>Hesabım</Text>
            <Text style={styles.heroName}>Profili Düzenle</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Ad</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    value={formData.firstName}
                    onChangeText={t => handleChange('firstName', t)}
                    placeholder="Adınız"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Soyad</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    value={formData.lastName}
                    onChangeText={t => handleChange('lastName', t)}
                    placeholder="Soyadınız"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Telefon</Text>
              <View style={styles.inputBox}>
                <Icon name="phone" size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={t => handleChange('phone', t)}
                  placeholder="05XX XXX XX XX"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Adres</Text>
              <View style={styles.inputBox}>
                <Icon name="location-on" size={18} color={COLORS.textMuted} />
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={formData.address}
                  onChangeText={t => handleChange('address', t)}
                  placeholder="Adresiniz"
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveText}>Kaydet</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginBottom: 2 },

  body: { paddingHorizontal: 20, paddingBottom: 40 },

  hero: { marginTop: 8, marginBottom: 28 },
  heroLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },
  heroName: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },

  form: { gap: 16, marginBottom: 24 },
  row: { flexDirection: 'row' },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.text },
  multiline: { minHeight: 50, textAlignVertical: 'top' },

  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});

export default EditProfileScreen;