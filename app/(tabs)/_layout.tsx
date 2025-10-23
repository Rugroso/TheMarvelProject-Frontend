import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#b96b6b', // Rojo Marvel cálido
        tabBarInactiveTintColor: '#e8bdbd', // Rosa claro
        tabBarStyle: {
          backgroundColor: '#5a1f1f', // Fondo rojo Marvel
          borderTopColor: 'rgba(255, 255, 255, 0.2)',
          borderTopWidth: 1,
          height: Platform.OS === 'web' ? 70 : 60,
          paddingBottom: Platform.OS === 'web' ? 10 : 5,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: Platform.OS === 'web' ? 14 : 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Personajes',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={Platform.OS === 'web' ? 32 : 28} 
              name="house.fill" 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={Platform.OS === 'web' ? 32 : 28} 
              name="person.fill" 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
