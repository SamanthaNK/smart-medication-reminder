import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';

const { width } = Dimensions.get('window');

const FEATURES = [
    {
        icon: 'alarm-outline',
        title: 'Reminders for every dose',
        description: 'At each scheduled time your phone notifies you. Tap "I took it" to confirm. Works offline.',
        bg: '#EDE9FE',
        iconColor: '#7C3AED',
    },
    {
        icon: 'sunny-outline',
        title: 'Daily morning briefing',
        description: "At 7 AM the app reads your full day's medication plan aloud. Tap \"Today's Briefing\" to replay it any time.",
        bg: '#FFF7ED',
        iconColor: '#EA580C',
    },
    {
        icon: 'people-outline',
        title: 'Your caregiver stays informed',
        description: 'If you miss a dose your caregiver receives an alert. You choose the reason: forgot, unwell, or out of pills.',
        bg: '#F0FDF4',
        iconColor: '#16A34A',
    },
];

const PillIllustration = () => (
    <View style={pill.container}>
        <View style={[pill.capsule, { backgroundColor: '#7C3AED', transform: [{ rotate: '-25deg' }], top: 20, left: 30 }]}>
            <View style={[pill.capsuleHalf, { backgroundColor: '#5B21B6' }]} />
        </View>
        <View style={[pill.round, { backgroundColor: '#C084FC', top: 10, right: 40 }]} />
        <View style={[pill.capsule, { backgroundColor: '#A78BFA', transform: [{ rotate: '15deg' }], bottom: 15, right: 25, width: 44, height: 20 }]}>
            <View style={[pill.capsuleHalf, { backgroundColor: '#7C3AED', width: 22, height: 20 }]} />
        </View>
        <View style={[pill.round, { backgroundColor: '#EDE9FE', width: 14, height: 14, bottom: 20, left: 20 }]} />
        <View style={[pill.round, { backgroundColor: '#DDD6FE', width: 10, height: 10, top: 45, left: 80 }]} />
        <View style={pill.plusContainer}>
            <View style={pill.plusH} />
            <View style={pill.plusV} />
        </View>
    </View>
);

const pill = StyleSheet.create({
    container: {
        width: width * 0.7,
        height: 130,
        position: 'relative',
        alignSelf: 'center',
        marginVertical: 8,
    },
    capsule: {
        position: 'absolute',
        width: 56,
        height: 24,
        borderRadius: 12,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    capsuleHalf: {
        width: 28,
        height: 24,
    },
    round: {
        position: 'absolute',
        width: 22,
        height: 22,
        borderRadius: 11,
    },
    plusContainer: {
        position: 'absolute',
        top: 55,
        left: 55,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    plusH: {
        position: 'absolute',
        width: 16,
        height: 3,
        borderRadius: 2,
        backgroundColor: '#C084FC',
    },
    plusV: {
        position: 'absolute',
        width: 3,
        height: 16,
        borderRadius: 2,
        backgroundColor: '#C084FC',
    },
});

export default function OnboardingScreen({ navigation }) {

    const handleGetStarted = async () => {
        await AsyncStorage.setItem('onboarding_seen', 'true');
        navigation.replace('Welcome');
    };

    return (
        <ScreenBackground>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.logoRow}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="medical" size={28} color="#fff" />
                    </View>
                    <Text style={styles.appName}>MedMate</Text>
                    <View style={styles.betaBadge}>
                        <Text style={styles.betaText}>BETA</Text>
                    </View>
                </View>

                <PillIllustration />

                <Text style={styles.headline}>
                    Your meds,{'\n'}
                    <Text style={styles.headlineAccent}>on time.</Text>
                    {' '}Every day.
                </Text>
                <Text style={styles.subline}>
                    Here is how MedMate keeps you and your family on track.
                </Text>

                {FEATURES.map((f, idx) => (
                    <View key={f.title} style={styles.featureCard}>
                        <View style={[styles.featureIconBox, { backgroundColor: f.bg }]}>
                            <Ionicons name={f.icon} size={26} color={f.iconColor} />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>{f.title}</Text>
                            <Text style={styles.featureDesc}>{f.description}</Text>
                        </View>
                        {/* Step number */}
                        <View style={styles.stepBubble}>
                            <Text style={styles.stepNum}>{idx + 1}</Text>
                        </View>
                    </View>
                ))}

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleGetStarted}
                    accessibilityLabel="Get started"
                >
                    <Text style={styles.buttonText}>Get Started</Text>
                </TouchableOpacity>

                <Text style={styles.footer}>No ads. No tracking. Just your health.</Text>
            </ScrollView>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 60,
        paddingBottom: theme.spacing.xxl,
        alignItems: 'center',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appName: {
        fontSize: 26,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
    },
    betaBadge: {
        backgroundColor: theme.colors.primaryLight,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    betaText: {
        fontSize: 10,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.primary,
        letterSpacing: 1,
    },
    headline: {
        fontSize: 30,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
        textAlign: 'center',
        lineHeight: 38,
        marginBottom: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    headlineAccent: {
        color: theme.colors.primary,
    },
    subline: {
        fontSize: 15,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        lineHeight: 22,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        padding: theme.spacing.md,
        marginBottom: 12,
        width: '100%',
        position: 'relative',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    featureIconBox: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 13,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
        lineHeight: 19,
    },
    stepBubble: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNum: {
        fontSize: 11,
        fontFamily: 'Nunito_700Bold',
        color: '#fff',
    },
    button: {
        backgroundColor: theme.colors.primary,
        borderRadius: 50,
        paddingVertical: 16,
        paddingHorizontal: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.xl,
        width: '100%',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    buttonText: {
        fontSize: 18,
        fontFamily: 'Nunito_700Bold',
        color: '#fff',
        letterSpacing: 0.5,
    },
    footer: {
        fontSize: 13,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.lg,
    },
});