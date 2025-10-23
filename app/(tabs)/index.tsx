import { useAuth } from '@/contexts/AuthContext';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Marvel API credentials
const MARVEL_URL = 'https://gateway.marvel.com/v1/public/characters';
const MARVEL_TS = '1';
const MARVEL_APIKEY = 'd5e356c85bb594407d07eac736318b24';
const MARVEL_HASH = '1ee668e3d9c6814d050a917c175af06c';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  const [characters, setCharacters] = useState<any[]>([]);
  const [loadingChars, setLoadingChars] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar la sesión');
    }
  };

  useEffect(() => {
    fetchCharacters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCharacters = async () => {
    setLoadingChars(true);
    console.log('Starting to fetch characters...');
    try {
      const url = `${MARVEL_URL}?ts=${MARVEL_TS}&apikey=${MARVEL_APIKEY}&hash=${MARVEL_HASH}&limit=30`;
      console.log('Requesting Marvel:', url);
      const resp = await fetch(url);
      let json: any = null;
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        json = await resp.json();
      } else {
        // fallback to text for unexpected responses
        const text = await resp.text();
        try {
          json = JSON.parse(text);
        } catch (e) {
          json = { raw: text };
        }
      }

      console.log('Marvel response status:', resp.status);
      console.log('Marvel response data:', json);
      
      if (!resp.ok) {
        // Show a helpful alert with status and any message returned by the API
        const apiMessage = json?.message || json?.status || JSON.stringify(json);
        console.error('API Error:', apiMessage);
        Alert.alert('Marvel API Error', `Status ${resp.status}: ${apiMessage}`);
        setCharacters([]);
      } else {
        const results = json?.data?.results || [];
        console.log('Characters loaded:', results.length);
        setCharacters(results);
      }
    } catch (err) {
      console.error('Error fetching characters', err);
      Alert.alert('Error', 'No se pudieron cargar los personajes de Marvel. Revisa la consola para más detalles.');
      setCharacters([]);
    } finally {
      setLoadingChars(false);
    }
  };

  const toggleFavorite = async (char: any) => {
    const id = char.id as number;
    let updated: number[];
    if (favorites.includes(id)) {
      updated = favorites.filter((f) => f !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);

    // If user is authenticated, try to save favorite in backend
    if (user && user.uid) {
      try {
        await fetch(`http://localhost:3000/api/users/${user.uid}/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterId: id, name: char.name, thumbnail: `${char.thumbnail.path}.${char.thumbnail.extension}` }),
        });
      } catch (err) {
        console.error('Error saving favorite to backend', err);
      }
    }
  };

  const openCharacter = (char: any) => {
    setSelected(char);
  };

  const closeModal = () => setSelected(null);

  const renderItem = ({ item }: { item: any }) => {
    const thumb = `${item.thumbnail.path}.${item.thumbnail.extension}`.replace('http://', 'https://');
    const isFavorite = favorites.includes(item.id);
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => openCharacter(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardImageContainer}>
            <Image source={{ uri: thumb }} style={styles.charImage} />
            <TouchableOpacity 
              onPress={() => toggleFavorite(item)} 
              style={[styles.favButton, isFavorite && styles.favButtonActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.favButtonText, isFavorite && styles.favButtonTextActive]}>
                {isFavorite ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.charName} numberOfLines={2}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Marvel Universe</Text>
          <Text style={styles.headerSubtitle}>Explora el universo de Marvel</Text>
        </View>
        {user && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Characters Section */}
      <View style={styles.charactersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personajes</Text>
          <Text style={styles.sectionSubtitle}>Descubre tus héroes favoritos</Text>
        </View>
        
        {loadingChars ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#dc2626" />
            <Text style={styles.loadingText}>Cargando personajes...</Text>
          </View>
        ) : characters.length > 0 ? (
          <View style={styles.listWrapper}>
            <FlatList
              data={characters}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              style={styles.flatList}
            />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No se encontraron personajes</Text>
            <Text style={styles.emptySubtitle}>Parece que hay un problema con la conexión</Text>
            <Text style={styles.debugText}>Loading: {loadingChars ? 'true' : 'false'}</Text>
            <Text style={styles.debugText}>Characters: {characters.length}</Text>
            <TouchableOpacity onPress={fetchCharacters} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={!!selected} animationType="slide" onRequestClose={closeModal}>
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
                  source={{ uri: `${selected.thumbnail.path}.${selected.thumbnail.extension}`.replace('http://', 'https://') }} 
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
                  style={[styles.favAction, favorites.includes(selected.id) && styles.favActionActive]} 
                  onPress={() => toggleFavorite(selected)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.favActionText, favorites.includes(selected.id) && styles.favActionTextActive]}>
                    {favorites.includes(selected.id) ? '❤️ Quitar de favoritos' : '🤍 Agregar a favoritos'}
                  </Text>
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
    backgroundColor: '#1a1a1a',
  },
  headerSection: {
    backgroundColor: '#5a1f1f',
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e8bdbd',
    fontWeight: '400',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'center',
    shadowColor: '#dc2626',
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
    fontSize: 14,
  },
  charactersSection: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  sectionHeader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    fontWeight: '400',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#ffffff',
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
    color: '#a0a0a0',
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  debugText: {
    color: '#a0a0a0',
    fontSize: 12,
    marginVertical: 4,
  },
  listWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  flatList: {
    width: '100%',
  },
  listContent: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#2a2a2a',
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
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: 280,
    maxWidth: '90%',
  },
  cardImageContainer: {
    position: 'relative',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  charImage: {
    width: 200,
    height: 200,
    resizeMode: 'cover',
    borderRadius: 12,
  },
  favButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favButtonActive: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
  },
  favButtonText: {
    fontSize: 16,
  },
  favButtonTextActive: {
    fontSize: 16,
  },
  cardContent: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  charName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 20,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalImage: {
    width: 200,
    height: 200,
    resizeMode: 'cover',
    borderRadius: 16,
  },
  modalInfo: {
    marginBottom: 32,
  },
  modalName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  modalDesc: {
    fontSize: 16,
    color: '#e0e0e0',
    lineHeight: 24,
    textAlign: 'center',
  },
  modalActions: {
    paddingBottom: 20,
  },
  favAction: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  favActionActive: {
    backgroundColor: '#6b7280',
  },
  favActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  favActionTextActive: {
    color: '#ffffff',
  },
});
