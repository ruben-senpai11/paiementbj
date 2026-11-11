import React, { createContext, useContext } from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { typography } from '../tokens/typography';

export interface AccessibilityPreferences {
  largeFont: boolean;
  reducedMotion: boolean;
}

const AccessibilityPreferencesContext = createContext<AccessibilityPreferences>({
  largeFont: false,
  reducedMotion: false,
});

export const AccessibilityPreferencesProvider: React.FC<{
  value: AccessibilityPreferences;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <AccessibilityPreferencesContext.Provider value={value}>
    {children}
  </AccessibilityPreferencesContext.Provider>
);

export const useAccessibilityPreferences = () => useContext(AccessibilityPreferencesContext);

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bodyLarge'
  | 'body'
  | 'bodyMedium'
  | 'bodySmall'
  | 'caption'
  | 'amount';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color = colors.text,
  align = 'left',
  style,
  children,
  ...rest
}) => {
  const { largeFont } = useAccessibilityPreferences();

  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'h1':
        return typography.sizes.h1;
      case 'h2':
        return typography.sizes.h2;
      case 'h3':
        return typography.sizes.h3;
      case 'bodyLarge':
        return typography.sizes.bodyLarge;
      case 'bodyMedium':
        return typography.sizes.bodyMedium;
      case 'bodySmall':
        return typography.sizes.bodySmall;
      case 'caption':
        return typography.sizes.caption;
      case 'amount':
        return typography.sizes.amountDisplay;
      case 'body':
      default:
        return typography.sizes.body;
    }
  };

  const baseStyle = getVariantStyle();
  const scaledStyle: TextStyle =
    largeFont && typeof baseStyle.fontSize === 'number'
      ? {
          ...baseStyle,
          fontSize: Math.round(baseStyle.fontSize * 1.18),
          lineHeight:
            typeof baseStyle.lineHeight === 'number'
              ? Math.round(baseStyle.lineHeight * 1.18)
              : undefined,
        }
      : baseStyle;

  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={2.0} // Permet le zoom de texte sans casser le layout (WCAG 1.4.4 Resize text)
      style={[
        scaledStyle,
        { color, textAlign: align },
        style,
      ]}
    >
      {children}
    </Text>
  );
};
