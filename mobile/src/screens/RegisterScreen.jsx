import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';
import { register } from '../api/authApi';

const ROLES = [
    { value: 'patient', label: 'Patient', icon: 'person-outline' },
    { value: 'caregiver', label: 'Caregiver', icon: 'heart-outline' },
];

export default function RegisterScreen({ navigation }) {
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'patient',
        city: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setError(null);
    };

    const handleRegister = async () => {
        if (!form.name || !form.email || !form.password) {
            setError('Please fill in all required fields.');
            return;
        }
        if (form.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await register({
                name: form.name,
                email: form.email,
                password: form.password,
                role: form.role,
                preferred_language: 'en',
                city: form.city || undefined,
            });
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <ScreenBackground>
                <View style={styles.successContainer}>
                    <View style={styles.successIconCircle}>
                        <Ionicons name="mail-outline" size={40} color={theme.colors.success} />
                    </View>
                    <Text style={styles.successTitle}>Check your email</Text>
                    <Text style={styles.successBody}>
                        We sent a verification link to{' '}
                        <Text style={{ color: theme.colors.primary }}>{form.email}</Text>.
                        {'\n\n'}Open the link to activate your account, then come back to log in.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.primaryButtonText}>Go to Login</Text>
                    </TouchableOpacity>
                </View>
            </ScreenBackground>
        );
    }

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

                    <Text style={styles.title}>Create your{'\n'}account</Text>
                    <Text style={styles.subtitle}>
                        Fill in your details to get started.
                    </Text>

                    <Text style={styles.label}>I am a</Text>
                    <View style={styles.roleRow}>
                        {ROLES.map((r) => (
                            <TouchableOpacity
                                key={r.value}
                                style={[
                                    styles.roleButton,
                                    form.role === r.value && styles.roleButtonActive,
                                ]}
                                onPress={() => updateField('role', r.value)}
                                accessibilityLabel={`Select role ${r.label}`}
                            >
                                <Ionicons
                                    name={r.icon}
                                    size={20}
                                    color={
                                        form.role === r.value
                                            ? theme.colors.primary
                                            : theme.colors.textSecondary
                                    }
                                />
                                <Text
                                    style={[
                                        styles.roleLabel,
                                        form.role === r.value && styles.roleLabelActive,
                                    ]}
                                >
                                    {r.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Full Name *</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons
                            name="person-outline"
                            size={20}
                            color={theme.colors.textSecondary}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Marie Dupont"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={form.name}
                            onChangeText={(v) => updateField('name', v)}
                            autoCapitalize="words"
                            accessibilityLabel="Full name"
                        />
                    </View>

                    <Text style={styles.label}>Email Address *</Text>
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
                            onChangeText={(v) => updateField('email', v.toLowerCase().trim())}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            accessibilityLabel="Email address"
                        />
                    </View>

                    <Text style={styles.label}>Password *</Text>
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

                    <Text style={styles.label}>City (optional)</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons
                            name="location-outline"
                            size={20}
                            color={theme.colors.textSecondary}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Yaoundé"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={form.city}
                            onChangeText={(v) => updateField('city', v)}
                            autoCapitalize="words"
                            accessibilityLabel="City"
                        />
                    </View>

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
                        onPress={handleRegister}
                        disabled={isLoading}
                        accessibilityLabel="Create account"
                    >
                        {isLoading ? (
                            <ActivityIndicator color={theme.colors.textOnPrimary} />
                        ) : (
                            <Text style={styles.primaryButtonText}>Create Account</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginLink}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.loginLinkText}>
                            Already have an account?{' '}
                            <Text style={{ color: theme.colors.primary }}>Log in</Text>
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
    roleRow: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    roleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.card,
        borderWidth: 2,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        minHeight: theme.minTapTarget,
    },
    roleButtonActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryLight,
    },
    roleLabel: {
        ...theme.font.subheading,
        color: theme.colors.textSecondary,
    },
    roleLabelActive: {
        color: theme.colors.primary,
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
    loginLink: {
        marginTop: theme.spacing.lg,
        alignItems: 'center',
        minHeight: theme.minTapTarget,
        justifyContent: 'center',
    },
    loginLinkText: {
        ...theme.font.body,
        color: theme.colors.textSecondary,
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.lg,
    },
    successIconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: theme.colors.successBg,
        borderWidth: 2,
        borderColor: theme.colors.successBorder,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successTitle: {
        ...theme.font.heading,
        color: theme.colors.textPrimary,
        textAlign: 'center',
    },
    successBody: {
        ...theme.font.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
    },
});