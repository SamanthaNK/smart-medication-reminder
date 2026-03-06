import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';

export default function VerifySuccessScreen({ navigation }) {
    return (
        <ScreenBackground>
            <View style={styles.container}>
                <View style={styles.iconCircle}>
                    <Ionicons name="checkmark" size={48} color={theme.colors.success} />
                </View>
                <Text style={styles.title}>Email verified</Text>
                <Text style={styles.body}>
                    Your account is now active. You can log in and start managing your medications.
                </Text>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.replace('Login')}
                    accessibilityLabel="Go to login"
                >
                    <Text style={styles.primaryButtonText}>Log In</Text>
                </TouchableOpacity>
            </View>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.lg,
    },
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
    title: {
        ...theme.font.heading,
        color: theme.colors.textPrimary,
        textAlign: 'center',
    },
    body: {
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