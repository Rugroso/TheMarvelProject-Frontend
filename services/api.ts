const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

export interface UserData {
  firebaseUid: string;
  email: string;
  displayName: string;
}

export interface ApiResponse<T> {
  message?: string;
  user?: T;
  error?: string;
  details?: string;
}

/**
 * Crear o actualizar usuario en MongoDB
 */
export const saveUserToMongoDB = async (
  userData: UserData
): Promise<ApiResponse<UserData>> => {
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al guardar usuario");
    }

    return data;
  } catch (error) {
    console.error("Error en saveUserToMongoDB:", error);
    throw error;
  }
};

/**
 * Obtener usuario de MongoDB por Firebase UID
 */
export const getUserFromMongoDB = async (
  firebaseUid: string
): Promise<ApiResponse<UserData>> => {
  try {
    const response = await fetch(`${API_URL}/users/${firebaseUid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al obtener usuario");
    }

    return data;
  } catch (error) {
    console.error("Error en getUserFromMongoDB:", error);
    throw error;
  }
};
