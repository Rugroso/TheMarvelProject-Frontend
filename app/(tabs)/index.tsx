import { useAuth } from '@/contexts/AuthContext';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {user && (
        <View style={styles.userContainer}>
          <Text style={styles.welcomeText}>
            ¡Bienvenido, {user.displayName || 'Usuario'}!
          </Text>
          
          <View style={styles.userInfoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre:</Text>
              <Text style={styles.infoValue}>
                {user.displayName || 'No especificado'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID:</Text>
              <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
                {user.uid}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Correo:</Text>
              <Text style={styles.infoValue}>
                {user.email}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#eee', 
  },
  userContainer: {
    backgroundColor: 'white', 
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#e0e0e0', // Borde sutil para definir la tarjeta
  },
  welcomeText: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#333', // Color fijo, no cambia con el tema
    fontSize: 18,
    fontWeight: '600',
  },
  userInfoContainer: {
    width: '100%',
    backgroundColor: 'white', // Siempre blanco
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0', // Borde sutil
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0', // Color fijo para las líneas
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666', // Color fijo, no cambia con el tema
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333', // Color fijo, no cambia con el tema
    flex: 2,
    textAlign: 'right',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#FF3B30', // Color fijo del botón
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  logoutButtonText: {
    color: 'white', // Color fijo del texto del botón
    fontWeight: '600',
    fontSize: 16,
  },
});
