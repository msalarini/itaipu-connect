import React from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    ViewProps,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ScreenContainerProps extends ViewProps {
    children: React.ReactNode;
    scrollable?: boolean;
    safeArea?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
    children,
    scrollable = false,
    safeArea = true,
    style,
    ...props
}) => {
    const { colors, theme } = useTheme();
    const Container = safeArea ? SafeAreaView : View;
    const Content = scrollable ? ScrollView : View;

    return (
        <>
            <StatusBar
                barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />
            <Container style={[styles.container, { backgroundColor: colors.background }, style]} {...props}>
                <Content
                    style={styles.content}
                    contentContainerStyle={scrollable ? styles.scrollContent : undefined}
                    showsVerticalScrollIndicator={false}
                >
                    {children}
                </Content>
            </Container>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor handled by theme
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
});
