import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
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
      setTimeout(() => {
        router.push('/login');
      }, 100);
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

      console.log('Marvel response status:', resp.status, json);
      if (!resp.ok) {
        // Show a helpful alert with status and any message returned by the API
        const apiMessage = json?.message || json?.status || JSON.stringify(json);
        Alert.alert('Marvel API Error', `Status ${resp.status}: ${apiMessage}`);
        setCharacters([]);
      } else {
        const results = json?.data?.results || [];
        setCharacters(results);
      }
    } catch (err) {
      console.error('Error fetching characters', err);
      Alert.alert('Error', 'No se pudieron cargar los personajes de Marvel. Revisa la consola para más detalles.');
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
    return (
      <TouchableOpacity style={styles.card} onPress={() => openCharacter(item)}>
        <Image source={{ uri: thumb }} style={styles.charImage} />
        <View style={styles.cardFooter}>
          <Text style={styles.charName}>{item.name}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(item)} style={styles.favButton}>
            <Text style={styles.favButtonText}>{favorites.includes(item.id) ? '★' : '☆'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {user && (
        <View style={styles.userContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Personajes</Text>
        {loadingChars ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : characters.length > 0 ? (
          <FlatList
            data={characters}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        ) : (
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{ color: '#fff', marginBottom: 12 }}>No se encontraron personajes.</Text>
            <TouchableOpacity onPress={fetchCharacters} style={{ backgroundColor: '#7a2b2b', padding: 10, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={!!selected} animationType="slide" onRequestClose={closeModal}>
        <SafeAreaView style={styles.modalContainer}>
          {selected && (
            <View style={styles.modalContent}>
              <Image source={{ uri: `${selected.thumbnail.path}.${selected.thumbnail.extension}`.replace('http://', 'https://') }} style={styles.modalImage} />
              <Text style={styles.modalName}>{selected.name}</Text>
              <Text style={styles.modalDesc}>{selected.description || 'Sin descripción disponible.'}</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.favAction} onPress={() => toggleFavorite(selected)}>
                  <Text style={styles.favActionText}>{favorites.includes(selected.id) ? 'Quitar favorito' : 'Agregar a favoritos'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeAction} onPress={closeModal}>
                  <Text style={styles.closeActionText}>Cerrar</Text>
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
  listContainer: {
    flex: 1,
    width: '100%',
    paddingTop: 12,
    backgroundColor: '#5a1f1f', // maroon-like background
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    alignSelf: 'center',
    marginVertical: 12,
  },
  card: {
    backgroundColor: '#4a1515',
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },
  charImage: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
    marginTop: 16,
  },
  cardFooter: {
    width: '100%',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
  },
  favButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#7a2b2b',
    borderRadius: 8,
  },
  favButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#5a1f1f',
  },
  modalContent: {
    padding: 20,
    alignItems: 'center',
  },
  modalImage: {
    width: 260,
    height: 260,
    resizeMode: 'contain',
  },
  modalName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
  },
  modalDesc: {
    color: '#eee',
    marginTop: 12,
    textAlign: 'left',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  favAction: {
    backgroundColor: '#7a2b2b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  favActionText: {
    color: '#fff',
    fontWeight: '700',
  },
  closeAction: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeActionText: {
    color: '#fff',
    fontWeight: '700',
  },
});
