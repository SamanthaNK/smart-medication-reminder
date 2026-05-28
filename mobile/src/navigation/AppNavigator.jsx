import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ReminderScreen from '../screens/ReminderScreen';
import HistoryScreen from '../screens/HistoryScreen';
import MissedDoseScreen from '../screens/MissedDoseScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import VerifySuccessScreen from '../screens/VerifySuccessScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import RequestPatientLinkScreen from '../screens/RequestPatientLinkScreen';
import CreateMedicationScreen from '../screens/CreateMedicationScreen';
import AlertsScreen from '../screens/AlertsScreen';
import { registerFcmToken } from '../api/api';
import { theme } from '../utils/theme';

const Stack = createStackNavigator();

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

async function registerForPushNotifications() {
    const isExpoGo = Constants.appOwnership === 'expo';
    if (isExpoGo) {
        console.log('[PUSH] Running in Expo Go — remote push tokens not supported. Skipping.');
        return null;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'MedMate Reminders',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#7C3AED',
            sound: true,
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('[PUSH] Notification permission denied.');
        return null;
    }

    try {
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId ??
            null;

        const tokenData = await Notifications.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined
        );
        console.log('[PUSH] Expo push token obtained:', tokenData.data.slice(0, 30) + '...');
        return tokenData.data;
    } catch (err) {
        console.log('[PUSH] Could not obtain push token:', err.message);
        return null;
    }
}

function WrongPlatformScreen() {
    const { clearSession } = useAuthStore();
    return (
        <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
            backgroundColor: '#FDF6EE',
        }}>
            <Text style={{
                fontSize: 22,
                fontFamily: 'Nunito_700Bold',
                color: '#1E1033',
                textAlign: 'center',
                marginBottom: 12,
            }}>
                Wrong Platform
            </Text>
            <Text style={{
                fontSize: 16,
                fontFamily: 'Nunito_400Regular',
                color: '#7C6F9A',
                textAlign: 'center',
                lineHeight: 26,
                marginBottom: 32,
            }}>
                Clinic staff and administrator accounts are only accessible via the
                MedMate web dashboard. Please visit the web portal to continue.
            </Text>
            <TouchableOpacity
                onPress={clearSession}
                style={{
                    backgroundColor: '#7C3AED',
                    borderRadius: 50,
                    paddingVertical: 16,
                    paddingHorizontal: 40,
                }}
                accessibilityLabel="Sign out"
            >
                <Text style={{
                    color: '#fff',
                    fontSize: 16,
                    fontFamily: 'Nunito_700Bold',
                }}>
                    Sign Out
                </Text>
            </TouchableOpacity>
        </View>
    );
}

export default function AppNavigator() {
    const { token, user, isLoading, restoreSession } = useAuthStore();

    const [showSplash, setShowSplash] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(null);
    const navigationRef = useRef(null);

    const notifResponseListener = useRef(null);
    const notifReceivedListener = useRef(null);

    useEffect(() => {
        const init = async () => {
            await restoreSession();
            const seen = await AsyncStorage.getItem('onboarding_seen');
            setShowOnboarding(seen !== 'true');
        };
        init();
    }, []);

    useEffect(() => {
        if (!token) return;

        registerForPushNotifications()
            .then(async (pushToken) => {
                if (!pushToken) return;
                try {
                    await registerFcmToken(pushToken);
                    console.log('[PUSH] Token registered with backend');
                } catch (err) {
                    console.warn('[PUSH] Could not register token with backend:', err.message);
                }
            })
            .catch((err) => {
                console.warn('[PUSH] Unexpected error during push setup:', err.message);
            });

        notifReceivedListener.current = Notifications.addNotificationReceivedListener(
            (notification) => {
                console.log(
                    '[PUSH] Foreground notification:',
                    notification.request.content.title
                );
            }
        );

        notifResponseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                const data = response.notification.request.content.data;
                console.log('[PUSH] Notification tapped, data:', data);
                handleNotificationNavigation(data);
            }
        );

        Notifications.getLastNotificationResponseAsync()
            .then((response) => {
                if (response?.notification?.request?.content?.data) {
                    setTimeout(() => {
                        handleNotificationNavigation(
                            response.notification.request.content.data
                        );
                    }, 1500);
                }
            })
            .catch(() => { });

        return () => {
            if (notifReceivedListener.current) {
                notifReceivedListener.current.remove();
            }
            if (notifResponseListener.current) {
                notifResponseListener.current.remove();
            }
        };
    }, [token]);

    const handleNotificationNavigation = (data) => {
        if (!data || !navigationRef.current) return;

        if (data.type === 'missed_dose' && data.patientId) {
            navigationRef.current.navigate('History', {
                patientId: data.patientId,
                patientName: 'Patient',
            });
        }

        if (data.type === 'morning_briefing') {
            navigationRef.current.navigate('Home');
        }
    };

    if (isLoading || showOnboarding === null) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: theme.colors.background,
            }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (showSplash) {
        return <SplashScreen onFinish={() => setShowSplash(false)} />;
    }

    const isWebOnlyRole = user?.role === 'clinic_staff' || user?.role === 'admin';

    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {token ? (
                    <>
                        {isWebOnlyRole ? (
                            <Stack.Screen name="WrongPlatform" component={WrongPlatformScreen} />
                        ) : (
                            <>
                                <Stack.Screen name="Home" component={HomeScreen} />
                                <Stack.Screen name="Reminder" component={ReminderScreen} />
                                <Stack.Screen name="History" component={HistoryScreen} />
                                <Stack.Screen name="MissedDose" component={MissedDoseScreen} />
                                <Stack.Screen name="RequestPatientLink" component={RequestPatientLinkScreen} />
                                <Stack.Screen name="CreateMedication" component={CreateMedicationScreen} />
                                <Stack.Screen name="Alerts" component={AlertsScreen} />
                            </>
                        )}
                    </>
                ) : (
                    <>
                        {showOnboarding && (
                            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                        )}
                        <Stack.Screen name="Welcome" component={WelcomeScreen} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
                        <Stack.Screen name="VerifySuccess" component={VerifySuccessScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}