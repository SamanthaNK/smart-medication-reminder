import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';
import { forgotPassword } from '../api/authApi';

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        if (!email) {
            setError('Please enter your email address.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await forgotPassword(email.toLowerCase().trim());
            navigation.navigate('ResetPassword', { email: email.toLowerCase().trim() });
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
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
                <View style={styles.container}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        accessibilityLabel="Go back"
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                    </TouchableOpacity>

                    <View style={styles.iconCircle}>
                        <Ionicons name="lock-open-outline" size={36} color={theme.colors.primary} />
                    </View>

                    <Text style={styles.title}>Forgot your{'\n'}password?</Text>
                    <Text style={styles.subtitle}>
                        Enter your email address and we will send you a 6-digit code to reset your password.
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
                            value={email}
                            onChangeText={(v) => { setEmail(v); setError(null); }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            accessibilityLabel="Email address"
                        />
                    </View>

                    {error && (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle-outline" size={18} color={theme.colors.danger} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                        accessibilityLabel="Send reset code"
                    >
                        {isLoading ? (
                            <ActivityIndicator color={theme.colors.textOnPrimary} />
                        ) : (
                            <Text style={styles.primaryButtonText}>Send Reset Code</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 56,
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
        flex: 1,
        ...theme.font.body,
        color: theme.colors.textPrimary,
        paddingVertical: theme.spacing.md,
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