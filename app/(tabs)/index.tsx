import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import React, { useEffect, useState } from 'react';
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

// Marvel API credentials
const MARVEL_URL = 'https://gateway.marvel.com/v1/public/characters';
const MARVEL_TS = '1';
const MARVEL_APIKEY = 'd5e356c85bb594407d07eac736318b24';
const MARVEL_HASH = '1ee668e3d9c6814d050a917c175af06c';

// Responsive breakpoints
const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isDesktop = screenWidth >= 1024;
const isLargeDesktop = screenWidth >= 1440;

export default function HomeScreen() {
  const { user } = useAuth();
  const { favoriteIds, addFavorite, removeFavorite } = useFavorites();

  const [characters, setCharacters] = useState<any[]>([]);
  const [loadingChars, setLoadingChars] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  
  const CHARACTERS_PER_PAGE = 30;
  const totalPages = Math.ceil(totalResults / CHARACTERS_PER_PAGE);

  useEffect(() => {
    fetchCharacters(currentPage);
  }, [currentPage]);

  const isValidCharacter = (char: any): boolean => {
    // Verificar que tenga nombre
    if (!char.name || char.name.trim() === '') {
      return false;
    }

    // Verificar que tenga descripcion
    if (!char.description || char.description.trim() === '') {
      return false;
    }

    // Verificar que tenga thumbnail válido
    if (!char.thumbnail || !char.thumbnail.path || !char.thumbnail.extension) {
      return false;
    }

    // Verificar que la imagen no sea "image_not_available"
    const thumbnailPath = char.thumbnail.path.toLowerCase();
    if (thumbnailPath.includes('image_not_available')) {
      return false;
    }

    // El personaje es válido si tiene nombre e imagen válida
    // La descripción es opcional
    return true;
  };

  const fetchCharacters = async (page: number = 1) => {
    setLoadingChars(true);
    console.log('Fetching page:', page);
    
    try {
      const offset = (page - 1) * CHARACTERS_PER_PAGE;
      // Solicitamos más personajes para compensar el filtrado
      const limit = CHARACTERS_PER_PAGE * 2;
      const url = `${MARVEL_URL}?ts=${MARVEL_TS}&apikey=${MARVEL_APIKEY}&hash=${MARVEL_HASH}&limit=${limit}&offset=${offset}`;
      
      console.log('Requesting Marvel:', url);
      const resp = await fetch(url);
      let json: any = null;
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        json = await resp.json();
      } else {
        const text = await resp.text();
        try {
          json = JSON.parse(text);
        } catch (e) {
          json = { raw: text };
        }
      }

      console.log('Marvel response status:', resp.status);
      
      if (!resp.ok) {
        const apiMessage = json?.message || json?.status || JSON.stringify(json);
        console.error('API Error:', apiMessage);
        Alert.alert('Marvel API Error', `Status ${resp.status}: ${apiMessage}`);
        setCharacters([]);
      } else {
        const results = json?.data?.results || [];
        const total = json?.data?.total || 0;
        
        console.log('Characters loaded (raw):', results.length);
        console.log('Total available in Marvel:', total);
        
        // Filtrar personajes válidos
        const validCharacters = results.filter(isValidCharacter);
        console.log('Valid characters after filtering:', validCharacters.length);
        console.log('Filtered out:', results.length - validCharacters.length, 'characters');
        
        // Limitar a 30 personajes por página
        const displayCharacters = validCharacters.slice(0, CHARACTERS_PER_PAGE);
        
        setCharacters(displayCharacters);
        setTotalResults(total);
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
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para agregar favoritos');
      return;
    }

    const id = char.id as number;
    const isFavorite = favoriteIds.includes(id);
    
    if (isFavorite) {
      const success = await removeFavorite(id);
      if (!success) {
        Alert.alert('Error', 'No se pudo eliminar el favorito');
      }
    } else {
      const success = await addFavorite(char);
      if (!success) {
        Alert.alert('Error', 'No se pudo agregar a favoritos');
      }
    }
  };

  const openCharacter = (char: any) => {
    setSelected(char);
  };

  const closeModal = () => setSelected(null);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCharacters(currentPage);
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  const renderItem = ({ item }: { item: any }) => {
    const thumb = `${item.thumbnail.path}.${item.thumbnail.extension}`.replace('http://', 'https://');
    const isFavorite = favoriteIds.includes(item.id);
    
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
                {isFavorite ? '🌟' : '⭐️'}
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
          <Image 
            source={require('@/assets/images/MarvelLogo.png')} 
            style={styles.marvelLogo}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Characters Section */}
      <View style={styles.charactersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personajes</Text>
          {totalResults > 0 && (
            <Text style={styles.sectionSubtitle}>
              Página {currentPage} de {totalPages} • {totalResults} personajes
            </Text>
          )}
        </View>
        
        {loadingChars ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#dc2626" />
            <Text style={styles.loadingText}>Cargando personajes...</Text>
          </View>
        ) : characters.length > 0 ? (
          <>
            <View style={styles.listWrapper}>
              <FlatList
                data={characters}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                numColumns={isLargeDesktop ? 3 : isDesktop ? 2 : 1}
                columnWrapperStyle={isLargeDesktop || isDesktop ? styles.row : undefined}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                style={styles.flatList}
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            </View>
            
            {/* Pagination Controls */}
            <View style={styles.paginationContainer}>
              <TouchableOpacity 
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={goToFirstPage}
                disabled={currentPage === 1}
              >
                <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                  ««
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={goToPreviousPage}
                disabled={currentPage === 1}
              >
                <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                  ‹ Anterior
                </Text>
              </TouchableOpacity>

              <View style={styles.pageIndicator}>
                <Text style={styles.pageNumber}>{currentPage}</Text>
                <Text style={styles.pageTotal}>de {totalPages}</Text>
              </View>

              <TouchableOpacity 
                style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                onPress={goToNextPage}
                disabled={currentPage === totalPages}
              >
                <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                  Siguiente ›
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                onPress={goToLastPage}
                disabled={currentPage === totalPages}
              >
                <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                  »»
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No se encontraron personajes</Text>
            <Text style={styles.emptySubtitle}>Parece que hay un problema con la conexión</Text>
            <TouchableOpacity onPress={() => fetchCharacters(currentPage)} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
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
                {!favoriteIds.includes(selected.id) && (
                  <TouchableOpacity 
                    style={styles.favAction}
                    onPress={() => {
                      toggleFavorite(selected);
                      closeModal();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.favActionText}>
                      Agregar a favoritos
                    </Text>
                  </TouchableOpacity>
                )}
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
    paddingVertical: 12,
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
    justifyContent: 'center',
    paddingVertical: 8,
  },
  marvelLogo: {
    width: isLargeDesktop ? 400 : isDesktop ? 350 : isTablet ? 280 : 250,
    height: isLargeDesktop ? 130 : isDesktop ? 110 : isTablet ? 85 : 75,
  },
  charactersSection: {
    flex: 1,
    backgroundColor: '#5a1f1f',
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
    fontSize: 14,
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
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#b96b6b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
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
    paddingHorizontal: isLargeDesktop ? 40 : isDesktop ? 20 : 16,
  },
  row: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: isLargeDesktop ? 16 : 12,
  },
  card: {
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
  cardImageContainer: {
    position: 'relative',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  charImage: {
    width: isLargeDesktop ? 220 : isDesktop ? 200 : isTablet ? 180 : 200,
    height: isLargeDesktop ? 220 : isDesktop ? 200 : isTablet ? 180 : 200,
    resizeMode: 'cover',
    borderRadius: 12,
  },
  favButton: {
    position: 'absolute',
    top: isLargeDesktop ? 28 : isDesktop ? 24 : isTablet ? 20 : 24,
    right: isLargeDesktop ? 28 : isDesktop ? 24 : isTablet ? 20 : 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: isLargeDesktop ? 42 : isDesktop ? 40 : isTablet ? 36 : 40,
    height: isLargeDesktop ? 42 : isDesktop ? 40 : isTablet ? 36 : 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favButtonActive: {
    backgroundColor: 'rgba(185, 107, 107, 0.8)',
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
    fontSize: isLargeDesktop ? 20 : isDesktop ? 18 : isTablet ? 16 : 18,
    fontWeight: '700',
    lineHeight: isLargeDesktop ? 24 : isDesktop ? 22 : isTablet ? 20 : 22,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
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
  },
  favAction: {
    backgroundColor: '#b96b6b',
    paddingVertical: isLargeDesktop ? 18 : isDesktop ? 16 : 14,
    paddingHorizontal: isLargeDesktop ? 32 : isDesktop ? 28 : 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#b96b6b',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(185, 107, 107, 0.3)',
  },
  favActionText: {
    color: '#ffffff',
    fontSize: isLargeDesktop ? 18 : isDesktop ? 16 : 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: '#3f1515',
    marginHorizontal: 16,
    marginBottom: 16,
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
  paginationButton: {
    backgroundColor: '#b96b6b',
    paddingHorizontal: isLargeDesktop ? 20 : isDesktop ? 16 : 12,
    paddingVertical: isLargeDesktop ? 12 : isDesktop ? 10 : 8,
    borderRadius: 12,
    shadowColor: '#b96b6b',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  paginationButtonDisabled: {
    backgroundColor: '#8f8f8f',
    shadowOpacity: 0.1,
    opacity: 0.5,
  },
  paginationButtonText: {
    color: '#ffffff',
    fontSize: isLargeDesktop ? 16 : isDesktop ? 14 : 12,
    fontWeight: '700',
  },
  paginationButtonTextDisabled: {
    color: '#e0e0e0',
  },
  pageIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: isLargeDesktop ? 24 : isDesktop ? 20 : 16,
    paddingVertical: isLargeDesktop ? 12 : isDesktop ? 10 : 8,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: isLargeDesktop ? 100 : isDesktop ? 80 : 70,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pageNumber: {
    color: '#ffffff',
    fontSize: isLargeDesktop ? 24 : isDesktop ? 20 : 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  pageTotal: {
    color: '#e8bdbd',
    fontSize: isLargeDesktop ? 14 : isDesktop ? 12 : 10,
    fontWeight: '500',
  },
});