import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export interface Favorite {
  marvelId: number;
  name: string;
  thumbnail: string;
  addedAt?: Date;
}

interface FavoritesContextType {
  favorites: Favorite[];
  favoriteIds: number[];
  loading: boolean;
  addFavorite: (character: any) => Promise<boolean>;
  removeFavorite: (marvelId: number) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites debe ser usado dentro de un FavoritesProvider');
  }
  return context;
};

interface FavoritesProviderProps {
  children: React.ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  // Derivar IDs de favoritos del array completo
  const favoriteIds = favorites.map(fav => fav.marvelId);

  // Cargar favoritos cuando el usuario cambia
  useEffect(() => {
    if (user && user.uid) {
      refreshFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const refreshFavorites = async () => {
    if (!user || !user.uid) return;
    
    setLoading(true);
    try {
      const url = process.env.EXPO_PUBLIC_API_URL || 'https://themarvelproject-backend.vercel.app/api';
      const response = await fetch(`${url}/users/${user.uid}/favorites`);
      
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      } else if (response.status === 404) {
        setFavorites([]);
      } else {
        console.error('Error fetching favorites:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async (character: any): Promise<boolean> => {
    if (!user || !user.uid) return false;

    const id = character.id as number;
    
    // Actualización optimista
    const newFavorite: Favorite = {
      marvelId: id,
      name: character.name,
      thumbnail: `${character.thumbnail.path}.${character.thumbnail.extension}`.replace('http://', 'https://'),
      addedAt: new Date(),
    };
    
    setFavorites(prev => [...prev, newFavorite]);

    try {
      const url = process.env.EXPO_PUBLIC_API_URL || 'https://themarvelproject-backend.vercel.app/api';
      const response = await fetch(`${url}/users/${user.uid}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok && response.status !== 409) {
        // Revertir si falla
        setFavorites(prev => prev.filter(f => f.marvelId !== id));
        console.error('Error adding favorite:', response.status);
        return false;
      }

      // Refrescar para asegurar sincronización
      await refreshFavorites();
      return true;
    } catch (error) {
      // Revertir en caso de error
      setFavorites(prev => prev.filter(f => f.marvelId !== id));
      console.error('Error adding favorite:', error);
      return false;
    }
  };

  const removeFavorite = async (marvelId: number): Promise<boolean> => {
    if (!user || !user.uid) return false;

    // Guardar copia para revertir si falla
    const previousFavorites = [...favorites];
    
    // Actualización optimista
    setFavorites(prev => prev.filter(f => f.marvelId !== marvelId));

    try {
      const url = process.env.EXPO_PUBLIC_API_URL || 'https://themarvelproject-backend.vercel.app/api';
      const response = await fetch(`${url}/users/${user.uid}/favorites/${marvelId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok || response.status === 404) {
        return true;
      } else {
        // Revertir si falla
        setFavorites(previousFavorites);
        console.error('Error removing favorite:', response.status);
        return false;
      }
    } catch (error) {
      // Revertir en caso de error
      setFavorites(previousFavorites);
      console.error('Error removing favorite:', error);
      return false;
    }
  };

  const value: FavoritesContextType = {
    favorites,
    favoriteIds,
    loading,
    addFavorite,
    removeFavorite,
    refreshFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};