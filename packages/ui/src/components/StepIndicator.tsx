import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { AppText } from './AppText';

export interface Step {
  id: number;
  label: string;
}

export interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  style?: ViewStyle;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  style,
}) => {
  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Étape ${currentStep} sur ${steps.length} : ${steps[currentStep - 1]?.label || ''}`}
    >
      <View style={styles.stepsRow}>
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <React.Fragment key={step.id}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
                    isCompleted && styles.circleCompleted,
                    isCurrent && styles.circleCurrent,
                  ]}
                >
                  <AppText
                    variant="caption"
                    color={
                      isCompleted || isCurrent
                        ? colors.textOnPrimary
                        : colors.textSecondary
                    }
                    style={styles.stepNumber}
                  >
                    {isCompleted ? '✓' : step.id}
                  </AppText>
                </View>
                <AppText
                  variant="caption"
                  color={isCurrent ? colors.primaryDeep : colors.textMuted}
                  style={[styles.stepLabel, isCurrent && styles.labelCurrent]}
                  numberOfLines={1}
                >
                  {step.label}
                </AppText>
              </View>
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.line,
                    isCompleted && styles.lineCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    width: 68,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  circleCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  circleCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumber: {
    fontWeight: '700',
    fontSize: 12,
  },
  stepLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  labelCurrent: {
    fontWeight: '700',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginBottom: 16,
    marginHorizontal: 4,
  },
  lineCompleted: {
    backgroundColor: colors.success,
  },
});
