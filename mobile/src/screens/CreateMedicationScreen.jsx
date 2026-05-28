import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';
import { createMedication } from '../api/api';
import { CAMEROONIAN_MEDICATIONS } from '../utils/constants';

const PILL_COLOURS = [
    'white', 'yellow', 'orange', 'pink',
    'red', 'blue', 'green', 'purple', 'brown', 'grey',
];

const PILL_COLOUR_MAP = {
    white: '#FFFFFF',
    yellow: '#FDE68A',
    orange: '#FDBA74',
    pink: '#F9A8D4',
    red: '#FCA5A5',
    blue: '#93C5FD',
    green: '#6EE7B7',
    purple: '#C4B5FD',
    brown: '#D4A574',
    grey: '#D1D5DB',
};

const PILL_SHAPES = ['round', 'oval', 'capsule', 'tablet'];

const DOSE_UNITS = ['mg', 'g', 'ml', 'mcg', 'IU'];

const FREQUENCIES = [
    { value: 'once', label: 'Once daily' },
    { value: 'twice', label: 'Twice daily' },
    { value: 'thrice', label: 'Three times daily' },
    { value: 'custom', label: 'Custom / As needed' },
];

export default function CreateMedicationScreen({ navigation, route }) {
    const { patientId, patientName } = route.params || {};

    const [name, setName] = useState('');
    const [doseAmount, setDoseAmount] = useState('');
    const [doseUnit, setDoseUnit] = useState('mg');
    const [frequency, setFrequency] = useState('once');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [timesOfDay, setTimesOfDay] = useState(['08:00']);
    const [newTime, setNewTime] = useState('');
    const [pillColour, setPillColour] = useState('white');
    const [pillShape, setPillShape] = useState('round');
    const [pillNotes, setPillNotes] = useState('');

    const [showUnitPicker, setShowUnitPicker] = useState(false);
    const [showFreqPicker, setShowFreqPicker] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [nameSuggestions, setNameSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const frequencyLabel = FREQUENCIES.find((f) => f.value === frequency)?.label || frequency;

    const handleNameChange = (value) => {
        setName(value);
        setErrors((p) => ({ ...p, name: null }));

        if (value.trim().length < 2) {
            setNameSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const filtered = CAMEROONIAN_MEDICATIONS.filter((med) =>
            med.toLowerCase().includes(value.toLowerCase().trim())
        ).slice(0, 6);

        setNameSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
    };

    const handleSelectSuggestion = (suggestion) => {
        setName(suggestion);
        setNameSuggestions([]);
        setShowSuggestions(false);
        setErrors((p) => ({ ...p, name: null }));
    };

    const validateForm = () => {
        const e = {};
        if (!name.trim()) e.name = 'Medication name is required';
        if (!doseAmount.trim()) e.doseAmount = 'Dose amount is required';
        else if (isNaN(parseFloat(doseAmount))) e.doseAmount = 'Must be a number';
        if (timesOfDay.length === 0) e.times = 'Add at least one time';
        if (!startDate.match(/^\d{4}-\d{2}-\d{2}$/)) e.startDate = 'Date must be YYYY-MM-DD';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const addTime = () => {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(newTime)) {
            setErrors((prev) => ({ ...prev, times: 'Format must be HH:MM (e.g. 08:00)' }));
            return;
        }
        if (timesOfDay.includes(newTime)) {
            setErrors((prev) => ({ ...prev, times: 'This time is already added' }));
            return;
        }
        setTimesOfDay((prev) => [...prev, newTime].sort());
        setNewTime('');
        setErrors((prev) => ({ ...prev, times: null }));
    };

    const removeTime = (t) => setTimesOfDay((prev) => prev.filter((x) => x !== t));

    const handleCreate = async () => {
        if (!validateForm()) return;
        setIsLoading(true);
        try {
            await createMedication(patientId, {
                name: name.trim(),
                dose_amount: parseFloat(doseAmount),
                dose_unit: doseUnit,
                frequency,
                times_of_day: timesOfDay,
                start_date: startDate,
                pill_colour: pillColour,
                pill_shape: pillShape,
                pill_notes: pillNotes.trim() || null,
            });
            Alert.alert('Success', `Medication "${name}" added for ${patientName}.`);
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', err.message || 'Failed to create medication.');
        } finally {
            setIsLoading(false);
        }
    };

    const PickerModal = ({ visible, onClose, options, selected, onSelect, title }) => (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalSheet}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <FlatList
                        data={options}
                        keyExtractor={(item) => (typeof item === 'string' ? item : item.value)}
                        renderItem={({ item }) => {
                            const itemValue = typeof item === 'string' ? item : item.value;
                            const itemLabel = typeof item === 'string' ? item : item.label;
                            const isSelected = selected === itemValue;
                            return (
                                <TouchableOpacity
                                    style={[styles.optionRow, isSelected && styles.optionRowActive]}
                                    onPress={() => { onSelect(itemValue); onClose(); }}
                                >
                                    <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                                        {itemLabel}
                                    </Text>
                                    {isSelected && (
                                        <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />
                    <TouchableOpacity style={styles.modalClose} onPress={onClose}>
                        <Text style={styles.modalCloseText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <ScreenBackground>
            <PickerModal
                visible={showUnitPicker}
                onClose={() => setShowUnitPicker(false)}
                options={DOSE_UNITS}
                selected={doseUnit}
                onSelect={setDoseUnit}
                title="Select Unit"
            />

            <PickerModal
                visible={showFreqPicker}
                onClose={() => setShowFreqPicker(false)}
                options={FREQUENCIES}
                selected={frequency}
                onSelect={setFrequency}
                title="Select Frequency"
            />

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.headerSection}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="medkit-outline" size={32} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.heading}>Add Medication</Text>
                    <Text style={styles.subtitle}>for {patientName}</Text>
                </View>

                <View style={styles.formCard}>

                    <View style={styles.section}>
                        <Text style={styles.label}>Medication Name *</Text>
                        <TextInput
                            style={[styles.input, errors.name && styles.inputError]}
                            placeholder="e.g. Paracetamol"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={name}
                            onChangeText={handleNameChange}
                            editable={!isLoading}
                            accessibilityLabel="Medication name"
                            autoCorrect={false}
                        />
                        {errors.name && <Text style={styles.errorMsg}>{errors.name}</Text>}

                        {showSuggestions && (
                            <View style={styles.suggestionsContainer}>
                                {nameSuggestions.map((suggestion) => (
                                    <TouchableOpacity
                                        key={suggestion}
                                        style={styles.suggestionRow}
                                        onPress={() => handleSelectSuggestion(suggestion)}
                                        accessibilityLabel={`Select ${suggestion}`}
                                    >
                                        <Ionicons
                                            name="medical-outline"
                                            size={14}
                                            color={theme.colors.textSecondary}
                                            style={{ marginRight: 8 }}
                                        />
                                        <Text style={styles.suggestionText}>{suggestion}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={styles.doseRow}>
                        <View style={{ flex: 2 }}>
                            <Text style={styles.label}>Dose Amount *</Text>
                            <TextInput
                                style={[styles.input, errors.doseAmount && styles.inputError]}
                                placeholder="e.g. 500"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={doseAmount}
                                onChangeText={(v) => { setDoseAmount(v); setErrors((p) => ({ ...p, doseAmount: null })); }}
                                keyboardType="decimal-pad"
                                editable={!isLoading}
                                accessibilityLabel="Dose amount"
                            />
                            {errors.doseAmount && <Text style={styles.errorMsg}>{errors.doseAmount}</Text>}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Unit</Text>
                            <TouchableOpacity
                                style={styles.pickerButton}
                                onPress={() => setShowUnitPicker(true)}
                                accessibilityLabel="Select dose unit"
                            >
                                <Text style={styles.pickerButtonText}>{doseUnit}</Text>
                                <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Frequency *</Text>
                        <TouchableOpacity
                            style={styles.pickerButton}
                            onPress={() => setShowFreqPicker(true)}
                            accessibilityLabel="Select frequency"
                        >
                            <Text style={styles.pickerButtonText}>{frequencyLabel}</Text>
                            <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Start Date * (YYYY-MM-DD)</Text>
                        <TextInput
                            style={[styles.input, errors.startDate && styles.inputError]}
                            placeholder="e.g. 2026-05-27"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={startDate}
                            onChangeText={(v) => { setStartDate(v); setErrors((p) => ({ ...p, startDate: null })); }}
                            editable={!isLoading}
                            accessibilityLabel="Start date"
                        />
                        {errors.startDate && <Text style={styles.errorMsg}>{errors.startDate}</Text>}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Times of Day *</Text>
                        <View style={styles.timeInputRow}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="HH:MM e.g. 08:00"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={newTime}
                                onChangeText={setNewTime}
                                keyboardType="numbers-and-punctuation"
                                editable={!isLoading}
                                accessibilityLabel="Add time of day"
                            />
                            <TouchableOpacity
                                style={styles.addTimeButton}
                                onPress={addTime}
                                accessibilityLabel="Add this time"
                            >
                                <Ionicons name="add" size={22} color={theme.colors.textOnPrimary} />
                            </TouchableOpacity>
                        </View>
                        {errors.times && <Text style={styles.errorMsg}>{errors.times}</Text>}
                        <View style={styles.timeTagsRow}>
                            {timesOfDay.map((t) => (
                                <View key={t} style={styles.timeTag}>
                                    <Text style={styles.timeTagText}>{t}</Text>
                                    <TouchableOpacity
                                        onPress={() => removeTime(t)}
                                        accessibilityLabel={`Remove time ${t}`}
                                    >
                                        <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Pill Colour</Text>
                        <View style={styles.colourGrid}>
                            {PILL_COLOURS.map((colour) => (
                                <TouchableOpacity
                                    key={colour}
                                    style={[
                                        styles.colourButton,
                                        { backgroundColor: PILL_COLOUR_MAP[colour] },
                                        pillColour === colour && styles.colourButtonSelected,
                                    ]}
                                    onPress={() => setPillColour(colour)}
                                    disabled={isLoading}
                                    accessibilityLabel={`Colour ${colour}`}
                                >
                                    {pillColour === colour && (
                                        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Pill Shape</Text>
                        <View style={styles.shapeGrid}>
                            {PILL_SHAPES.map((shape) => (
                                <TouchableOpacity
                                    key={shape}
                                    style={[
                                        styles.shapeButton,
                                        pillShape === shape && styles.shapeButtonSelected,
                                    ]}
                                    onPress={() => setPillShape(shape)}
                                    disabled={isLoading}
                                    accessibilityLabel={`Shape ${shape}`}
                                >
                                    <Text style={[
                                        styles.shapeButtonText,
                                        pillShape === shape && styles.shapeButtonTextSelected,
                                    ]}>
                                        {shape.charAt(0).toUpperCase() + shape.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>Notes (optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="e.g. Take with food"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={pillNotes}
                            onChangeText={setPillNotes}
                            multiline
                            numberOfLines={3}
                            editable={!isLoading}
                            accessibilityLabel="Pill notes"
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.createButton, isLoading && styles.buttonDisabled]}
                    onPress={handleCreate}
                    disabled={isLoading}
                    accessibilityLabel="Create medication"
                >
                    {isLoading ? (
                        <ActivityIndicator color={theme.colors.textOnPrimary} />
                    ) : (
                        <>
                            <Ionicons name="add-circle" size={20} color={theme.colors.textOnPrimary} />
                            <Text style={styles.createButtonText}>Create Medication</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                    disabled={isLoading}
                    accessibilityLabel="Cancel"
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </ScrollView>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: 56,
        paddingBottom: theme.spacing.xxl,
    },
    backButton: {
        marginBottom: theme.spacing.lg,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    headerIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    heading: {
        fontSize: 24,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textSecondary,
    },
    formCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.card,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
    },
    input: {
        fontSize: 16,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textPrimary,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.input,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.background,
    },
    inputError: {
        borderColor: theme.colors.danger,
        backgroundColor: theme.colors.dangerBg,
    },
    errorMsg: {
        fontSize: 12,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.danger,
        marginTop: theme.spacing.xs,
    },
    textArea: {
        paddingVertical: theme.spacing.md,
        textAlignVertical: 'top',
    },
    doseRow: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.input,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 14,
        backgroundColor: theme.colors.background,
    },
    pickerButtonText: {
        fontSize: 16,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textPrimary,
    },
    timeInputRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    addTimeButton: {
        width: 50,
        height: 50,
        borderRadius: theme.radius.input,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeTagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    timeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.primaryLight,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    timeTagText: {
        fontSize: 14,
        fontFamily: 'Nunito_600SemiBold',
        color: theme.colors.primary,
    },
    colourGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
    },
    colourButton: {
        width: '30%',
        height: 50,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    colourButtonSelected: {
        borderColor: theme.colors.primary,
    },
    shapeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    shapeButton: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.radius.input,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '30%',
    },
    shapeButtonSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryLight,
    },
    shapeButtonText: {
        fontSize: 12,
        fontFamily: 'Nunito_600SemiBold',
        color: theme.colors.textSecondary,
    },
    shapeButtonTextSelected: {
        color: theme.colors.primary,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.button,
        paddingVertical: theme.spacing.lg,
        minHeight: 56,
        elevation: 4,
        marginBottom: theme.spacing.md,
    },
    createButtonText: {
        fontSize: 16,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textOnPrimary,
    },
    cancelButton: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.button,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        paddingVertical: theme.spacing.lg,
        minHeight: 56,
    },
    cancelButtonText: {
        fontSize: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: theme.colors.textSecondary,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: theme.spacing.lg,
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'Nunito_700Bold',
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    optionRowActive: {
        backgroundColor: theme.colors.primaryLight,
        borderRadius: 8,
        paddingHorizontal: 8,
    },
    optionText: {
        fontSize: 16,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textPrimary,
    },
    optionTextActive: {
        color: theme.colors.primary,
        fontFamily: 'Nunito_600SemiBold',
    },
    modalClose: {
        marginTop: theme.spacing.md,
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
    },
    modalCloseText: {
        fontSize: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: theme.colors.danger,
    },
    suggestionsContainer: {
        marginTop: theme.spacing.sm,
        borderRadius: theme.radius.input,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        overflow: 'hidden',
        maxHeight: 240,
    },
    suggestionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    suggestionText: {
        fontSize: 14,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textPrimary,
        flex: 1,
    },
    suggestionsContainer: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.input,
        marginTop: 4,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    suggestionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    suggestionText: {
        fontSize: 15,
        fontFamily: 'Nunito_400Regular',
        color: theme.colors.textPrimary,
    },
});