import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';

export default function WelcomeScreen({ navigation }) {
    return (
        <ScreenBackground>
            <View style={styles.container}>
                <View style={styles.logoArea}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="medical" size={40} color={theme.colors.textOnPrimary} />
                    </View>
                    <Text style={styles.appName}>MedMate</Text>
                    <Text style={styles.tagline}>
                        Medication reminders for you{'\n'}and your family
                    </Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('Register')}
                        accessibilityLabel="Create a new account"
                    >
                        <Text style={styles.primaryButtonText}>Create Account</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.outlineButton}
                        onPress={() => navigation.navigate('Login')}
                        accessibilityLabel="Log in to existing account"
                    >
                        <Text style={styles.outlineButtonText}>Log In</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.footer}>
                    By continuing you agree to our Terms of Service
                </Text>
            </View>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 100,
        paddingBottom: theme.spacing.xxl,
    },
    logoArea: {
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: theme.spacing.sm,
    },
    appName: {
        ...theme.font.display,
        color: theme.colors.textPrimary,
    },
    tagline: {
        ...theme.font.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
    },
    actions: {
        width: '100%',
        gap: theme.spacing.md,
    },
    primaryButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.button,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        minHeight: theme.minTapTarget,
        justifyContent: 'center',
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
    outlineButton: {
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.button,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        minHeight: theme.minTapTarget,
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    outlineButtonText: {
        ...theme.font.button,
        color: theme.colors.primary,
    },
    footer: {
        ...theme.font.caption,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
});