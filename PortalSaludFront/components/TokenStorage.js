import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeTokens = async (accessToken, refreshToken) => {
  try {
    clearTokens()
    await AsyncStorage.setItem('@accessToken', accessToken);
    await AsyncStorage.setItem('@refreshToken', refreshToken);
  } catch (e) {
    console.error('Error guardando los tokens', e);
  }
};

export const getTokens = async () => {
  try {
    const accessToken = await AsyncStorage.getItem('@accessToken');
    const refreshToken = await AsyncStorage.getItem('@refreshToken');
    return { accessToken, refreshToken };
  } catch (e) {
    console.error('Error obteniendo los tokens', e);
    return null;
  }
};

export const clearTokens = async () => {
  try {
    await AsyncStorage.removeItem('@accessToken');
    await AsyncStorage.removeItem('@refreshToken');
  } catch (e) {
    console.error('Error borrando los tokens', e);
  }
};