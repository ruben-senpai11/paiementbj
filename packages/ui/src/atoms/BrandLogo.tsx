import React, { useState } from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import Svg, { Path, Rect, G } from 'react-native-svg';
import { BRAND_ASSETS } from '../tokens/brand-logos';
import { colors } from '../tokens/colors';
import { AppText } from './AppText';

// Ressources statiques intégrées localement pour Android, iOS et Web (Zéro chargement distant)
const BUNDLED_RASTER_LOGOS: Record<string, ImageSourcePropType> = {
  mtn: require('../../assets/brands/mtn/mtn-logo.png'),
  mtnMoMo: require('../../assets/brands/mtn-momo/mtn-momo-logo.png'),
  moov: require('../../assets/brands/moov-africa/moov-africa-logo.png'),
  moovMoney: require('../../assets/brands/moov-money/moov-money-logo.png'),
  celtiis: require('../../assets/brands/celtiis/celtiis-logo.png'),
  celtiisCash: require('../../assets/brands/celtiis-cash/celtiis-cash-logo.png'),
  sbee: require('../../assets/brands/sbee/sbee-logo.webp'),
  soneb: require('../../assets/brands/soneb/soneb-logo.png'),
  canal: require('../../assets/brands/canal-plus/canal-plus-logo.png'),
  tresor: require('../../assets/brands/tresor/tresor-logo.jpg'),
  anip: require('../../assets/brands/anip/anip-logo.png'),
};

export interface BrandLogoProps {
  brandKey: string;
  size?: number;
  style?: ViewStyle;
}

const VisaVectorLogo: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <Svg width={width} height={height} viewBox="0 0 1000 324.68">
    <Path
      fill="#1434cb"
      d="m651.19.5c-70.93,0-134.32,36.77-134.32,104.69,0,77.9,112.42,83.28,112.42,122.42,0,16.48-18.88,31.23-51.14,31.23-45.77,0-79.98-20.61-79.98-20.61l-14.64,68.55s39.41,17.41,91.73,17.41c77.55,0,138.58-38.57,138.58-107.66,0-82.32-112.89-87.54-112.89-123.86,0-12.91,15.5-27.05,47.66-27.05,36.29,0,65.89,14.99,65.89,14.99l14.33-66.2S696.61.5,651.18.5h0ZM2.22,5.5L.5,15.49s29.84,5.46,56.72,16.36c34.61,12.49,37.07,19.77,42.9,42.35l63.51,244.83h85.14L379.93,5.5h-84.94l-84.28,213.17-34.39-180.7c-3.15-20.68-19.13-32.48-38.68-32.48,0,0-135.41,0-135.41,0Zm411.87,0l-66.63,313.53h81L494.85,5.5h-80.76Zm451.76,0c-19.53,0-29.88,10.46-37.47,28.73l-118.67,284.8h84.94l16.43-47.47h103.48l9.99,47.47h74.95L934.12,5.5h-68.27Zm11.05,84.71l25.18,117.65h-67.45l42.28-117.65h0Z"
    />
  </Svg>
);

const MastercardVectorLogo: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <Svg width={width} height={height} viewBox="0 0 999.2 776">
    <Path
      fill="#121212"
      d="M181.1,774.3v-51.5c0-19.7-12-32.6-32.6-32.6c-10.3,0-21.5,3.4-29.2,14.6c-6-9.4-14.6-14.6-27.5-14.6c-8.6,0-17.2,2.6-24,12v-10.3h-18v82.4h18v-45.5c0-14.6,7.7-21.5,19.7-21.5s18,7.7,18,21.5v45.5h18v-45.5c0-14.6,8.6-21.5,19.7-21.5c12,0,18,7.7,18,21.5v45.5H181.1z M448.1,691.9h-29.2V667h-18v24.9h-16.3v16.3h16.3v37.8c0,18.9,7.7,30,28.3,30c7.7,0,16.3-2.6,22.3-6l-5.2-15.5c-5.2,3.4-11.2,4.3-15.5,4.3c-8.6,0-12-5.2-12-13.7v-36.9h29.2V691.9z M600.9,690.1c-10.3,0-17.2,5.2-21.5,12v-10.3h-18v82.4h18v-46.4c0-13.7,6-21.5,17.2-21.5c3.4,0,7.7,0.9,11.2,1.7l5.2-17.2C609.4,690.1,604.3,690.1,600.9,690.1L600.9,690.1z M370,698.7c-8.6-6-20.6-8.6-33.5-8.6c-20.6,0-34.3,10.3-34.3,26.6c0,13.7,10.3,21.5,28.3,24l8.6,0.9c9.4,1.7,14.6,4.3,14.6,8.6c0,6-6.9,10.3-18.9,10.3c-12,0-21.5-4.3-27.5-8.6l-8.6,13.7c9.4,6.9,22.3,10.3,35.2,10.3c24,0,37.8-11.2,37.8-26.6c0-14.6-11.2-22.3-28.3-24.9l-8.6-0.9c-7.7-0.9-13.7-2.6-13.7-7.7c0-6,6-9.4,15.5-9.4c10.3,0,20.6,4.3,25.8,6.9L370,698.7L370,698.7z M848.9,690.1c-10.3,0-17.2,5.2-21.5,12v-10.3h-18v82.4h18v-46.4c0-13.7,6-21.5,17.2-21.5c3.4,0,7.7,0.9,11.2,1.7L861,691C857.5,690.1,852.4,690.1,848.9,690.1L848.9,690.1z M618.9,733.1c0,24.9,17.2,42.9,43.8,42.9c12,0,20.6-2.6,29.2-9.4l-8.6-14.6c-6.9,5.2-13.7,7.7-21.5,7.7c-14.6,0-24.9-10.3-24.9-26.6c0-15.5,10.3-25.8,24.9-26.6c7.7,0,14.6,2.6,21.5,7.7l8.6-14.6c-8.6-6.9-17.2-9.4-29.2-9.4C636.1,690.1,618.9,708.2,618.9,733.1L618.9,733.1L618.9,733.1z M785.4,733.1v-41.2h-18v10.3c-6-7.7-14.6-12-25.8-12c-23.2,0-41.2,18-41.2,42.9c0,24.9,18,42.9,41.2,42.9c12,0,20.6-4.3,25.8-12v10.3h18V733.1L785.4,733.1z M719.3,733.1c0-14.6,9.4-26.6,24.9-26.6c14.6,0,24.9,11.2,24.9,26.6c0,14.6-10.3,26.6-24.9,26.6C728.8,758.8,719.3,747.6,719.3,733.1L719.3,733.1z M503.9,690.1c-24,0-41.2,17.2-41.2,42.9c0,25.8,17.2,42.9,42.1,42.9c12,0,24-3.4,33.5-11.2l-8.6-12.9c-6.9,5.2-15.5,8.6-24,8.6c-11.2,0-22.3-5.2-24.9-19.7h60.9c0-2.6,0-4.3,0-6.9C542.5,707.3,527,690.1,503.9,690.1L503.9,690.1L503.9,690.1z M503.9,705.6c11.2,0,18.9,6.9,20.6,19.7h-42.9C483.3,714.2,491,705.6,503.9,705.6L503.9,705.6z M951.1,733.1v-73.8h-18v42.9c-6-7.7-14.6-12-25.8-12c-23.2,0-41.2,18-41.2,42.9c0,24.9,18,42.9,41.2,42.9c12,0,20.6-4.3,25.8-12v10.3h18V733.1L951.1,733.1z M885,733.1c0-14.6,9.4-26.6,24.9-26.6c14.6,0,24.9,11.2,24.9,26.6c0,14.6-10.3,26.6-24.9,26.6C894.4,758.8,885,747.6,885,733.1L885,733.1z M282.4,733.1v-41.2h-18v10.3c-6-7.7-14.6-12-25.8-12c-23.2,0-41.2,18-41.2,42.9c0,24.9,18,42.9,41.2,42.9c12,0,20.6-4.3,25.8-12v10.3h18V733.1L282.4,733.1z M215.5,733.1c0-14.6,9.4-26.6,24.9-26.6c14.6,0,24.9,11.2,24.9,26.6c0,14.6-10.3,26.6-24.9,26.6C224.9,758.8,215.5,747.6,215.5,733.1z"
    />
    <G>
      <Rect x="364" y="66.1" fill="#FF5A00" width="270.4" height="485.8" />
      <Path
        fill="#EB001B"
        d="M382,309c0-98.7,46.4-186.3,117.6-242.9C447.2,24.9,381.1,0,309,0C138.2,0,0,138.2,0,309s138.2,309,309,309c72.1,0,138.2-24.9,190.6-66.1C428.3,496.1,382,407.7,382,309z"
      />
      <Path
        fill="#F79E1B"
        d="M999.2,309c0,170.8-138.2,309-309,309c-72.1,0-138.2-24.9-190.6-66.1c72.1-56.7,117.6-144.2,117.6-242.9S570.8,122.7,499.6,66.1C551.9,24.9,618,0,690.1,0C861,0,999.2,139.1,999.2,309z"
      />
    </G>
  </Svg>
);

export const BrandLogo: React.FC<BrandLogoProps> = ({
  brandKey,
  size = 48,
  style,
}) => {
  const asset = BRAND_ASSETS[brandKey];
  const [failedBrandKey, setFailedBrandKey] = useState<string | null>(null);
  const hasError = failedBrandKey === brandKey;

  if (!asset) {
    return (
      <View
        style={[
          styles.container,
          { width: size, height: size, borderRadius: size / 4 },
          style,
        ]}
      >
        <AppText variant="caption" color={colors.text} style={styles.fallback}>
          {brandKey.slice(0, 3).toUpperCase()}
        </AppText>
      </View>
    );
  }

  const innerSize = Math.round(size * 0.76);
  const bundledSource = BUNDLED_RASTER_LOGOS[brandKey];

  const showVectorVisa = brandKey === 'visa';
  const showVectorMastercard = brandKey === 'mastercard';
  const showRaster = Boolean(bundledSource) && !hasError;
  const effectiveBg =
    showVectorVisa || showVectorMastercard || showRaster ? asset.backgroundColor : colors.surface;

  return (
    <View
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={asset.altText}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 4,
          backgroundColor: effectiveBg,
        },
        style,
      ]}
    >
      {showVectorVisa ? (
        <VisaVectorLogo width={innerSize} height={Math.round(innerSize * 0.34)} />
      ) : showVectorMastercard ? (
        <MastercardVectorLogo width={innerSize} height={Math.round(innerSize * 0.78)} />
      ) : showRaster && bundledSource ? (
        <Image
          source={bundledSource}
          onError={() => setFailedBrandKey(brandKey)}
          style={{ width: innerSize, height: innerSize }}
          resizeMode="contain"
        />
      ) : (
        <AppText variant="caption" color={colors.text} style={styles.fallback}>
          {asset.fallbackText}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fallback: {
    fontWeight: '700',
    fontSize: 11,
  },
});
