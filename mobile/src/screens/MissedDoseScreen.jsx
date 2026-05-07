import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';
import { markDoseMissed } from '../api/api';

const REASONS = [
    {
        value: 'forgot',
        label: 'I forgot',
        icon: 'time-outline',
        description: 'It slipped my mind',
    },
    {
        value: 'feeling_sick',
        label: 'Not feeling well',
        icon: 'thermometer-outline',
        description: 'I am not feeling well right now',
    },
    {
        value: 'no_pills',
        label: 'Ran out of pills',
        icon: 'cube-outline',
        description: 'I have no medication left',
    },
];

export default function MissedDoseScreen({ navigation, route }) {
    const { doseEvent } = route.params || {};
    const [selectedReason, setSelectedReason] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        if (!selectedReason) {
            setError('Please select a reason before continuing.');
            return;
        }
        if (!doseEvent?.id) {
            setError('Could not identify this dose. Please go back and try again.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await markDoseMissed(doseEvent.id, selectedReason);
            setIsSubmitted(true);
        } catch (err) {
            if (err.errorCode === 'ALREADY_RESOLVED') {
                setError('This dose has already been recorded.');
            } else {
                setError('Could not save your response. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        const isLowStock = selectedReason === 'no_pills';
        return (
            <ScreenBackground>
                <View style={styles.centreContainer}>
                    <View style={[styles.iconCircle, isLowStock && styles.iconCircleWarning]}>
                        <Ionicons
                            name={isLowStock ? 'alert-circle-outline' : 'checkmark'}
                            size={48}
                            color={isLowStock ? theme.colors.warning : theme.colors.success}
                        />
                    </View>
                    <Text style={styles.successTitle}>Response saved</Text>
                    <Text style={styles.successBody}>
                        {isLowStock
                            ? 'Your caregiver has been notified that you are running low on medication.'
                            : 'Your caregiver has been notified. Reach out if you need help.'}
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('Home')}
                        accessibilityLabel="Back to home"
                    >
                        <Text style={styles.primaryButtonText}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            </ScreenBackground>
        );
    }

    return (
        <ScreenBackground>
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.topSection}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="alert-circle-outline" size={36} color={theme.colors.danger} />
                    </View>
                    <Text style={styles.heading}>Missed dose</Text>
                    <Text style={styles.subheading}>
                        {doseEvent?.medication?.name || 'Medication'}
                    </Text>
                    <Text style={styles.body}>
                        What was the reason? Your caregiver will be notified so they can help you.
                    </Text>
                </View>

                <View style={styles.reasonList}>
                    {REASONS.map((reason) => {
                        const isSelected = selectedReason === reason.value;
                        return (
                            <TouchableOpacity
                                key={reason.value}
                                style={[styles.reasonCard, isSelected && styles.reasonCardActive]}
                                onPress={() => { setSelectedReason(reason.value); setError(null); }}
                                accessibilityLabel={reason.label}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: isSelected }}
                            >
                                <View style={[styles.reasonIcon, isSelected && styles.reasonIconActive]}>
                                    <Ionicons
                                        name={reason.icon}
                                        size={24}
                                        color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                                    />
                                </View>
                                <View style={styles.reasonText}>
                                    <Text style={[styles.reasonLabel, isSelected && styles.reasonLabelActive]}>
                                        {reason.label}
                                    </Text>
                                    <Text style={styles.reasonDesc}>{reason.description}</Text>
                                </View>
                                {isSelected && (
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={22}
                                        color={theme.colors.primary}
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {error && (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle-outline" size={18} color={theme.colors.danger} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (!selectedReason || isSubmitting) && styles.buttonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!selectedReason || isSubmitting}
                    accessibilityLabel="Submit missed dose reason"
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={theme.colors.textOnPrimary} />
                    ) : (
                        <Text style={styles.submitButtonText}>Send to Caregiver</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 56,
    },
    centreContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.lg,
    },
    backButton: {
        marginBottom: theme.spacing.md,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    topSection: {
        marginBottom: theme.spacing.xl,
    },
    headerIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.colors.dangerBg,
        borderWidth: 2,
        borderColor: theme.colors.dangerBorder,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    heading: {
        ...theme.font.heading,
        color: theme.colors.textPrimary,
        marginBottom: 4,
    },
    subheading: {
        ...theme.font.subheading,
        color: theme.colors.primary,
        marginBottom: theme.spacing.sm,
    },
    body: {
        ...theme.font.body,
        color: theme.colors.textSecondary,
        lineHeight: 26,
    },
    reasonList: {
        gap: theme.spacing.sm,
        flex: 1,
    },
    reasonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.card,
        borderWidth: 2,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
        minHeight: 80,
        gap: theme.spacing.md,
    },
    reasonCardActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryLight,
    },
    reasonIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reasonIconActive: {
        backgroundColor: theme.colors.surface,
    },
    reasonText: {
        flex: 1,
    },
    reasonLabel: {
        ...theme.font.subheading,
        color: theme.colors.textSecondary,
    },
    reasonLabelActive: {
        color: theme.colors.primary,
    },
    reasonDesc: {
        ...theme.font.caption,
        color: theme.colors.textSecondary,
        marginTop: 2,
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
    submitButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.button,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: theme.minTapTarget,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.xxl,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: { opacity: 0.5 },
    submitButtonText: {
        ...theme.font.button,
        color: theme.colors.textOnPrimary,
    },
    // Success state
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: theme.colors.successBg,
        borderWidth: 2,
        borderColor: theme.colors.successBorder,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircleWarning: {
        backgroundColor: theme.colors.warningBg,
        borderColor: theme.colors.warningBorder,
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
    primaryButtonText: {
        ...theme.font.button,
        color: theme.colors.textOnPrimary,
    },
});