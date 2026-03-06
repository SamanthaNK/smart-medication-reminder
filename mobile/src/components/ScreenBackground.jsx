import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, Pattern, Rect, Circle } from 'react-native-svg';
import { theme } from '../utils/theme';

const { width, height } = Dimensions.get('window');

const DotGrid = () => (
    <Svg
        width={width}
        height={height}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
    >
        <Defs>
            <Pattern
                id="dots"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
            >
                <Circle cx="1.5" cy="1.5" r="1.5" fill="#E9E0F8" opacity="0.7" />
            </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#dots)" />
    </Svg>
);

export default function ScreenBackground({ children, style }) {
    return (
        <View style={[styles.container, style]}>
            <DotGrid />
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
});