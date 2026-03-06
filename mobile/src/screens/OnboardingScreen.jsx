import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Dimensions,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        icon: 'alarm-outline',
        title: 'You will get a reminder\nfor every dose',
        description:
            'At each scheduled time, your phone will notify you. Open the notification and tap the large "Taken" button to confirm. If you do not respond, you will be reminded up to 3 times.',
        instruction: 'No internet needed — reminders work offline.',
    },
    {
        id: '2',
        icon: 'sunny-outline',
        title: 'Every morning,\nhear your day\'s plan',
        description:
            'At 7:00 AM the app will read aloud all your medications for the day — their names and times. You can replay this at any time from the home screen by tapping "Replay Briefing".',
        instruction: 'This also works without an internet connection.',
    },
    {
        id: '3',
        icon: 'people-outline',
        title: 'Your caregiver\nis kept informed',
        description:
            'If you miss a dose, your caregiver receives an alert on their phone. You will be asked why — whether you forgot, felt unwell, or ran out of pills. This helps them support you better.',
        instruction: 'You can also view your full medication history anytime.',
    },
];

const Dot = ({ active }) => (
    <View
        style={[
            styles.dot,
            active
                ? { backgroundColor: theme.colors.primary, width: 24 }
                : { backgroundColor: theme.colors.border, width: 8 },
        ]}
    />
);

export default function OnboardingScreen({ navigation }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef(null);

    const handleScroll = (event) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setActiveIndex(index);
    };

    const handleNext = () => {
        if (activeIndex < SLIDES.length - 1) {
            flatListRef.current.scrollToIndex({ index: activeIndex + 1 });
        } else {
            navigation.replace('Welcome');
        }
    };

    const handleSkip = () => {
        navigation.replace('Welcome');
    };

    const renderSlide = ({ item }) => (
        <View style={styles.slide}>
            <View style={styles.iconWrapper}>
                <View style={styles.iconCircle}>
                    <Ionicons name={item.icon} size={40} color={theme.colors.primary} />
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>

                <View style={styles.instructionBox}>
                    <Ionicons
                        name="information-circle-outline"
                        size={18}
                        color={theme.colors.info}
                        style={{ marginTop: 2 }}
                    />
                    <Text style={styles.instructionText}>{item.instruction}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <ScreenBackground>
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkip}
                    accessibilityLabel="Skip onboarding"
                >
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>

                <FlatList
                    ref={flatListRef}
                    data={SLIDES}
                    renderItem={renderSlide}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleScroll}
                    scrollEventThrottle={16}
                />

                <View style={styles.footer}>
                    <View style={styles.dots}>
                        {SLIDES.map((_, i) => (
                            <Dot key={i} active={i === activeIndex} />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={handleNext}
                        accessibilityLabel={
                            activeIndex === SLIDES.length - 1 ? 'Get started' : 'Next slide'
                        }
                    >
                        <Text style={styles.nextButtonText}>
                            {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                        </Text>
                        <Ionicons
                            name="arrow-forward"
                            size={20}
                            color={theme.colors.textOnPrimary}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    skipButton: {
        position: 'absolute',
        top: 56,
        right: theme.spacing.lg,
        zIndex: 10,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
    },
    skipText: {
        ...theme.font.body,
        color: theme.colors.textSecondary,
    },
    slide: {
        width,
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapper: {
        marginBottom: theme.spacing.xl,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: theme.colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    content: {
        alignItems: 'center',
        gap: theme.spacing.md,
        width: '100%',
    },
    title: {
        ...theme.font.heading,
        color: theme.colors.textPrimary,
        textAlign: 'center',
        lineHeight: 34,
    },
    description: {
        ...theme.font.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
        paddingHorizontal: theme.spacing.sm,
    },
    instructionBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.infoBg,
        borderWidth: 1,
        borderColor: theme.colors.infoBorder,
        borderRadius: theme.radius.badge,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    instructionText: {
        ...theme.font.caption,
        color: theme.colors.info,
        flex: 1,
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.xxl,
        gap: theme.spacing.lg,
        alignItems: 'center',
    },
    dots: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.button,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        minHeight: theme.minTapTarget,
        width: '100%',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    nextButtonText: {
        ...theme.font.button,
        color: theme.colors.textOnPrimary,
    },
});