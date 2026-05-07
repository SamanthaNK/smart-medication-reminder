import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';
import { confirmDoseWithQueue } from '../services/offlineQueue';
import { speakDoseReminder, listenForConfirmation, stopSpeaking } from '../services/voiceService';

const PILL_COLOUR_MAP = {
    white: '#FFFFFF',
    yellow: '#FDE68A',
    orange: '#FDBA74',
    pink: '#F9A8D4',
    red: '#FCA5A5',
    blue: '#93C5FD',
    green: '#6EE7B7',
    purple: '#C4B5FD',
    brown: '#D4A574',
    grey: '#D1D5DB',
    gray: '#D1D5DB',
};

const PillColourDot = ({ colour }) => {
    const hex = PILL_COLOUR_MAP[colour?.toLowerCase()] || theme.colors.border;
    return <View style={[styles.colourDot, { backgroundColor: hex }]} />;
};

const VOICE_STATE = {
    IDLE: 'idle',
    LISTENING: 'listening',
    HEARD: 'heard',
    UNAVAILABLE: 'unavailable',
};

export default function ReminderScreen({ navigation, route }) {
    const { doseEvent } = route.params || {};

    const [isConfirming, setIsConfirming] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [wasQueued, setWasQueued] = useState(false);
    const [error, setError] = useState(null);
    const [voiceState, setVoiceState] = useState(VOICE_STATE.IDLE);

    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!doseEvent) return;
        const med = doseEvent.medication || {};
        const time = doseEvent.scheduled_time
            ? new Date(doseEvent.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';
        speakDoseReminder(med, time).catch(() => { });

        return () => { stopSpeaking().catch(() => { }); };
    }, []);

    useEffect(() => {
        if (voiceState === VOICE_STATE.LISTENING) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
        }
    }, [voiceState]);

    const handleConfirm = async (byVoice = false) => {
        if (!doseEvent?.id || isConfirming) return;
        setIsConfirming(true);
        setError(null);

        try {
            const { queued } = await confirmDoseWithQueue(doseEvent.id, byVoice);
            setWasQueued(queued);
            setIsConfirmed(true);
        } catch (err) {
            if (err.errorCode === 'ALREADY_RESOLVED') {
                setError('This dose has already been recorded.');
            } else {
                setError('Could not confirm dose. Please try again.');
            }
        } finally {
            setIsConfirming(false);
        }
    };

    const handleVoiceListen = async () => {
        if (voiceState === VOICE_STATE.LISTENING) return;
        setVoiceState(VOICE_STATE.LISTENING);

        const result = await listenForConfirmation(6000);

        if (result === 'yes') {
            setVoiceState(VOICE_STATE.HEARD);
            await handleConfirm(true);
        } else if (result === 'no') {
            setVoiceState(VOICE_STATE.IDLE);
            navigation.navigate('MissedDose', { doseEvent });
        } else if (result === null) {
            setVoiceState(VOICE_STATE.UNAVAILABLE);
        } else {
            setVoiceState(VOICE_STATE.IDLE);
        }
    };

    if (isConfirmed) {
        return (
            <ScreenBackground>
                <View style={styles.centreContainer}>
                    <View style={styles.successCircle}>
                        <Ionicons name="checkmark" size={52} color={theme.colors.success} />
                    </View>
                    <Text style={styles.successTitle}>Dose recorded</Text>
                    <Text style={styles.successBody}>
                        {wasQueued
                            ? 'Saved offline. It will sync automatically when you are back online.'
                            : 'Well done. Your caregiver has been notified you are on track.'}
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.goBack()}
                        accessibilityLabel="Back to home"
                    >
                        <Text style={styles.primaryButtonText}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            </ScreenBackground>
        );
    }

    if (!doseEvent) {
        return (
            <ScreenBackground>
                <View style={styles.centreContainer}>
                    <Ionicons name="alert-circle-outline" size={40} color={theme.colors.danger} />
                    <Text style={styles.successBody}>
                        Could not load dose details. Please open this from the home screen.
                    </Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.primaryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </ScreenBackground>
        );
    }

    const med = doseEvent.medication || {};
    const scheduledAt = doseEvent.scheduled_time
        ? new Date(doseEvent.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '--';

    return (
        <ScreenBackground>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>

                <Text style={styles.heading}>Time for your medication</Text>
                <Text style={styles.timeLabel}>Scheduled at {scheduledAt}</Text>

                <View style={styles.medCard}>
                    <View style={styles.medCardHeader}>
                        <Text style={styles.medName}>{med.name || 'Medication'}</Text>
                        {med.pill_colour && <PillColourDot colour={med.pill_colour} />}
                    </View>

                    <View style={styles.medDetailRow}>
                        <View style={styles.medDetail}>
                            <Text style={styles.medDetailLabel}>Dose</Text>
                            <Text style={styles.medDetailValue}>{med.dose_amount} {med.dose_unit}</Text>
                        </View>
                        {med.pill_shape && (
                            <View style={styles.medDetail}>
                                <Text style={styles.medDetailLabel}>Shape</Text>
                                <Text style={styles.medDetailValue}>{med.pill_shape}</Text>
                            </View>
                        )}
                        {med.pill_colour && (
                            <View style={styles.medDetail}>
                                <Text style={styles.medDetailLabel}>Colour</Text>
                                <Text style={styles.medDetailValue}>{med.pill_colour}</Text>
                            </View>
                        )}
                    </View>

                    {med.pill_notes && (
                        <View style={styles.notesBox}>
                            <Ionicons name="information-circle-outline" size={16} color={theme.colors.info} />
                            <Text style={styles.notesText}>{med.pill_notes}</Text>
                        </View>
                    )}
                </View>

                {voiceState !== VOICE_STATE.UNAVAILABLE && (
                    <View style={styles.voiceHintRow}>
                        <Ionicons name="mic-outline" size={16} color={theme.colors.textSecondary} />
                        <Text style={styles.voiceHint}>
                            {voiceState === VOICE_STATE.LISTENING
                                ? 'Listening… say "Yes" or "No"'
                                : 'You can also say "Yes" to confirm'}
                        </Text>
                    </View>
                )}

                {error && (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle-outline" size={18} color={theme.colors.danger} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <View style={styles.actionArea}>
                    <TouchableOpacity
                        style={[styles.takenButton, isConfirming && styles.buttonDisabled]}
                        onPress={() => handleConfirm(false)}
                        disabled={isConfirming}
                        accessibilityLabel="Mark dose as taken"
                    >
                        {isConfirming ? (
                            <ActivityIndicator color={theme.colors.textOnPrimary} />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={28} color={theme.colors.textOnPrimary} />
                                <Text style={styles.takenButtonText}>I took it</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {voiceState !== VOICE_STATE.UNAVAILABLE && (
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <TouchableOpacity
                                style={[
                                    styles.micButton,
                                    voiceState === VOICE_STATE.LISTENING && styles.micButtonActive,
                                ]}
                                onPress={handleVoiceListen}
                                disabled={isConfirming || voiceState === VOICE_STATE.LISTENING}
                                accessibilityLabel="Voice confirmation"
                            >
                                <Ionicons
                                    name={voiceState === VOICE_STATE.LISTENING ? 'radio-button-on' : 'mic-outline'}
                                    size={22}
                                    color={voiceState === VOICE_STATE.LISTENING ? theme.colors.textOnPrimary : theme.colors.primary}
                                />
                                <Text style={[
                                    styles.micButtonText,
                                    voiceState === VOICE_STATE.LISTENING && { color: theme.colors.textOnPrimary }
                                ]}>
                                    {voiceState === VOICE_STATE.LISTENING ? 'Listening…' : 'Say "Yes"'}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    <TouchableOpacity
                        style={styles.missedButton}
                        onPress={() => navigation.navigate('MissedDose', { doseEvent })}
                        disabled={isConfirming}
                        accessibilityLabel="Mark dose as missed"
                    >
                        <Text style={styles.missedButtonText}>I did not take it</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 56,
        paddingBottom: theme.spacing.xxl
    },
    centreContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.lg
    },
    backButton: {
        marginBottom: theme.spacing.lg,
        width: 40,
        height: 40,
        justifyContent: 'center'
    },
    heading: {
        ...theme.font.heading,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs
    },
    timeLabel: {
        ...theme.font.body,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xl
    },
    medCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.card,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg
    },
    medCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md
    },
    medName: {
        ...theme.font.heading,
        color: theme.colors.textPrimary,
        flex: 1
    },
    colourDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: theme.colors.border,
        marginLeft: theme.spacing.sm
    },
    medDetailRow: {
        flexDirection: 'row',
        gap: theme.spacing.lg,
        marginBottom: theme.spacing.md
    },
    medDetail: {
        flex: 1
    },
    medDetailLabel: {
        ...theme.font.caption,
        color: theme.colors.textSecondary,
        marginBottom: 2
    },
    medDetailValue: {
        ...theme.font.subheading,
        color: theme.colors.textPrimary
    },
    notesBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.infoBg,
        borderWidth: 1,
        borderColor: theme.colors.infoBorder,
        borderRadius: theme.radius.badge,
        padding: theme.spacing.sm
    },
    notesText: {
        ...theme.font.caption,
        color: theme.colors.info,
        flex: 1,
        lineHeight: 20
    },
    voiceHintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md
    },
    voiceHint: {
        ...theme.font.caption,
        color: theme.colors.textSecondary
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
        marginBottom: theme.spacing.lg
    },
    errorText: {
        ...theme.font.caption,
        color: theme.colors.danger,
        flex: 1
    },
    actionArea: {
        gap: theme.spacing.md
    },
    takenButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.button,
        paddingVertical: theme.spacing.lg,
        minHeight: 72,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4
    },
    takenButtonText: {
        ...theme.font.heading,
        color: theme.colors.textOnPrimary
    },
    micButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        borderRadius: theme.radius.button,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        minHeight: 56,
        backgroundColor: theme.colors.primaryLight
    },
    micButtonActive: {
        backgroundColor: theme.colors.primary
    },
    micButtonText: {
        ...theme.font.subheading,
        color: theme.colors.primary
    },
    missedButton: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.button,
        borderWidth: 2,
        borderColor: theme.colors.dangerBorder,
        paddingVertical: theme.spacing.lg,
        minHeight: 72,
        backgroundColor: theme.colors.dangerBg
    },
    missedButtonText: {
        ...theme.font.subheading,
        color: theme.colors.danger
    },
    successCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.successBg,
        borderWidth: 2,
        borderColor: theme.colors.successBorder,
        justifyContent: 'center',
        alignItems: 'center'
    },
    successTitle: {
        ...theme.font.heading,
        color: theme.colors.textPrimary,
        textAlign: 'center'
    },
    successBody: {
        ...theme.font.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 26
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
        elevation: 4
    },
    buttonDisabled: {
        opacity: 0.6
    },
    primaryButtonText: {
        ...theme.font.button,
        color: theme.colors.textOnPrimary
    },
});