import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';
import { useAuthStore } from '../store/authStore';

export default function HomeScreen() {
    const { user, clearSession } = useAuthStore();

    return (
        <ScreenBackground>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Good morning,</Text>
                        <Text style={styles.name}>{user?.name || 'there'}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={clearSession}
                        accessibilityLabel="Log out"
                    >
                        <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
                    </TouchableOpacity>
                </View>

                <View style={styles.placeholder}>
                    <Ionicons name="construct-outline" size={40} color={theme.colors.textSecondary} />
                    <Text style={styles.placeholderText}>Home screen coming soon</Text>
                </View>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.xl,
    },
    greeting: {
        ...theme.font.body,
        color: theme.colors.textSecondary,
    },
    name: {
        ...theme.font.heading,
        color: theme.colors.textPrimary,
    },
    logoutButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.dangerBg,
        borderWidth: 1,
        borderColor: theme.colors.dangerBorder,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    placeholderText: {
        ...theme.font.body,
        color: theme.colors.textSecondary,
    },
});