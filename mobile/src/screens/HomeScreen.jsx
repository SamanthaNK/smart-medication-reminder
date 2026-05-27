import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';
import { useAuthStore } from '../store/authStore';
import { getDoseHistory, getMedications, getPendingLinks, respondToLink, getLinkedPatients, getRiskScore, getAlerts } from '../api/api';
import { cacheMedications } from '../services/notificationService';
import { getMorningBriefingScript, playMorningBriefing } from '../services/briefingService';
import { flushQueue, getQueueCount } from '../services/offlineQueue';
import { rescheduleAllMedicationReminders, scheduleMorningBriefing } from '../services/localNotificationService';


const todayStr = () => new Date().toISOString().split('T')[0];

const statusColour = (s) => ({
    pending: theme.colors.info,
    taken: theme.colors.success,
    late: theme.colors.warning,
    missed: theme.colors.danger,
}[s] || theme.colors.textSecondary);

const statusBg = (s) => ({
    pending: theme.colors.infoBg,
    taken: theme.colors.successBg,
    late: theme.colors.warningBg,
    missed: theme.colors.dangerBg,
}[s] || theme.colors.surface);

const statusLabel = (s) => ({
    pending: 'Due',
    taken: 'Taken',
    late: 'Taken Late',
    missed: 'Missed',
}[s] || s);

const riskColour = (tier) => ({
    green: '#065F46',
    amber: '#92400E',
    red: '#9F1239',
}[tier] || theme.colors.textSecondary);

const riskBg = (tier) => ({
    green: '#ECFDF5',
    amber: '#FFFBEB',
    red: '#FFF1F2',
}[tier] || theme.colors.surface);

const riskBorder = (tier) => ({
    green: '#6EE7B7',
    amber: '#FCD34D',
    red: '#FDA4AF',
}[tier] || theme.colors.border);

const MiniPill = ({ colour = '#7C3AED', rotate = '0deg', scale = 1 }) => (
    <View style={{
        width: 36 * scale,
        height: 16 * scale,
        borderRadius: 8 * scale,
        backgroundColor: colour,
        transform: [{ rotate }],
        flexDirection: 'row',
        overflow: 'hidden',
    }}>
        <View style={{ width: 18 * scale, height: 16 * scale, backgroundColor: `${colour}88` }} />
    </View>
);

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DateStrip = () => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + (i - 3));
        return { date: d, isToday: i === 3 };
    });

    return (
        <View style={ds.row}>
            {days.map(({ date, isToday }) => (
                <View key={date.toISOString()} style={[ds.cell, isToday && ds.cellActive]}>
                    <Text style={[ds.dayName, isToday && ds.dayNameActive]}>
                        {DAY_NAMES[date.getDay()]}
                    </Text>
                    <Text style={[ds.dayNum, isToday && ds.dayNumActive]}>
                        {date.getDate()}
                    </Text>
                    {isToday && <View style={ds.dot} />}
                </View>
            ))}
        </View>
    );
};

const ds = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.lg,
    },
    cell: {
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 14,
        flex: 1,
        marginHorizontal: 2,
    },
    cellActive: {
        backgroundColor: theme.colors.primary,
    },
    dayName: {
        fontSize: 11,
        fontFamily: 'Nunito_600SemiBold',
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    dayNameActive: {
        color: 'rgba(255,255,255,0.8)',
    },
    dayNum: {
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
    },
    dayNumActive: {
        color: '#fff',
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#C4B5FD',
        marginTop: 4,
    },
});

const ProgressBanner = ({ taken, total }) => {
    const pct = total > 0 ? Math.round((taken / total) * 100) : 0;
    return (
        <View style={pb.card}>
            <View style={pb.topRow}>
                <View style={pb.iconBox}>
                    <Ionicons name="medical" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={pb.label}>Today's progress</Text>
                    <Text style={pb.value}>{taken} of {total} doses taken</Text>
                </View>
                <Text style={pb.pct}>{pct}%</Text>
            </View>
            <View style={pb.barBg}>
                <View style={[pb.barFill, { width: `${pct}%` }]} />
            </View>
        </View>
    );
};

const pb = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.primary,
        borderRadius: 20,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 12,
        fontFamily: 'Nunito_400Regular',
        color: 'rgba(255,255,255,0.75)',
    },
    value: {
        fontSize: 15,
        fontFamily: 'Nunito_700Bold',
        color: '#fff',
    },
    pct: {
        fontSize: 22,
        fontFamily: 'Nunito_700Bold',
        color: '#fff',
    },
    barBg: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 3,
    },
    barFill: {
        height: 6,
        backgroundColor: '#fff',
        borderRadius: 3,
    },
});

function PatientHome({ user, navigation, onOpenBriefing }) {
    const [todayDoses, setTodayDoses] = useState([]);
    const [pendingLinks, setPendingLinks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [queueCount, setQueueCount] = useState(0);
    const { clearSession } = useAuthStore();

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        setError(null);
        try {
            const from = `${todayStr()}T00:00:00.000Z`;
            const to = `${todayStr()}T23:59:59.999Z`;

            const [historyData, medsData, linksData] = await Promise.all([
                getDoseHistory(user.id, { from, to, limit: 50 }),
                getMedications(user.id),
                getPendingLinks(),
            ]);

            setTodayDoses(historyData.history || []);
            setPendingLinks(linksData.links || []);
            await cacheMedications(medsData.medications || []);
            await rescheduleAllMedicationReminders(medsData.medications || []);
            await scheduleMorningBriefing();

            const count = await getQueueCount();
            setQueueCount(count);

            if (count > 0) {
                flushQueue().then(async ({ flushed }) => {
                    if (flushed > 0) {
                        const refreshed = await getDoseHistory(user.id, { from, to, limit: 50 });
                        setTodayDoses(refreshed.history || []);
                        setQueueCount(await getQueueCount());
                    }
                }).catch(() => { });
            }
        } catch {
            setError('Could not load your schedule. Pull down to retry.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user]);

    useEffect(() => { loadData(); }, []);

    const handleRespondToLink = async (linkId, action) => {
        try {
            await respondToLink(linkId, action);
            setPendingLinks((prev) => prev.filter((l) => l.id !== linkId));
        } catch { }
    };

    const takenCount = todayDoses.filter((d) => d.status === 'taken' || d.status === 'late').length;
    const pillAccents = ['#7C3AED', '#A78BFA', '#C084FC', '#6D28D9'];

    const renderDoseCard = ({ item: dose, index }) => {
        const isPending = dose.status === 'pending';
        const colour = statusColour(dose.status);
        const bg = statusBg(dose.status);
        const pillColour = pillAccents[index % pillAccents.length];

        return (
            <TouchableOpacity
                style={styles.doseCard}
                onPress={() => isPending && navigation.navigate('Reminder', { doseEvent: dose })}
                activeOpacity={isPending ? 0.75 : 1}
                accessibilityLabel={`${dose.medication?.name}, ${statusLabel(dose.status)}`}
            >
                <View style={styles.doseTimeCol}>
                    <Text style={styles.doseTimeText}>
                        {new Date(dose.scheduled_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                    <View style={[styles.doseTimeLine, { backgroundColor: colour + '40' }]} />
                </View>

                <View style={[styles.doseCardBody, { borderLeftColor: colour }]}>
                    <View style={styles.pillDecor}>
                        <MiniPill
                            colour={isPending ? pillColour : colour}
                            rotate="-20deg"
                            scale={0.75}
                        />
                    </View>

                    <View style={styles.doseCardContent}>
                        <Text style={styles.doseName}>{dose.medication?.name}</Text>
                        <Text style={styles.doseMeta}>
                            {dose.medication?.dose_amount} {dose.medication?.dose_unit}
                            {dose.medication?.pill_colour
                                ? `  ·  ${dose.medication.pill_colour}`
                                : ''}
                        </Text>
                    </View>

                    <View style={[styles.statusPill, { backgroundColor: bg }]}>
                        <Text style={[styles.statusPillText, { color: colour }]}>
                            {statusLabel(dose.status)}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <FlatList
            data={todayDoses}
            keyExtractor={(item) => item.id}
            renderItem={renderDoseCard}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => { setIsRefreshing(true); loadData(true); }}
                    tintColor={theme.colors.primary}
                />
            }
            ListHeaderComponent={
                <View style={styles.headerArea}>
                    <View style={styles.topBar}>
                        <View>
                            <Text style={styles.greeting}>Good day,</Text>
                            <Text style={styles.name}>{user?.name || 'there'}</Text>
                        </View>
                        <View style={styles.topActions}>
                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={() => navigation.navigate('Alerts')}
                                accessibilityLabel="View notifications"
                            >
                                <Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={() => navigation.navigate('History')}
                                accessibilityLabel="View history"
                            >
                                <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.iconBtnDanger}
                                onPress={clearSession}
                                accessibilityLabel="Log out"
                            >
                                <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {queueCount > 0 && (
                        <View style={styles.queueBanner}>
                            <Ionicons name="cloud-offline-outline" size={16} color={theme.colors.warning} />
                            <Text style={styles.queueText}>
                                {queueCount} action{queueCount > 1 ? 's' : ''} saved offline — will sync when connected
                            </Text>
                        </View>
                    )}

                    <DateStrip />

                    {todayDoses.length > 0 && (
                        <ProgressBanner taken={takenCount} total={todayDoses.length} />
                    )}

                    <TouchableOpacity
                        style={styles.briefingCard}
                        onPress={onOpenBriefing}
                        accessibilityLabel="Open morning briefing"
                    >
                        <View style={styles.briefingLeft}>
                            <View style={styles.briefingIconBox}>
                                <Ionicons name="sunny" size={20} color="#EA580C" />
                            </View>
                            <View>
                                <Text style={styles.briefingTitle}>Morning Briefing</Text>
                                <Text style={styles.briefingSub}>Tap to hear your schedule</Text>
                            </View>
                        </View>
                        <View style={styles.briefingChevron}>
                            <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
                        </View>
                    </TouchableOpacity>

                    {pendingLinks.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Caregiver Requests</Text>
                            {pendingLinks.map((link) => (
                                <View key={link.id} style={styles.linkCard}>
                                    <View style={styles.linkAvatar}>
                                        <Text style={styles.linkAvatarText}>
                                            {(link.caregiver?.name || '?')[0].toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.linkName}>{link.caregiver?.name}</Text>
                                        <Text style={styles.linkSub}>wants to be your caregiver</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.linkReject}
                                        onPress={() => handleRespondToLink(link.id, 'reject')}
                                        accessibilityLabel="Decline"
                                    >
                                        <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.linkApprove}
                                        onPress={() => handleRespondToLink(link.id, 'approve')}
                                        accessibilityLabel="Accept"
                                    >
                                        <Text style={styles.linkApproveText}>Accept</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {!isLoading && !error && todayDoses.length > 0 && (
                        <Text style={[styles.sectionTitle, { paddingHorizontal: 0 }]}>
                            Today's doses
                        </Text>
                    )}

                    {isLoading && (
                        <View style={styles.centreState}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={styles.stateText}>Loading your schedule...</Text>
                        </View>
                    )}
                    {!isLoading && error && (
                        <View style={styles.centreState}>
                            <Ionicons name="cloud-offline-outline" size={36} color={theme.colors.textSecondary} />
                            <Text style={styles.stateText}>{error}</Text>
                        </View>
                    )}
                    {!isLoading && !error && todayDoses.length === 0 && (
                        <View style={styles.centreState}>
                            <Ionicons name="checkmark-circle-outline" size={36} color={theme.colors.success} />
                            <Text style={styles.stateText}>No doses scheduled for today.</Text>
                        </View>
                    )}
                </View>
            }
            ListFooterComponent={<View style={{ height: 60 }} />}
            showsVerticalScrollIndicator={false}
        />
    );
}

function CaregiverHome({ user, navigation }) {
    const [patients, setPatients] = useState([]);
    const [riskMap, setRiskMap] = useState({});
    const [alertsByPatient, setAlertsByPatient] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const { clearSession } = useAuthStore();

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        setError(null);
        try {
            const [data, alertsData] = await Promise.all([
                getLinkedPatients(),
                getAlerts(),
            ]);
            const linked = data.patients || [];
            setPatients(linked);

            const alerts = alertsData.alerts || [];
            const alertMap = {};
            alerts.forEach((alert) => {
                if (!alertMap[alert.patient_id]) {
                    alertMap[alert.patient_id] = [];
                }
                alertMap[alert.patient_id].push(alert);
            });
            setAlertsByPatient(alertMap);

            const riskResults = await Promise.allSettled(
                linked.map((link) => getRiskScore(link.patient?.id))
            );

            const map = {};
            riskResults.forEach((result, i) => {
                const pid = linked[i].patient?.id;
                if (result.status === 'fulfilled' && result.value?.scores?.[0]) {
                    map[pid] = result.value.scores[0];
                }
            });
            setRiskMap(map);
        } catch {
            setError('Could not load your patients. Pull down to retry.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user]);

    useEffect(() => { loadData(); }, []);

    const renderPatientCard = ({ item: link }) => {
        const patient = link.patient || {};
        const risk = riskMap[patient.id];
        const tier = risk?.tier;
        const adh = risk?.score;

        const patientAlerts = alertsByPatient[patient.id] || [];
        const hasLowStockAlert = patientAlerts.some(
            (alert) => alert.type === 'low_stock' && !alert.acknowledged_at
        );

        return (
            <View style={styles.patientCard}>
                <View style={styles.patientHeader}>
                    <View style={styles.patientAvatar}>
                        <Text style={styles.patientAvatarText}>
                            {(patient.name || '?')[0].toUpperCase()}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.patientName}>{patient.name || 'Patient'}</Text>
                        <Text style={styles.patientSub}>{patient.city || patient.email || ''}</Text>
                    </View>

                    {hasLowStockAlert && (
                        <View style={styles.lowStockBadge}>
                            <Ionicons name="warning" size={14} color="#fff" />
                        </View>
                    )}

                    {tier ? (
                        <View style={[styles.riskBadge, {
                            backgroundColor: riskBg(tier),
                            borderColor: riskBorder(tier),
                        }]}>
                            <View style={[styles.riskDot, { backgroundColor: riskColour(tier) }]} />
                            <Text style={[styles.riskLabel, { color: riskColour(tier) }]}>
                                {tier.charAt(0).toUpperCase() + tier.slice(1)}
                            </Text>
                        </View>
                    ) : (
                        <View style={[styles.riskBadge, {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                        }]}>
                            <Text style={[styles.riskLabel, { color: theme.colors.textSecondary }]}>
                                No data
                            </Text>
                        </View>
                    )}
                </View>

                {adh !== undefined && (
                    <>
                        <View style={styles.adhRow}>
                            <Text style={styles.adhLabel}>Weekly adherence</Text>
                            <Text style={[styles.adhPct, { color: riskColour(tier) }]}>{adh}%</Text>
                        </View>
                        <View style={styles.adhBarBg}>
                            <View style={[styles.adhBarFill, {
                                width: `${adh}%`,
                                backgroundColor: riskColour(tier),
                            }]} />
                        </View>
                    </>
                )}

                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        style={[styles.viewHistoryBtn, { flex: 1 }]}
                        onPress={() => navigation.navigate('History', {
                            patientId: patient.id,
                            patientName: patient.name,
                        })}
                        accessibilityLabel={`View history for ${patient.name}`}
                    >
                        <Ionicons name="time-outline" size={14} color={theme.colors.primary} />
                        <Text style={styles.viewHistoryText}>View dose history</Text>
                        <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.viewHistoryBtn, { flex: 1 }]}
                        onPress={() => navigation.navigate('CreateMedication', {
                            patientId: patient.id,
                            patientName: patient.name,
                        })}
                        accessibilityLabel={`Create medication for ${patient.name}`}
                    >
                        <Ionicons name="add-circle-outline" size={14} color={theme.colors.primary} />
                        <Text style={styles.viewHistoryText}>Create med</Text>
                        <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <FlatList
            data={patients}
            keyExtractor={(item, i) => item.id || String(i)}
            renderItem={renderPatientCard}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => { setIsRefreshing(true); loadData(true); }}
                    tintColor={theme.colors.primary}
                />
            }
            ListHeaderComponent={
                <View style={styles.headerArea}>

                    <View style={styles.topBar}>
                        <View>
                            <Text style={styles.greeting}>Caregiver view</Text>
                            <Text style={styles.name}>{user?.name || 'there'}</Text>
                        </View>
                        <View style={styles.topActions}>
                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={() => navigation.navigate('Alerts')}
                                accessibilityLabel="View notifications"
                            >
                                <Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={() => navigation.navigate('RequestPatientLink')}
                                accessibilityLabel="Request patient link"
                            >
                                <Ionicons name="link-outline" size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.iconBtnDanger}
                                onPress={clearSession}
                                accessibilityLabel="Log out"
                            >
                                <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.caregiverBanner}>
                        <View style={styles.caregiverBannerIcon}>
                            <Ionicons name="people" size={28} color="#fff" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={styles.caregiverBannerTitle}>Your patients</Text>
                            <Text style={styles.caregiverBannerSub}>
                                {isLoading
                                    ? 'Loading...'
                                    : `${patients.length} linked patient${patients.length !== 1 ? 's' : ''}`}
                            </Text>
                        </View>
                    </View>

                    <DateStrip />

                    {/* Request link card */}
                    <TouchableOpacity
                        style={styles.requestLinkCard}
                        onPress={() => navigation.navigate('RequestPatientLink')}
                        accessibilityLabel="Request a patient link"
                    >
                        <View style={styles.requestLinkLeft}>
                            <View style={styles.requestLinkIcon}>
                                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.requestLinkTitle}>Add a patient</Text>
                                <Text style={styles.requestLinkSub}>Send a link request to a patient</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>

                    {isLoading && (
                        <View style={styles.centreState}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={styles.stateText}>Loading your patients...</Text>
                        </View>
                    )}
                    {!isLoading && error && (
                        <View style={styles.centreState}>
                            <Ionicons name="cloud-offline-outline" size={36} color={theme.colors.textSecondary} />
                            <Text style={styles.stateText}>{error}</Text>
                        </View>
                    )}
                    {!isLoading && !error && patients.length === 0 && (
                        <View style={styles.centreState}>
                            <Ionicons name="people-outline" size={36} color={theme.colors.textSecondary} />
                            <Text style={styles.stateText}>
                                No linked patients yet.{'\n'}Ask a patient to accept your link request.
                            </Text>
                        </View>
                    )}

                    {!isLoading && !error && patients.length > 0 && (
                        <Text style={[styles.sectionTitle, { paddingHorizontal: 0 }]}>
                            Linked patients
                        </Text>
                    )}
                </View>
            }
            ListFooterComponent={<View style={{ height: 60 }} />}
            showsVerticalScrollIndicator={false}
        />
    );
}

export default function HomeScreen({ navigation }) {
    const { user } = useAuthStore();
    const [showBriefing, setShowBriefing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [briefingScript, setBriefingScript] = useState('');

    const isCaregiver = user?.role === 'caregiver';

    useEffect(() => {
        if (!isCaregiver) {
            getMorningBriefingScript(user?.name)
                .then(setBriefingScript)
                .catch(() => { });
        }
    }, []);

    const handlePlayBriefing = async () => {
        setIsSpeaking(true);
        try { await playMorningBriefing(user?.name); }
        finally { setIsSpeaking(false); }
    };

    return (
        <ScreenBackground>
            {isCaregiver ? (
                <CaregiverHome user={user} navigation={navigation} />
            ) : (
                <PatientHome
                    user={user}
                    navigation={navigation}
                    onOpenBriefing={() => setShowBriefing(true)}
                />
            )}

            {!isCaregiver && (
                <Modal
                    visible={showBriefing}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowBriefing(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <View style={styles.modalHandle} />

                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Morning Briefing</Text>
                                <TouchableOpacity
                                    onPress={() => setShowBriefing(false)}
                                    accessibilityLabel="Close briefing"
                                >
                                    <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.briefingText}>{briefingScript}</Text>
                            </ScrollView>

                            <TouchableOpacity
                                style={styles.speakButton}
                                onPress={handlePlayBriefing}
                                disabled={isSpeaking}
                                accessibilityLabel="Read briefing aloud"
                            >
                                <Ionicons
                                    name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
                                    size={20}
                                    color={isSpeaking ? theme.colors.textSecondary : theme.colors.primary}
                                />
                                <Text style={[
                                    styles.speakButtonText,
                                    isSpeaking && { color: theme.colors.textSecondary },
                                ]}>
                                    {isSpeaking ? 'Reading aloud...' : 'Read aloud'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.closeModalButton}
                                onPress={() => setShowBriefing(false)}
                                accessibilityLabel="Close"
                            >
                                <Text style={styles.closeModalText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({

    headerArea: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 56,
        paddingBottom: theme.spacing.sm,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.lg,
    },
    greeting: {
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
    },
    name: {
        fontSize: 24,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
    },
    topActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primaryLight,
        borderWidth: 1,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBtnDanger: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.dangerBg,
        borderWidth: 1,
        borderColor: theme.colors.dangerBorder,
        justifyContent: 'center',
        alignItems: 'center',
    },
    queueBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.colors.warningBg,
        borderWidth: 1,
        borderColor: theme.colors.warningBorder,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: theme.spacing.md,
    },
    queueText: {
        fontSize: 13,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.warning,
        flex: 1,
    },
    briefingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF7ED',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#FED7AA',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 14,
        marginBottom: theme.spacing.lg,
    },
    briefingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    briefingIconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#FFEDD5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    briefingTitle: {
        fontSize: 15,
        fontFamily: 'Nunito_700Bold',
        color: '#9A3412',
    },
    briefingSub: {
        fontSize: 12,
        fontFamily: 'Nunito_400Regular',
        color: '#C2410C',
    },
    briefingChevron: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: theme.colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: 16, fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
    },
    doseCard: {
        flexDirection: 'row',
        marginHorizontal: theme.spacing.lg,
        marginBottom: 10,
    },
    doseTimeCol: {
        width: 50,
        alignItems: 'center',
        paddingTop: 6,
    },
    doseTimeText: {
        fontSize: 11,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    doseTimeLine: {
        width: 2,
        flex: 1,
        borderRadius: 1,
        minHeight: 30,
    },
    doseCardBody: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderLeftWidth: 4,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    pillDecor: {
        position: 'absolute',
        top: 8,
        right: 10,
        opacity: 0.2,
    },
    doseCardContent: {
        flex: 1,
    },
    doseName: {
        fontSize: 15,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
        marginBottom: 2,
    },
    doseMeta: {
        fontSize: 12,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusPillText: {
        fontSize: 12,
        fontFamily: 'Nunito_700Bold',
    },
    linkCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        padding: 12,
        marginBottom: 8,
        gap: 10,
    },
    linkAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    linkAvatarText: {
        fontSize: 18,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.primary,
    },
    linkName: {
        fontSize: 14,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
    },
    linkSub: {
        fontSize: 12,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
    },
    linkReject: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    linkApprove: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: theme.colors.primary,
        borderRadius: 20,
    },
    linkApproveText: {
        fontSize: 13,
        fontFamily: 'Nunito_700Bold',
        color: '#fff',
    },
    centreState: {
        paddingVertical: 40,
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: theme.spacing.lg,
    },
    stateText: {
        fontSize: 15,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    caregiverBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        borderRadius: 20,
        padding: 20,
        marginBottom: theme.spacing.lg,
    },
    caregiverBannerIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    caregiverBannerTitle: {
        fontSize: 20,
        fontFamily: 'Nunito_700Bold',
        color: '#fff',
        marginBottom: 2,
    },
    caregiverBannerSub: {
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        color: 'rgba(255,255,255,0.75)',
    },

    requestLinkCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    requestLinkLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        flex: 1,
    },
    requestLinkIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    requestLinkTitle: {
        fontSize: 15,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
    },
    requestLinkSub: {
        fontSize: 12,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
    },

    patientCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        padding: 16,
        marginHorizontal: theme.spacing.lg,
        marginBottom: 12,
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    patientHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    patientAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: theme.colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    patientAvatarText: {
        fontSize: 20,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.primary,
    },
    patientName: {
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
    },
    patientSub: {
        fontSize: 12,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
    },

    riskBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    riskDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    riskLabel: {
        fontSize: 12,
        fontFamily: 'Nunito_700Bold',
    },

    lowStockBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.warning,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },

    adhRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    adhLabel: {
        fontSize: 12,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
    },
    adhPct: {
        fontSize: 12,
        fontFamily: 'Nunito_700Bold',
    },
    adhBarBg: {
        height: 6,
        backgroundColor: theme.colors.border,
        borderRadius: 3,
        marginBottom: 12,
    },
    adhBarFill: {
        height: 6,
        borderRadius: 3,
    },
    viewHistoryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: 10,
        marginTop: 4,
    },
    viewHistoryText: {
        fontSize: 13,
        fontFamily: 'Nunito_600SemiBold',
        color: theme.colors.primary,
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(30,16,51,0.5)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: theme.spacing.lg,
        maxHeight: '75%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.border,
        alignSelf: 'center',
        marginBottom: theme.spacing.md,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
    },
    briefingText: {
        fontSize: 16,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textPrimary,
        lineHeight: 28,
        paddingBottom: 16,
    },
    speakButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderRadius: 50,
        paddingVertical: 10,
        marginBottom: 8,
    },
    speakButtonText: {
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
        color: theme.colors.primary,
    },
    closeModalButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 50,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    closeModalText: {
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: '#fff',
    },
});