import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GoogleButtonProps {
  onPress: () => void;
  disabled?: boolean;
  text?: string;
}

export default function GoogleButton({ 
  onPress, 
  disabled = false,
  text = 'Continuar con Google'
}: GoogleButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.googleButton, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.buttonContent}>
        <View style={styles.googleIcon}>
          <FontAwesome6 name="google" size={24} color="#5a1f1f" />
        </View>
        <Text style={styles.googleButtonText}>{text}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
