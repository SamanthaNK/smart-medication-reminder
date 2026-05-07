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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { theme } from '../utils/theme';
import { createMedication } from '../api/api';

const PILL_COLOURS = [
    'white', 'yellow', 'orange', 'pink', 'red',
    'blue', 'green', 'purple', 'brown', 'grey',
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

const PILL_SHAPES = ['round', 'oval', 'square', 'capsule', 'diamond'];

const DOSE_UNITS = [
    { label: 'mg', value: 'mg' },
    { label: 'g', value: 'g' },
    { label: 'ml', value: 'ml' },
    { label: 'µg', value: 'mcg' },
    { label: 'IU', value: 'IU' },
];

export default function CreateMedicationScreen({ navigation, route }) {
    const { patientId, patientName } = route.params || {};

    const [name, setName] = useState('');
    const [doseAmount, setDoseAmount] = useState('');
    const [doseUnit, setDoseUnit] = useState('mg');
    const [showUnitPicker, setShowUnitPicker] = useState(false);
    const [pillColour, setPillColour] = useState('white');
    const [pillShape, setPillShape] = useState('round');
    const [pillNotes, setPillNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = 'Medication name is required';
        }

        if (!doseAmount.trim()) {
            newErrors.doseAmount = 'Dose amount is required';
        } else if (isNaN(parseFloat(doseAmount))) {
            newErrors.doseAmount = 'Dose amount must be a number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreate = async () => {
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            await createMedication(patientId, {
                name: name.trim(),
                dose_amount: parseFloat(doseAmount),
                dose_unit: doseUnit,
                pill_colour: pillColour,
                pill_shape: pillShape,
                pill_notes: pillNotes.trim() || null,
            });

            Alert.alert('Success', `Medication "${name}" created for ${patientName}`);
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', err.message || 'Failed to create medication. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScreenBackground>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Back button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.headerSection}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="pill" size={32} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.heading}>Add Medication</Text>
                    <Text style={styles.subtitle}>for {patientName}</Text>
                </View>

                {/* Form card */}
                <View style={styles.formCard}>
                    {/* Medication name */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Medication Name *</Text>
                        <TextInput
                            style={[styles.input, errors.name && styles.inputError]}
                            placeholder="e.g., Aspirin, Vitamin D"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={name}
                            onChangeText={(text) => {
                                setName(text);
                                if (errors.name) {
                                    setErrors({ ...errors, name: null });
                                }
                            }}
                            editable={!isLoading}
                        />
                        {errors.name && (
                            <Text style={styles.errorMsg}>{errors.name}</Text>
                        )}
                    </View>

                    {/* Dose */}
                    <View style={styles.doseRow}>
                        <View style={styles.doseAmountSection}>
                            <Text style={styles.label}>Dose Amount *</Text>
                            <TextInput
                                style={[styles.input, errors.doseAmount && styles.inputError]}
                                placeholder="e.g., 500"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={doseAmount}
                                onChangeText={(text) => {
                                    setDoseAmount(text);
                                    if (errors.doseAmount) {
                                        setErrors({ ...errors, doseAmount: null });
                                    }
                                }}
                                keyboardType="decimal-pad"
                                editable={!isLoading}
                            />
                            {errors.doseAmount && (
                                <Text style={styles.errorMsg}>{errors.doseAmount}</Text>
                            )}
                        </View>

                        <View style={styles.doseUnitSection}>
                            <Text style={styles.label}>Unit</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={doseUnit}
                                    onValueChange={setDoseUnit}
                                    enabled={!isLoading}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="mg" value="mg" />
                                    <Picker.Item label="g" value="g" />
                                    <Picker.Item label="ml" value="ml" />
                                    <Picker.Item label="µg" value="mcg" />
                                    <Picker.Item label="IU" value="IU" />
                                </Picker>
                            </View>
                        </View>
                    </View>

                    {/* Pill colour */}
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
                                    accessibilityLabel={`Select ${colour}`}
                                >
                                    {pillColour === colour && (
                                        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Pill shape */}
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
                                    accessibilityLabel={`Select ${shape} shape`}
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

                    {/* Notes */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Additional Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="e.g., Take with food, avoid dairy..."
                            placeholderTextColor={theme.colors.textSecondary}
                            value={pillNotes}
                            onChangeText={setPillNotes}
                            multiline
                            numberOfLines={3}
                            editable={!isLoading}
                        />
                    </View>
                </View>

                {/* Action buttons */}
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
    doseAmountSection: {
        flex: 2,
    },
    doseUnitSection: {
        flex: 1,
    },
    pickerContainer: {
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.input,
        backgroundColor: theme.colors.background,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
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
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    shapeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    shapeButton: {
        flex: 1,
        minWidth: '48%',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.radius.input,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
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
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
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
});
