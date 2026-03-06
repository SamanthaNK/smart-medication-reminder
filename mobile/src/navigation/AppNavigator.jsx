import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ReminderScreen from '../screens/ReminderScreen';
import HistoryScreen from '../screens/HistoryScreen';
import MissedDoseScreen from '../screens/MissedDoseScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
    const { token, isLoading, restoreSession } = useAuthStore();

    useEffect(() => {
        restoreSession();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
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
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}