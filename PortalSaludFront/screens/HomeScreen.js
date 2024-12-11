import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, TouchableOpacity, Dimensions,
  Platform, ActivityIndicator
} from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import { CalendarManager } from '../CalendarManager';
import { CommonActions } from '@react-navigation/native';
import { moderateScale } from 'react-native-size-matters';


const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};

export default function HomeScreen({ navigation }) {

  const [loading, setLoading] = useState(true);

  const loadSession = async () => {

    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error al cargar la sesión:', error);
      return null;
    }


  };

  useEffect(() => {
    const loadResources = async () => {
      await CalendarManager.requestCalendarPermissions();
      await loadFonts();
      const userData = await loadSession(); 

      if (userData) {
        const id = userData.id
        var tipo = userData.tipo;
        try {
          if (Platform.OS !== 'web' && tipo == "Paciente")
            await CalendarManager.initializeCalendarConfig(userData.id)
          if (tipo == "Paciente") {
            pagina = "ListadoCitas"
          }
          else if (tipo == "Medico") {
            pagina = "ListadoCitasMedico"
          }
          else if (tipo == "Administrador") {
            pagina = "ListadoSolicitudes"
            tipo = 'Pendiente'
          }
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: pagina, params: { id: id, tipo: tipo } }],
            })
          )

        } catch (error) {

          console.error('Error al enviar la solicitud:', error.message);
        }
      }
      setLoading(false);
      
    };

    loadResources();

  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const { height, width } = Dimensions.get('window');

  var titleFont, buttonWidth, buttonHeight

  if (Platform.OS === 'web' && !isMobile) {
    titleFont = moderateScale(40)
    buttonWidth = width * 0.4
    buttonHeight = height * 0.2
  }
  else {
    titleFont = moderateScale(37)
    buttonWidth = width * 0.8
    buttonHeight = height * 0.15
  }


  return (
    <View style={styles.container}>
      <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, paddingTop: height * 0.2 }}>
        Bienvenido a
      </Text>
      <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, paddingBottom: height * 0.1 }}>
        <Text style={{ flexWrap: 'wrap', color: '#0A84FF', fontFamily: 'Nunito', fontSize: titleFont }}>
          Portal
        </Text>
        Salud
      </Text>

      <TouchableOpacity
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 8,
          backgroundColor: '#24a0ed',
          borderRadius: 10,
          height: buttonHeight,
          width: buttonWidth,
        }}
        onPress={() =>
          navigation.navigate("Login")}  >
        <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
          Iniciar Sesión
        </Text>
      </TouchableOpacity>

      <Text style={{ flexWrap: 'wrap', paddingBottom: height * 0.02 }} />

      <TouchableOpacity
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 8,
          backgroundColor: '#565A60',
          borderRadius: 10,
          height: buttonHeight,
          width: buttonWidth,
        }}
        onPress={() => navigation.navigate("Registro")}  >
        <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
          Registrarse
        </Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
});
