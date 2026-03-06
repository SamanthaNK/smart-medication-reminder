import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';
import { resetPassword } from '../api/authApi';

export default function ResetPasswordScreen({ navigation, route }) {
    const { email } = route.params;
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const inputRefs = useRef([]);

    const handleDigitChange = (value, index) => {
        const cleaned = value.replace(/[^0-9]/g, '').slice(-1);
        const newDigits = [...digits];
        newDigits[index] = cleaned;
        setDigits(newDigits);
        setError(null);
        if (cleaned && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleReset = async () => {
        const code = digits.join('');
        if (code.length < 6) {
            setError('Please enter all 6 digits of your reset code.');
            return;
        }
        if (password.length < 8) {
            setError('New password must be at least 8 characters.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await resetPassword(email, code, password);
            navigation.replace('Login');
        } catch (err) {
            if (err.errorCode === 'CODE_EXPIRED') {
                setError('This code has expired. Please request a new one.');
            } else {
                setError('Invalid code. Please check your email and try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScreenBackground>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        accessibilityLabel="Go back"
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                    </TouchableOpacity>

                    <View style={styles.iconCircle}>
                        <Ionicons name="key-outline" size={36} color={theme.colors.primary} />
                    </View>

                    <Text style={styles.title}>Reset your{'\n'}password</Text>
                    <Text style={styles.subtitle}>
                        Enter the 6-digit code sent to{'\n'}
                        <Text style={styles.emailHighlight}>{email}</Text>
                    </Text>

                    <View style={styles.codeRow}>
                        {digits.map((digit, i) => (
                            <TextInput
                                key={i}
                                ref={(ref) => (inputRefs.current[i] = ref)}
                                style={[styles.digitBox, digit ? styles.digitBoxFilled : null]}
                                value={digit}
                                onChangeText={(v) => handleDigitChange(v, i)}
                                onKeyPress={(e) => handleKeyPress(e, i)}
                                keyboardType="number-pad"
                                maxLength={1}
                                textAlign="center"
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={20}
                            color={theme.colors.textSecondary}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Minimum 8 characters"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={password}
                            onChangeText={(v) => { setPassword(v); setError(null); }}
                            secureTextEntry={!showPassword}
                            accessibilityLabel="New password"
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword((v) => !v)}
                            style={styles.eyeButton}
                        >
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color={theme.colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>

                    {error && (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle-outline" size={18} color={theme.colors.danger} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                        onPress={handleReset}
                        disabled={isLoading}
                        accessibilityLabel="Reset password"
                    >
                        {isLoading ? (
                            <ActivityIndicator color={theme.colors.textOnPrimary} />
                        ) : (
                            <Text style={styles.primaryButtonText}>Reset Password</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 56,
        paddingBottom: theme.spacing.xxl,
        alignItems: 'center',
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: theme.spacing.lg,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primaryLight,
        borderWidth: 2,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    title: {
        ...theme.font.heading,
        color: theme.colors.textPrimary,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
        lineHeight: 34,
    },
    subtitle: {
        ...theme.font.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
        marginBottom: theme.spacing.xl,
    },
    emailHighlight: {
        color: theme.colors.primary,
        fontFamily: 'Nunito_600SemiBold',
    },
    codeRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.xl,
    },
    digitBox: {
        width: 48,
        height: 60,
        borderRadius: theme.radius.input,
        borderWidth: 2,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        ...theme.font.heading,
        color: theme.colors.textPrimary,
    },
    digitBoxFilled: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryLight,
    },
    label: {
        ...theme.font.subheading,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
        alignSelf: 'flex-start',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.input,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        paddingHorizontal: theme.spacing.md,
        minHeight: theme.minTapTarget,
        width: '100%',
    },
    inputIcon: { marginRight: theme.spacing.sm },
    input: {
        ...theme.font.body,
        color: theme.colors.textPrimary,
        paddingVertical: theme.spacing.md,
    },
    eyeButton: { padding: theme.spacing.sm },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.dangerBg,
        borderWidth: 1,
        borderColor: theme.colors.dangerBorder,
        borderRadius: theme.radius.badge,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginTop: theme.spacing.md,
        width: '100%',
    },
    errorText: {
        ...theme.font.caption,
        color: theme.colors.danger,
        flex: 1,
    },
    primaryButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.button,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: theme.minTapTarget,
        width: '100%',
        marginTop: theme.spacing.xl,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: { opacity: 0.6 },
    primaryButtonText: {
        ...theme.font.button,
        color: theme.colors.textOnPrimary,
    },
});