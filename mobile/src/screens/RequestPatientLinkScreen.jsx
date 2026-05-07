import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';
import { requestLink } from '../api/api';

export default function RequestPatientLinkScreen({ navigation }) {
    const [patientEmail, setPatientEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleRequest = async () => {
        if (!patientEmail.trim()) {
            setError('Please enter a patient email address');
            return;
        }

        if (!patientEmail.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await requestLink(patientEmail.trim());
            setSuccess(true);
            setPatientEmail('');
            Alert.alert(
                'Request sent',
                `Link request sent to ${patientEmail}. They will be notified to accept or decline.`
            );
            setTimeout(() => {
                navigation.goBack();
            }, 1500);
        } catch (err) {
            setError(err.message || 'Failed to send link request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <ScreenBackground>
                <View style={styles.centreContainer}>
                    <View style={styles.successCircle}>
                        <Ionicons name="checkmark" size={52} color={theme.colors.success} />
                    </View>
                    <Text style={styles.successTitle}>Request sent!</Text>
                    <Text style={styles.successBody}>
                        Your link request has been sent to {patientEmail}. They will receive a notification to accept or decline.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.goBack()}
                        accessibilityLabel="Back to patients"
                    >
                        <Text style={styles.primaryButtonText}>Back to Patients</Text>
                    </TouchableOpacity>
                </View>
            </ScreenBackground>
        );
    }

    return (
        <ScreenBackground>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Back button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.headerSection}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="link-outline" size={32} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.heading}>Request Patient Link</Text>
                    <Text style={styles.subtitle}>
                        Enter the patient's email address to send them a caregiver link request
                    </Text>
                </View>

                {/* Form card */}
                <View style={styles.formCard}>
                    <Text style={styles.label}>Patient Email Address</Text>
                    <TextInput
                        style={[styles.input, error && styles.inputError]}
                        placeholder="patient@example.com"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={patientEmail}
                        onChangeText={(text) => {
                            setPatientEmail(text);
                            setError(null);
                        }}
                        editable={!isLoading}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        accessibilityLabel="Patient email input"
                    />
                    {error && (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle-outline" size={16} color={theme.colors.danger} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}
                </View>

                {/* Info box */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={18} color={theme.colors.info} />
                    <Text style={styles.infoText}>
                        The patient will receive a notification and can choose to accept or decline your request. You'll only have access to their dose history once they accept.
                    </Text>
                </View>

                {/* Submit button */}
                <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.buttonDisabled]}
                    onPress={handleRequest}
                    disabled={isLoading}
                    accessibilityLabel="Send link request"
                >
                    {isLoading ? (
                        <ActivityIndicator color={theme.colors.textOnPrimary} />
                    ) : (
                        <>
                            <Ionicons name="send-outline" size={20} color={theme.colors.textOnPrimary} />
                            <Text style={styles.submitButtonText}>Send Request</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Cancel button */}
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                    disabled={isLoading}
                    accessibilityLabel="Cancel and go back"
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </ScrollView>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 56,
        paddingBottom: theme.spacing.xxl,
    },
    centreContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.lg,
    },
    backButton: {
        marginBottom: theme.spacing.lg,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    headerIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    heading: {
        fontSize: 24,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    formCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.card,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
    },
    input: {
        fontSize: 16,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textPrimary,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.input,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.background,
    },
    inputError: {
        borderColor: theme.colors.danger,
        backgroundColor: theme.colors.dangerBg,
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
        marginTop: theme.spacing.sm,
    },
    errorText: {
        fontSize: 13,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.danger,
        flex: 1,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.infoBg,
        borderWidth: 1,
        borderColor: theme.colors.infoBorder,
        borderRadius: theme.radius.badge,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    infoText: {
        fontSize: 13,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.info,
        flex: 1,
        lineHeight: 20,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.button,
        paddingVertical: theme.spacing.lg,
        minHeight: 56,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: theme.spacing.md,
    },
    submitButtonText: {
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textOnPrimary,
    },
    cancelButton: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.button,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        paddingVertical: theme.spacing.lg,
        minHeight: 56,
    },
    cancelButtonText: {
        fontSize: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: theme.colors.textSecondary,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    successCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.successBg,
        borderWidth: 2,
        borderColor: theme.colors.successBorder,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successTitle: {
        fontSize: 24,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
        textAlign: 'center',
    },
    successBody: {
        fontSize: 15,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    primaryButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.button,
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        width: '100%',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textOnPrimary,
    },
});
