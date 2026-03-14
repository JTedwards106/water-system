import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, View, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Droplets, User, CreditCard, Home } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import PaymentScreen from './screens/PaymentScreen';
import LinkMeterScreen from './screens/LinkMeterScreen';
import UsageScreen from './screens/UsageScreen';
import { getUser, getToken } from './utils/auth';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ user, activeMeter, setActiveMeter, meters, onLogout, navigation }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 92 : 72,
          paddingBottom: Platform.OS === 'ios' ? 32 : 14,
          paddingTop: 12,
          elevation: 0,
          borderTopColor: 'transparent',
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700', marginTop: 4 },
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'Home') return <Home color={color} size={24} strokeWidth={focused ? 2.5 : 2} />;
          if (route.name === 'Usage') return <Activity color={color} size={24} strokeWidth={focused ? 2.5 : 2} />;
          if (route.name === 'Profile') return <User color={color} size={24} strokeWidth={focused ? 2.5 : 2} />;
        },
      })}
    >
      <Tab.Screen name="Home" children={() => <HomeScreen user={user} activeMeter={activeMeter} setActiveMeter={setActiveMeter} meters={meters} navigation={navigation} />} />
      <Tab.Screen name="Usage" children={() => <UsageScreen user={user} activeMeter={activeMeter} setActiveMeter={setActiveMeter} meters={meters} />} />
      <Tab.Screen name="Profile" children={() => <ProfileScreen user={user} meters={meters} onLogout={onLogout} navigation={navigation} />} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [meters, setMeters] = useState([]);
  const [activeMeter, setActiveMeter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  // Check if already logged in and if onboarded from a previous session
  useEffect(() => {
    (async () => {
      const [token, savedUser, onboardState, localMeters] = await Promise.all([
        getToken(),
        getUser(),
        AsyncStorage.getItem('has_onboarded'),
        AsyncStorage.getItem('linked_meters')
      ]);

      if (token && savedUser) {
        setUser(savedUser);
        let parsedMeters = localMeters ? JSON.parse(localMeters) : [];

        // Migrate single deviceId to meters array if it's the first time
        if (parsedMeters.length === 0 && savedUser.deviceId) {
          parsedMeters = [{
            deviceId: savedUser.deviceId,
            premiseId: 'MIGRATED',
            ownerName: savedUser.name,
            cropType: savedUser.cropType || 'Default Field'
          }];
          await AsyncStorage.setItem('linked_meters', JSON.stringify(parsedMeters));
        }

        setMeters(parsedMeters);
        if (parsedMeters.length > 0) {
          setActiveMeter(parsedMeters[0]);
        }
      }

      if (onboardState === 'true') setHasOnboarded(true);
      setLoading(false);
    })();
  }, []);

  const handleLogout = async () => {
    setUser(null);
    setMeters([]);
    setActiveMeter(null);
    await AsyncStorage.removeItem('linked_meters');
  };

  const handleLinked = async (newMeter) => {
    const updatedMeters = [...meters, newMeter];
    setMeters(updatedMeters);
    setActiveMeter(newMeter);
    await AsyncStorage.setItem('linked_meters', JSON.stringify(updatedMeters));

    // Update user object if it was the first link
    if (!user.deviceId) {
      const updatedUser = { ...user, deviceId: newMeter.deviceId };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff' }}>
        <Droplets color="#2563eb" size={40} />
        <ActivityIndicator color="#2563eb" style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <NavigationContainer>
        {user ? (
          // Authenticated
          (user.deviceId || meters.length > 0) ? (
            // Linked — bottom tab navigator
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="MainTabs">
                {() => <MainTabs user={user} activeMeter={activeMeter} setActiveMeter={setActiveMeter} meters={meters} onLogout={handleLogout} />}
              </Stack.Screen>
              <Stack.Screen name="LinkMeter">
                {({ navigation }) =>
                  <LinkMeterScreen
                    navigation={navigation}
                    onLinked={handleLinked}
                    onLogout={handleLogout}
                    isPlural={true}
                  />}
              </Stack.Screen>
            </Stack.Navigator>
          ) : (
            // Not Linked — Force linking
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="LinkMeter" children={({ navigation }) =>
                <LinkMeterScreen
                  navigation={navigation}
                  onLinked={handleLinked}
                  onLogout={handleLogout}
                />}
              />
              {/* Allow profile access to logout if stuck */}
              <Stack.Screen name="Profile" children={({ navigation }) =>
                <ProfileScreen user={user} meters={meters} onLogout={handleLogout} navigation={navigation} />}
              />
            </Stack.Navigator>
          )
        ) : (
          // Unauthenticated — Onboarding / login / register stack
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={hasOnboarded ? "Login" : "Onboarding"}>
            <Stack.Screen name="Onboarding" children={({ navigation }) =>
              <OnboardingScreen navigation={navigation} onComplete={() => {
                setHasOnboarded(true);
                navigation.replace('Login');
              }} />}
            />
            <Stack.Screen name="Login" children={({ navigation }) =>
              <LoginScreen navigation={navigation} onLogin={(u) => setUser(u)} />}
            />
            <Stack.Screen name="Register" children={({ navigation }) =>
              <RegisterScreen navigation={navigation} onLogin={(u) => setUser(u)} />}
            />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
