import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';
import { login } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen({ navigation }) {
    const { setSession } = useAuthStore();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setError(null);
    };

    const handleLogin = async () => {
        if (!form.email || !form.password) {
            setError('Please enter your email and password.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await login(form.email.toLowerCase().trim(), form.password);
            await setSession(data.token, data.user);
        } catch (err) {
            if (err.errorCode === 'EMAIL_NOT_VERIFIED') {
                setError('Please verify your email address before logging in. Check your inbox.');
            } else if (err.errorCode === 'INVALID_CREDENTIALS') {
                setError('Incorrect email or password. Please try again.');
            } else {
                setError(err.message || 'Login failed. Please try again.');
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
                    contentContainerStyle={styles.scrollContent}
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

                    <Text style={styles.title}>Welcome{'\n'}back</Text>
                    <Text style={styles.subtitle}>
                        Log in to manage your medications.
                    </Text>

                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons
                            name="mail-outline"
                            size={20}
                            color={theme.colors.textSecondary}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. marie@example.com"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={form.email}
                            onChangeText={(v) => updateField('email', v)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            accessibilityLabel="Email address"
                        />
                    </View>

                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={20}
                            color={theme.colors.textSecondary}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Your password"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={form.password}
                            onChangeText={(v) => updateField('password', v)}
                            secureTextEntry={!showPassword}
                            accessibilityLabel="Password"
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword((v) => !v)}
                            style={styles.eyeButton}
                            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                        >
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color={theme.colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.forgotButton}
                        onPress={() => navigation.navigate('ForgotPassword')}
                        accessibilityLabel="Forgot password"
                    >
                        <Text style={styles.forgotText}>Forgot your password?</Text>
                    </TouchableOpacity>

                    {error && (
                        <View style={styles.errorBox}>
                            <Ionicons
                                name="alert-circle-outline"
                                size={18}
                                color={theme.colors.danger}
                            />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        accessibilityLabel="Log in"
                    >
                        {isLoading ? (
                            <ActivityIndicator color={theme.colors.textOnPrimary} />
                        ) : (
                            <Text style={styles.primaryButtonText}>Log In</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.registerLink}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.registerLinkText}>
                            Don't have an account?{' '}
                            <Text style={{ color: theme.colors.primary }}>Create one</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 56,
        paddingBottom: theme.spacing.xxl,
    },
    backButton: {
        marginBottom: theme.spacing.lg,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    title: {
        ...theme.font.display,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
        lineHeight: 40,
    },
    subtitle: {
        ...theme.font.body,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xl,
    },
    label: {
        ...theme.font.subheading,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
        marginTop: theme.spacing.md,
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
    },
    inputIcon: {
        marginRight: theme.spacing.sm,
    },
    input: {
        flex: 1,
        ...theme.font.body,
        color: theme.colors.textPrimary,
        paddingVertical: theme.spacing.md,
    },
    eyeButton: {
        padding: theme.spacing.sm,
    },
    forgotButton: {
        alignSelf: 'flex-end',
        marginTop: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
    },
    forgotText: {
        ...theme.font.caption,
        color: theme.colors.primary,
    },
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
        marginTop: theme.spacing.xl,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    primaryButtonText: {
        ...theme.font.button,
        color: theme.colors.textOnPrimary,
    },
    registerLink: {
        marginTop: theme.spacing.lg,
        alignItems: 'center',
        minHeight: theme.minTapTarget,
        justifyContent: 'center',
    },
    registerLinkText: {
        ...theme.font.body,
        color: theme.colors.textSecondary,
    },
});