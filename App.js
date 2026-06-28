import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EmergencyScreen from './src/screens/EmergencyScreen';

const Tab = createBottomTabNavigator();

function Icon({ name }) {
  const icons = { Home: '🏠', Scan: '📷', Profile: '👤', Emergency: '🚑' };
  return <Text style={{ fontSize: 22 }}>{icons[name]}</Text>;
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: () => <Icon name={route.name} />,
          tabBarActiveTintColor: '#6366F1',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6',
            backgroundColor: '#fff',
            height: 80,
            paddingBottom: 16,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          headerStyle: { backgroundColor: '#fff', shadowColor: 'transparent', elevation: 0 },
          headerTitleStyle: { fontWeight: '700', fontSize: 18, color: '#111' },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'MediScan' }} />
        <Tab.Screen name="Scan" component={ScanScreen} options={{ title: 'Scan label' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'My profile' }} />
        <Tab.Screen
          name="Emergency"
          component={EmergencyScreen}
          options={{
            title: 'Emergency',
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600', color: '#DC2626' },
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
