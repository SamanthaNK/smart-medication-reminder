import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { theme } from '../utils/theme';

const Stack = createStackNavigator();

export default function AppNavigator() {
    const { token, isLoading, restoreSession } = useAuthStore();
    const [showSplash, setShowSplash] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(null);

    useEffect(() => {
        const init = async () => {
            await restoreSession();
            const seen = await AsyncStorage.getItem('onboarding_seen');
            setShowOnboarding(seen !== 'true');
        };
        init();
    }, []);

    if (isLoading || showOnboarding === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (showSplash) {
        return <SplashScreen onFinish={() => setShowSplash(false)} />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {token ? (
                    <>
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="Reminder" component={ReminderScreen} />
                        <Stack.Screen name="History" component={HistoryScreen} />
                        <Stack.Screen name="MissedDose" component={MissedDoseScreen} />
                        <Stack.Screen name="RequestPatientLink" component={RequestPatientLinkScreen} />
                        <Stack.Screen name="CreateMedication" component={CreateMedicationScreen} />
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