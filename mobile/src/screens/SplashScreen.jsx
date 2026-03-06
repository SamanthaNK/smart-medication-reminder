import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';

export default function SplashScreen({ onFinish }) {
    const pulse = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1.08,
                    duration: 900,
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        const timer = setTimeout(() => {
            if (onFinish) onFinish();
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <ScreenBackground>
            <View style={styles.container}>
                <Animated.View
                    style={[
                        styles.iconWrapper,
                        { opacity, transform: [{ scale: pulse }] },
                    ]}
                >
                    <View style={styles.iconCircle}>
                        <Ionicons
                            name="medical"
                            size={48}
                            color={theme.colors.textOnPrimary}
                        />
                    </View>
                </Animated.View>

                <Animated.View style={{ opacity }}>
                    <Text style={styles.appName}>MedMate</Text>
                    <Text style={styles.tagline}>Your medication companion</Text>
                </Animated.View>
            </View>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing.lg,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    appName: {
        ...theme.font.display,
        color: theme.colors.textPrimary,
        textAlign: 'center',
    },
    tagline: {
        ...theme.font.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.xs,
    },
});