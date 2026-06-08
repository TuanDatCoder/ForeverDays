import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRelationship } from '../core/RelationshipContext';
import { Eye, EyeOff } from 'lucide-react-native';

export const AuthScreen: React.FC = () => {
  const { register, signIn, startDemoMode, error, isLoading, clearError } = useRelationship();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    clearError();
    if (!email || !password) return;

    if (isRegister) {
      if (!nickname) return;
      register(email, password, nickname);
    } else {
      signIn(email, password);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>ForeverDays</Text>
            <Text style={styles.subtitle}>Ghi dấu tình yêu • Nhắc nhở từng ngày</Text>
          </View>

          {error && (
            <View style={[styles.card, styles.errorCard]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {isRegister && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Biệt danh của bạn</Text>
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                placeholder="Nhập biệt danh..."
                placeholderTextColor="#666"
                style={styles.input}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="nhapemail@example.com"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                style={[styles.input, styles.passwordInput]}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(v => !v)}
                style={styles.eyeButton}
                activeOpacity={0.6}
              >
                {showPassword ? <EyeOff size={18} color={AppTheme.textSecondary} /> : <Eye size={18} color={AppTheme.textSecondary} />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Đang xử lý...' : isRegister ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              clearError();
              setIsRegister(!isRegister);
            }}
            activeOpacity={0.6}
            style={styles.switchButton}
          >
            <Text style={styles.switchText}>
              {isRegister ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký ngay'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            onPress={startDemoMode}
            activeOpacity={0.8}
            style={[styles.button, styles.secondaryButton]}
          >
            <Text style={styles.secondaryButtonText}>Vào bản thử nghiệm (Demo Mode)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const AppTheme = {
  bgPrimary: '#fff6f7',
  bgCard: '#ffffff',
  borderColor: '#3d2f3d',
  textPrimary: '#3d2f3d',
  textSecondary: '#856a85',
  colorPrimary: '#ff6584',
  colorSecondary: '#00b894',
  colorWarning: '#ee5253',
  borderWidth: 2.2,
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: AppTheme.bgPrimary,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: AppTheme.bgCard,
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    borderRadius: 16,
    padding: 24,
    shadowColor: AppTheme.borderColor,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: AppTheme.colorPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    color: AppTheme.textSecondary,
    fontWeight: '700',
    fontSize: 13,
    marginTop: 4,
  },
  errorCard: {
    backgroundColor: 'rgba(255, 183, 178, 0.1)',
    borderColor: AppTheme.colorWarning,
    padding: 12,
    marginBottom: 20,
    elevation: 0,
    shadowOpacity: 0,
  },
  errorText: {
    color: AppTheme.colorWarning,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '800',
    fontSize: 12,
    color: AppTheme.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: AppTheme.bgPrimary,
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: AppTheme.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  button: {
    backgroundColor: AppTheme.colorPrimary,
    borderWidth: AppTheme.borderWidth,
    borderColor: AppTheme.borderColor,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppTheme.borderColor,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: AppTheme.borderColor,
    fontWeight: '800',
    fontSize: 16,
  },
  switchButton: {
    alignItems: 'center',
  },
  switchText: {
    color: AppTheme.colorSecondary,
    fontWeight: '800',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  divider: {
    borderTopWidth: 2,
    borderColor: AppTheme.borderColor,
    borderStyle: 'dashed',
    marginVertical: 20,
  },
  secondaryButton: {
    backgroundColor: AppTheme.bgCard,
    marginTop: 0,
  },
  secondaryButtonText: {
    color: AppTheme.textPrimary,
    fontWeight: '800',
    fontSize: 14,
  },
});
export default AuthScreen;
