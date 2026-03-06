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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';
import { verifyEmail, resendCode } from '../api/authApi';

export default function VerifyEmailScreen({ navigation, route }) {
    const { email } = route.params;

    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState(null);
    const [resendMessage, setResendMessage] = useState(null);

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

    const handleVerify = async () => {
        const code = digits.join('');
        if (code.length < 6) {
            setError('Please enter all 6 digits.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await verifyEmail(email, code);
            navigation.replace('VerifySuccess');
        } catch (err) {
            if (err.errorCode === 'CODE_EXPIRED') {
                setError('This code has expired. Please request a new one.');
            } else {
                setError('Incorrect code. Please check your email and try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        setResendMessage(null);
        setError(null);
        try {
            await resendCode(email);
            setResendMessage('A new code has been sent to your email.');
            setDigits(['', '', '', '', '', '']);
            inputRefs.current[0].focus();
        } catch (err) {
            setError('Failed to resend code. Please try again.');
        } finally {
            setIsResending(false);
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
                        <Ionicons name="mail-outline" size={36} color={theme.colors.primary} />
                    </View>

                    <Text style={styles.title}>Check your email</Text>
                    <Text style={styles.subtitle}>
                        We sent a 6-digit code to{'\n'}
                        <Text style={styles.emailHighlight}>{email}</Text>
                    </Text>

                    <View style={styles.codeRow}>
                        {digits.map((digit, i) => (
                            <TextInput
                                key={i}
                                ref={(ref) => (inputRefs.current[i] = ref)}
                                style={[
                                    styles.digitBox,
                                    digit ? styles.digitBoxFilled : null,
                                ]}
                                value={digit}
                                onChangeText={(v) => handleDigitChange(v, i)}
                                onKeyPress={(e) => handleKeyPress(e, i)}
                                keyboardType="number-pad"
                                maxLength={1}
                                textAlign="center"
                                accessibilityLabel={`Digit ${i + 1}`}
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    {error && (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle-outline" size={18} color={theme.colors.danger} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {resendMessage && (
                        <View style={styles.infoBox}>
                            <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.success} />
                            <Text style={styles.infoText}>{resendMessage}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                        onPress={handleVerify}
                        disabled={isLoading}
                        accessibilityLabel="Verify code"
                    >
                        {isLoading ? (
                            <ActivityIndicator color={theme.colors.textOnPrimary} />
                        ) : (
                            <Text style={styles.primaryButtonText}>Verify Email</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.resendButton}
                        onPress={handleResend}
                        disabled={isResending}
                        accessibilityLabel="Resend verification code"
                    >
                        {isResending ? (
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : (
                            <Text style={styles.resendText}>
                                Did not receive it?{' '}
                                <Text style={{ color: theme.colors.primary }}>Resend code</Text>
                            </Text>
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
        marginBottom: theme.spacing.lg,
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
        textAlign: 'center',
    },
    digitBoxFilled: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryLight,
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
        marginBottom: theme.spacing.md,
        width: '100%',
    },
    errorText: {
        ...theme.font.caption,
        color: theme.colors.danger,
        flex: 1,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.successBg,
        borderWidth: 1,
        borderColor: theme.colors.successBorder,
        borderRadius: theme.radius.badge,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginBottom: theme.spacing.md,
        width: '100%',
    },
    infoText: {
        ...theme.font.caption,
        color: theme.colors.success,
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
    resendButton: {
        marginTop: theme.spacing.lg,
        minHeight: theme.minTapTarget,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resendText: {
        ...theme.font.body,
        color: theme.colors.textSecondary,
    },
});