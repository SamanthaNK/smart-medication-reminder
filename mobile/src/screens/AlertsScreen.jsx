import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';
import { useAuthStore } from '../store/authStore';
import { getAlerts, getDoseHistory } from '../api/api';

const statusColour = (s) => ({
    pending: theme.colors.info,
    taken: theme.colors.success,
    late: theme.colors.warning,
    missed: theme.colors.danger,
}[s] || theme.colors.textSecondary);

const statusLabel = (s) => ({
    pending: 'Due',
    taken: 'Taken',
    late: 'Taken Late',
    missed: 'Missed',
}[s] || s);

const alertTypeIcon = (type) => ({
    missed_dose: 'alert-circle',
    low_stock: 'warning',
}[type] || 'notifications');

const alertTypeLabel = (type) => ({
    missed_dose: 'Missed Dose',
    low_stock: 'Low Stock',
}[type] || type);

const alertTypeColour = (type) => ({
    missed_dose: theme.colors.danger,
    low_stock: theme.colors.warning,
}[type] || theme.colors.info);

function CaregiverAlerts({ navigation }) {
    const [alerts, setAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const loadAlerts = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        setError(null);
        try {
            const data = await getAlerts();
            setAlerts(data.alerts || []);
        } catch {
            setError('Could not load alerts. Pull down to retry.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadAlerts();
    }, [loadAlerts]);

    const renderAlertItem = ({ item: alert }) => {
        const isRead = alert.acknowledged_at !== null;
        const alertType = alert.type;
        const colour = alertTypeColour(alertType);
        const createdAt = new Date(alert.created_at);
        const timeStr = createdAt.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
        const dateStr = createdAt.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
        });

        return (
            <View
                style={[
                    styles.alertCard,
                    !isRead && styles.alertCardUnread,
                ]}
            >
                <View style={[styles.alertIconBox, { backgroundColor: colour + '20' }]}>
                    <Ionicons name={alertTypeIcon(alertType)} size={20} color={colour} />
                </View>

                <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                        <Text style={styles.alertType}>
                            {alertTypeLabel(alertType)}
                        </Text>
                        <Text style={styles.alertTime}>
                            {timeStr}
                        </Text>
                    </View>

                    <Text style={styles.alertPatient}>
                        {alert.patient?.name || 'Patient'}
                    </Text>

                    <Text style={[
                        styles.alertMessage,
                        isRead && styles.alertMessageRead,
                    ]}>
                        {alert.message_en}
                    </Text>

                    <Text style={styles.alertDate}>{dateStr}</Text>
                </View>

                {!isRead && <View style={styles.unreadDot} />}
            </View>
        );
    };

    return (
        <FlatList
            data={alerts}
            keyExtractor={(item) => item.id}
            renderItem={renderAlertItem}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => {
                        setIsRefreshing(true);
                        loadAlerts(true);
                    }}
                    tintColor={theme.colors.primary}
                />
            }
            ListHeaderComponent={
                <View style={styles.headerArea}>
                    <View style={styles.topBar}>
                        <Text style={styles.heading}>Notifications</Text>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>
            }
            ListEmptyComponent={
                !isLoading && !error ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={40} color={theme.colors.textSecondary} />
                        <Text style={styles.emptyText}>No alerts yet</Text>
                    </View>
                ) : null
            }
            ListFooterComponent={<View style={{ height: 20 }} />}
            contentContainerStyle={isLoading ? { flex: 1 } : undefined}
            showsVerticalScrollIndicator={false}
        />
    );
}

function PatientAlerts({ navigation, patientId }) {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const loadHistory = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        setError(null);
        try {
            const data = await getDoseHistory(patientId, { limit: 50 });
            setHistory(data.history || []);
        } catch {
            setError('Could not load history. Pull down to retry.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [patientId]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const renderHistoryItem = ({ item: dose }) => {
        const status = dose.status;
        const colour = statusColour(status);
        const scheduledTime = new Date(dose.scheduled_time);
        const timeStr = scheduledTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
        const dateStr = scheduledTime.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

        return (
            <View style={[styles.historyCard, { borderLeftColor: colour }]}>
                <View style={[styles.historyStatusDot, { backgroundColor: colour }]} />

                <View style={styles.historyContent}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.historyMedName}>
                            {dose.medication?.name || 'Medication'}
                        </Text>
                        <Text style={[styles.historyStatus, { color: colour }]}>
                            {statusLabel(status)}
                        </Text>
                    </View>

                    <Text style={styles.historyDose}>
                        {dose.medication?.dose_amount} {dose.medication?.dose_unit}
                        {dose.medication?.pill_colour ? ` · ${dose.medication.pill_colour}` : ''}
                    </Text>

                    <View style={styles.historyFooter}>
                        <Text style={styles.historyTime}>{timeStr}</Text>
                        <Text style={styles.historyDate}>{dateStr}</Text>
                    </View>

                    {dose.missed_reason && (
                        <Text style={styles.historyReason}>
                            Reason: {dose.missed_reason.replace(/_/g, ' ')}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={renderHistoryItem}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => {
                        setIsRefreshing(true);
                        loadHistory(true);
                    }}
                    tintColor={theme.colors.primary}
                />
            }
            ListHeaderComponent={
                <View style={styles.headerArea}>
                    <View style={styles.topBar}>
                        <Text style={styles.heading}>Dose History</Text>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>
            }
            ListEmptyComponent={
                !isLoading && !error ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={40} color={theme.colors.textSecondary} />
                        <Text style={styles.emptyText}>No dose history yet</Text>
                    </View>
                ) : null
            }
            ListFooterComponent={<View style={{ height: 20 }} />}
            contentContainerStyle={isLoading ? { flex: 1 } : undefined}
            showsVerticalScrollIndicator={false}
        />
    );
}

export default function AlertsScreen({ navigation }) {
    const { user } = useAuthStore();
    const isCaregiver = user?.role === 'caregiver';

    return (
        <ScreenBackground>
            {isCaregiver ? (
                <CaregiverAlerts navigation={navigation} />
            ) : (
                <PatientAlerts navigation={navigation} patientId={user?.id} />
            )}
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    headerArea: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 56,
        paddingBottom: theme.spacing.lg,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    heading: {
        fontSize: 28,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },

    alertCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        marginHorizontal: theme.spacing.lg,
        marginBottom: 10,
        padding: 14,
        gap: 12,
    },
    alertCardUnread: {
        backgroundColor: theme.colors.primaryLight,
        borderColor: theme.colors.primary,
    },
    alertIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    alertContent: {
        flex: 1,
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    alertType: {
        fontSize: 14,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
    },
    alertTime: {
        fontSize: 12,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
    },
    alertPatient: {
        fontSize: 13,
        fontFamily: 'Nunito_600SemiBold',
        color: theme.colors.primary,
        marginBottom: 4,
    },
    alertMessage: {
        fontSize: 13,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textPrimary,
        lineHeight: 18,
        marginBottom: 6,
    },
    alertMessageRead: {
        color: theme.colors.textSecondary,
    },
    alertDate: {
        fontSize: 11,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary,
        flexShrink: 0,
        marginTop: 2,
    },

    historyCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderLeftWidth: 4,
        marginHorizontal: theme.spacing.lg,
        marginBottom: 10,
        padding: 14,
        gap: 12,
    },
    historyStatusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        flexShrink: 0,
        marginTop: 4,
    },
    historyContent: {
        flex: 1,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    historyMedName: {
        fontSize: 14,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
    },
    historyStatus: {
        fontSize: 12,
        fontFamily: 'Nunito_700Bold',
    },
    historyDose: {
        fontSize: 12,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
        marginBottom: 6,
    },
    historyFooter: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 4,
    },
    historyTime: {
        fontSize: 12,
        fontFamily: 'Nunito_600SemiBold',
        color: theme.colors.primary,
    },
    historyDate: {
        fontSize: 12,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
    },
    historyReason: {
        fontSize: 11,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.warning,
        fontStyle: 'italic',
    },

    emptyState: {
        paddingVertical: 60,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
    },
});
