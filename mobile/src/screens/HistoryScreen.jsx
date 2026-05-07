import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';
import { useAuthStore } from '../store/authStore';
import { getDoseHistory } from '../api/api';

const FILTERS = [
    { value: null, label: 'All' },
    { value: 'pending', label: 'Due' },
    { value: 'taken', label: 'Taken' },
    { value: 'late', label: 'Late' },
    { value: 'missed', label: 'Missed' },
];

const statusColour = (status) => {
    const map = {
        pending: theme.colors.info,
        taken: theme.colors.success,
        late: theme.colors.warning,
        missed: theme.colors.danger,
    };
    return map[status] || theme.colors.textSecondary;
};

const statusBg = (status) => {
    const map = {
        pending: theme.colors.infoBg,
        taken: theme.colors.successBg,
        late: theme.colors.warningBg,
        missed: theme.colors.dangerBg,
    };
    return map[status] || theme.colors.surface;
};

const statusLabel = (status) => {
    const map = { pending: 'Due', taken: 'Taken', late: 'Taken Late', missed: 'Missed' };
    return map[status] || status;
};

const missedReasonLabel = (reason) => {
    const map = {
        forgot: 'Forgot',
        feeling_sick: 'Not feeling well',
        no_pills: 'Ran out of pills',
        no_response: 'No response',
    };
    return map[reason] || reason;
};

const formatDateTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
        + ' at '
        + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function HistoryScreen({ navigation, route }) {
    const { user } = useAuthStore();
    const [history, setHistory] = useState([]);
    const [activeFilter, setActiveFilter] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const { patientId: routePatientId, patientName } = route.params || {};
    const targetId = routePatientId || user.id;

    const loadHistory = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        setError(null);

        try {
            const data = await getDoseHistory(targetId, {
                status: activeFilter || undefined,
                limit: 100,
            });
            setHistory(data.history || []);
        } catch {
            setError('Could not load history. Pull down to retry.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [targetId, activeFilter]);

    useEffect(() => {
        loadHistory();
    }, [activeFilter]);

    const renderItem = ({ item: dose }) => {
        const colour = statusColour(dose.status);
        const bg = statusBg(dose.status);

        return (
            <View style={[styles.historyCard, { borderLeftColor: colour }]}>
                <View style={styles.cardRow}>
                    <View style={styles.cardMain}>
                        <Text style={styles.medName}>{dose.medication?.name}</Text>
                        <Text style={styles.metaText}>
                            {dose.medication?.dose_amount} {dose.medication?.dose_unit}
                        </Text>
                        <Text style={styles.metaText}>
                            {formatDateTime(dose.scheduled_time)}
                        </Text>
                        {dose.status === 'missed' && dose.missed_reason && (
                            <View style={styles.reasonTag}>
                                <Ionicons name="alert-circle-outline" size={13} color={theme.colors.danger} />
                                <Text style={styles.reasonText}>{missedReasonLabel(dose.missed_reason)}</Text>
                            </View>
                        )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
                        <Text style={[styles.statusText, { color: colour }]}>
                            {statusLabel(dose.status)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <ScreenBackground>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>
                    {patientName ? `${patientName}'s History` : 'History'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.filterRow}>
                {FILTERS.map((f) => (
                    <TouchableOpacity
                        key={String(f.value)}
                        style={[styles.filterTab, activeFilter === f.value && styles.filterTabActive]}
                        onPress={() => setActiveFilter(f.value)}
                        accessibilityLabel={`Filter by ${f.label}`}
                    >
                        <Text style={[styles.filterText, activeFilter === f.value && styles.filterTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {isLoading ? (
                <View style={styles.centreState}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.stateText}>Loading history...</Text>
                </View>
            ) : error ? (
                <View style={styles.centreState}>
                    <Ionicons name="cloud-offline-outline" size={36} color={theme.colors.textSecondary} />
                    <Text style={styles.stateText}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={() => { setIsRefreshing(true); loadHistory(true); }}
                            tintColor={theme.colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.centreState}>
                            <Ionicons name="documents-outline" size={36} color={theme.colors.textSecondary} />
                            <Text style={styles.stateText}>No records found.</Text>
                        </View>
                    }
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 56,
        paddingBottom: theme.spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    title: {
        ...theme.font.heading,
        color: theme.colors.textPrimary,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
        flexWrap: 'wrap',
    },
    filterTab: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.button,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        minHeight: 36,
        justifyContent: 'center',
    },
    filterTabActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    filterText: {
        ...theme.font.caption,
        color: theme.colors.textSecondary,
        fontFamily: 'Nunito_600SemiBold',
    },
    filterTextActive: {
        color: theme.colors.textOnPrimary,
    },
    listContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.xxl,
    },
    historyCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.card,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderLeftWidth: 4,
        marginBottom: theme.spacing.sm,
        overflow: 'hidden',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        gap: theme.spacing.md,
    },
    cardMain: {
        flex: 1,
    },
    medName: {
        ...theme.font.subheading,
        color: theme.colors.textPrimary,
        marginBottom: 2,
    },
    metaText: {
        ...theme.font.caption,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    reasonTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: theme.spacing.sm,
        backgroundColor: theme.colors.dangerBg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    reasonText: {
        ...theme.font.caption,
        color: theme.colors.danger,
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.radius.badge,
        alignSelf: 'flex-start',
    },
    statusText: {
        ...theme.font.caption,
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 12,
    },
    centreState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.xxl,
    },
    stateText: {
        ...theme.font.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
});