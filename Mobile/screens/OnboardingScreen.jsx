import React, { useRef, useState } from 'react';
import {
    View, Text, Animated, StyleSheet,
    TouchableOpacity, Dimensions,
    StatusBar, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Droplets, AlertTriangle, Zap, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        key: '1',
        title: 'Precision Irrigation',
        text: 'AgriFlow brings intelligence to your fields. Monitor your water usage in real-time and ensure your crops get exactly what they need.',
        icon: (props) => <Image source={require('../assets/water-logo.png')} style={{ width: props.size + 40, height: props.size + 40 }} resizeMode="contain" />
    },
    {
        key: '2',
        title: 'Smart Flow Control',
        text: 'Equipped with automated sensors and valves. Detect leaks instantly and shut off supply remotely to conserve your most precious resource.',
        icon: (props) => <Droplets {...props} color="#2563eb" size={64} />
    },
    {
        key: '3',
        title: 'Sustainable Growth',
        text: 'Manage multiple meters across different crops. Track history, predict costs, and grow more with less water.',
        icon: (props) => <Zap {...props} color="#2563eb" size={64} />
    }
];

export default function OnboardingScreen({ navigation, onComplete }) {
    const scrollX = useRef(new Animated.Value(0)).current;
    const [currentIndex, setCurrentIndex] = useState(0);

    const viewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems[0]) setCurrentIndex(viewableItems[0].index);
    }).current;

    const handleFinish = async () => {
        await AsyncStorage.setItem('has_onboarded', 'true');
        if (onComplete) onComplete();
    };

    const Indicator = ({ scrollX }) => {
        return (
            <View style={styles.indicatorContainer}>
                {SLIDES.map((_, i) => {
                    const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                    const dotWidth = scrollX.interpolate({
                        inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp'
                    });
                    const backgroundColor = scrollX.interpolate({
                        inputRange, outputRange: ['#bfdbfe', '#2563eb', '#bfdbfe'], extrapolate: 'clamp'
                    });
                    return (
                        <Animated.View style={[styles.dot, { width: dotWidth, backgroundColor }]} key={i.toString()} />
                    );
                })}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <View style={styles.container}>
                <Animated.FlatList
                    data={SLIDES}
                    renderItem={({ item }) => (
                        <View style={styles.slide}>
                            <View style={styles.iconCircle}>
                                {item.icon({ size: 64 })}
                            </View>
                            <Text style={styles.title}>
                                {item.title}
                            </Text>
                            <Text style={styles.text}>
                                {item.text}
                            </Text>
                        </View>
                    )}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(i) => i.key}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                />
                <View style={styles.footer}>
                    <Indicator scrollX={scrollX} />
                    <View style={styles.btnWrapper}>
                        {currentIndex === SLIDES.length - 1 ? (
                            <TouchableOpacity style={styles.btn} onPress={handleFinish}>
                                <Text style={styles.btnTxt}>Get Started</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.placeholderRow}>
                                <TouchableOpacity onPress={handleFinish} style={{ paddingVertical: 8 }}>
                                    <Text style={styles.skipTxt}>Skip</Text>
                                </TouchableOpacity>
                                <View style={styles.swipeContainer}>
                                    <Text style={styles.swipeTxt}>Swipe</Text>
                                    <ChevronRight size={16} color="#3b82f6" />
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#ffffff' },
    container: { flex: 1, backgroundColor: '#ffffff' },
    slide: { width, alignItems: 'center', padding: 32, justifyContent: 'center', paddingBottom: 96 },
    iconCircle: {
        width: 128, height: 128, borderRadius: 36, backgroundColor: '#eff6ff',
        alignItems: 'center', justifyContent: 'center', marginBottom: 48,
        borderWidth: 1, borderColor: '#dbeafe', elevation: 2, shadowColor: '#bfdbfe', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
    },
    title: { fontSize: 28, fontWeight: '800', color: '#1e293b', marginBottom: 16, textAlign: 'center', letterSpacing: -0.5 },
    text: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 26, fontWeight: '500' },

    footer: { position: 'absolute', bottom: 0, width: '100%', padding: 32, paddingBottom: 48, backgroundColor: '#ffffff' },
    indicatorContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 40, width: '100%' },
    dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },

    btnWrapper: { height: 60, justifyContent: 'center' },
    btn: { backgroundColor: '#2563eb', height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    btnTxt: { color: '#ffffff', fontSize: 16, fontWeight: '800' },

    placeholderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12 },
    skipTxt: { color: '#94a3b8', fontWeight: '700', fontSize: 16 },
    swipeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    swipeTxt: { color: '#3b82f6', fontWeight: '700', fontSize: 15 }
});
