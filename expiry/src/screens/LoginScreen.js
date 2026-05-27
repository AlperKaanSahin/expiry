import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";

import { useAuth } from "../context/AuthContext";
import Icon from "react-native-vector-icons/MaterialIcons";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

const { login } = useAuth();

const handleLogin = async () => {
  try {
    setLoading(true);
    await login(email, password);
  } catch (err) {
    Alert.alert('Hata', err.toString());
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Image
          source={require("../assets/label.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Hoş Geldiniz</Text>

        {/* EMAIL */}
        <View style={styles.inputContainer}>
          <Icon
            name="email"
            size={20}
            color="#6200EE"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Email adresiniz"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* PASSWORD */}
        <View style={styles.inputContainer}>
          <Icon
            name="lock"
            size={20}
            color="#6200EE"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Şifreniz"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            onPress={() => setSecureTextEntry(!secureTextEntry)}
          >
            <Icon
              name={secureTextEntry ? "visibility-off" : "visibility"}
              size={20}
              color="#888"
            />
          </TouchableOpacity>
        </View>

        {/* BUTTON */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Giriş Yap</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },

  innerContainer: {
    flex: 1,
    padding: 30,
    justifyContent: "center",
  },

  logo: {
    width: 150,
    height: 150,
    alignSelf: "center",
    marginBottom: 30,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 30,
    textAlign: "center",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    height: "100%",
    color: "#333",
  },

  loginButton: {
    backgroundColor: "#6200EE",
    borderRadius: 10,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
  },

  loginButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
export default LoginScreen;
