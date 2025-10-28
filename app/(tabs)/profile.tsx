import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isDesktop = screenWidth >= 1024;
const isLargeDesktop = screenWidth >= 1440;

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { favorites, loading: loadingFavorites, removeFavorite, refreshFavorites } = useFavorites();
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  
  const columns = favorites.length > 1 ? (isLargeDesktop ? 3 : isDesktop ? 2 : 1) : 1;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar la sesión');
    }
  };

  const openCharacter = (char: any) => {
    setSelected(char);
  };

  const closeModal = () => setSelected(null);

  const onRefresh = async () => {
    if (!user || !user.uid) return;
    
    setRefreshing(true);
    try {
      await refreshFavorites();
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemoveFavorite = async (character: any) => {
    if (!user || !user.uid) return;

    const marvelId = character.marvelId;
    const success = await removeFavorite(marvelId);
    
    if (success) {
      closeModal();
    } else {
      Alert.alert('Error', 'No se pudo eliminar el favorito');
    }
  };

  const renderFavoriteItem = ({ item }: { item: any }) => {
    const thumb = item.thumbnail?.replace('http://', 'https://') || '';
    
    return (
      <TouchableOpacity 
        style={styles.favoriteCard} 
        onPress={() => openCharacter(item)}
        activeOpacity={0.8}
      >
        <View style={styles.favoriteCardContent}>
          <View style={styles.favoriteCardImageContainer}>
            <Image source={{ uri: thumb }} style={styles.favoriteImage} />
          </View>
          <Text style={styles.favoriteName} numberOfLines={2}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Perfil</Text>
          <Text style={styles.headerSubtitle}>Inicia sesión para ver tu perfil</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No has iniciado sesión</Text>
          <Text style={styles.emptySubtitle}>Inicia sesión para acceder a tu perfil y favoritos</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.headerTitle}>
            {user.displayName || user.email?.split('@')[0] || 'Usuario'}
          </Text>
          <Text style={styles.headerSubtitle}>{user.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{favorites.length}</Text>
          <Text style={styles.statLabel}>Favoritos</Text>
        </View>
      </View>

      <View style={styles.favoritesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mis Favoritos</Text>
          <Text style={styles.sectionSubtitle}>Personajes que te gustan</Text>
        </View>
        
        {loadingFavorites ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#dc2626" />
            <Text style={styles.loadingText}>Cargando favoritos...</Text>
          </View>
        ) : favorites.length > 0 ? (
          <View style={styles.favoritesList}>
            <FlatList
              key={`cols-${columns}`}
              data={favorites}
              keyExtractor={(item) => String(item.marvelId)}
              renderItem={renderFavoriteItem}
              numColumns={columns}
              columnWrapperStyle={columns > 1 ? styles.favoritesRow : undefined}
              contentContainerStyle={styles.favoritesContent}
              showsVerticalScrollIndicator={false}
              style={styles.favoritesFlatList}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          </View>
        ) : (
          <View style={styles.favoritesList}>
            <FlatList
              data={[]}
              keyExtractor={() => 'empty'}
              renderItem={() => null}
              contentContainerStyle={styles.emptyFavoritesContainer}
              showsVerticalScrollIndicator={false}
              style={styles.favoritesFlatList}
              refreshing={refreshing}
              onRefresh={onRefresh}
              ListEmptyComponent={
                <View style={styles.emptyFavoritesContainer}>
                  <Text style={styles.emptyFavoritesTitle}>No tienes favoritos aún</Text>
                  <Text style={styles.emptyFavoritesSubtitle}>Explora personajes y agrega tus favoritos</Text>
                </View>
              }
            />
          </View>
        )}
      </View>

      <Modal visible={!!selected} animationType="fade" onRequestClose={closeModal}>
        <SafeAreaView style={styles.modalContainer}>
          {selected && (
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalImageContainer}>
                <Image 
                  source={{ uri: selected.thumbnail?.replace('http://', 'https://') || '' }} 
                  style={styles.modalImage} 
                />
              </View>
              
              <View style={styles.modalInfo}>
                <Text style={styles.modalName}>{selected.name}</Text>
                <Text style={styles.modalDesc}>
                  {selected.description || 'Sin descripción disponible para este personaje.'}
                </Text>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.removeButton} 
                  onPress={() => handleRemoveFavorite(selected)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.removeButtonText}>Eliminar de favoritos</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5a1f1f',
  },
  headerSection: {
    backgroundColor: '#3f1515',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: isLargeDesktop ? 80 : isDesktop ? 70 : 60,
    height: isLargeDesktop ? 80 : isDesktop ? 70 : 60,
    borderRadius: isLargeDesktop ? 40 : isDesktop ? 35 : 30,
    backgroundColor: '#b96b6b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#b96b6b',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: isLargeDesktop ? 32 : isDesktop ? 28 : 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerTitle: {
    fontSize: isLargeDesktop ? 24 : isDesktop ? 22 : 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: isLargeDesktop ? 14 : isDesktop ? 13 : 12,
    color: '#e8bdbd',
    fontWeight: '400',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#b96b6b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'center',
    shadowColor: '#b96b6b',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#3f1515',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: isLargeDesktop ? 32 : isDesktop ? 28 : 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: isLargeDesktop ? 16 : isDesktop ? 14 : 12,
    color: '#e8bdbd',
    fontWeight: '500',
  },
  favoritesSection: {
    flex: 1,
    backgroundColor: '#5a1f1f',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: isLargeDesktop ? 28 : isDesktop ? 24 : 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: isLargeDesktop ? 18 : isDesktop ? 16 : 14,
    color: '#e8bdbd',
    fontWeight: '400',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#f0dada',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#e8bdbd',
    textAlign: 'center',
  },
  favoritesList: {
    flex: 1,
  },
  favoritesFlatList: {
    flex: 1,
  },
  favoritesContent: {
    paddingBottom: 20,
    alignItems: 'center',
    paddingHorizontal: isLargeDesktop ? 40 : isDesktop ? 20 : 16,
  },
  favoritesRow: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: isLargeDesktop ? 16 : 12,
  },
  favoriteCard: {
    backgroundColor: '#3f1515',
    borderRadius: 16,
    marginVertical: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: isLargeDesktop ? 300 : isDesktop ? 280 : isTablet ? 250 : 280,
    maxWidth: '90%',
    marginHorizontal: isLargeDesktop || isDesktop ? 8 : 0,
  },
  favoriteCardContent: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  favoriteCardImageContainer: {
    position: 'relative',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  favoriteImage: {
    width: isLargeDesktop ? 220 : isDesktop ? 200 : isTablet ? 180 : 200,
    height: isLargeDesktop ? 220 : isDesktop ? 200 : isTablet ? 180 : 200,
    resizeMode: 'cover',
    borderRadius: 12,
  },
  favoriteName: {
    color: '#ffffff',
    fontSize: isLargeDesktop ? 20 : isDesktop ? 18 : isTablet ? 16 : 18,
    fontWeight: '700',
    lineHeight: isLargeDesktop ? 24 : isDesktop ? 22 : isTablet ? 20 : 22,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  emptyFavoritesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyFavoritesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyFavoritesSubtitle: {
    fontSize: 16,
    color: '#e8bdbd',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#5a1f1f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isLargeDesktop ? 40 : isDesktop ? 20 : 16,
  },
  modalContent: {
    backgroundColor: '#3f1515',
    borderRadius: 24,
    padding: isLargeDesktop ? 40 : isDesktop ? 32 : 24,
    maxWidth: isLargeDesktop ? 600 : isDesktop ? 500 : 400,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalImageContainer: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  modalImage: {
    width: isLargeDesktop ? 300 : isDesktop ? 250 : 200,
    height: isLargeDesktop ? 300 : isDesktop ? 250 : 200,
    resizeMode: 'cover',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalInfo: {
    marginBottom: 32,
    alignItems: 'center',
  },
  modalName: {
    fontSize: isLargeDesktop ? 32 : isDesktop ? 28 : 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
    lineHeight: isLargeDesktop ? 38 : isDesktop ? 34 : 30,
  },
  modalDesc: {
    fontSize: isLargeDesktop ? 18 : isDesktop ? 16 : 14,
    color: '#f0dada',
    lineHeight: isLargeDesktop ? 28 : isDesktop ? 24 : 20,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  modalActions: {
    alignItems: 'center',
    marginTop: 24,
  },
  removeButton: {
    backgroundColor: '#dc2626',
    paddingVertical: isLargeDesktop ? 18 : isDesktop ? 16 : 14,
    paddingHorizontal: isLargeDesktop ? 32 : isDesktop ? 28 : 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: isLargeDesktop ? 18 : isDesktop ? 16 : 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});