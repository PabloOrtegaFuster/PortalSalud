import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, SafeAreaView, StatusBar, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { SERVER } from '@env';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';
import { getTokens, storeTokens, clearTokens } from '../components/TokenStorage'
import FooterPaciente from '../components/FooterPaciente';

import { CalendarManager } from '../CalendarManager';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { moderateScale } from 'react-native-size-matters';
const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};

export default function Perfil({ navigation, route }) {
  const { id } = route.params;
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [dni, setDni] = useState("");
  const [medico, setMedico] = useState("");
  const [centro, setCentro] = useState("");


  useEffect(() => {
    const loadResources = async () => {
      await loadFonts();
      await fetchData();
    };

    loadResources();



  }, []);

  const fetchData = async () => {
    try {
      const { accessToken, refreshToken } = await getTokens();
      Data = {
        id: id
      };

      const response = await axios.post(SERVER + 'users/detalle', Data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-refresh-token': refreshToken,
        }
      })

      setNombre(response.data.nombre);
      setApellidos(response.data.apellidos);
      setDni(response.data.dni);
      setCorreo(response.data.correo);
      setMedico(response.data.medico);
      setCentro(response.data.centro);

      if (response.data.accessToken && response.data.refreshToken) {
        storeTokens(response.data.accessToken, response.data.refreshToken);
      }

    } catch (error) {
      console.error('Error al enviar la solicitud:', error.message);
      if (error.response && error.response.status === 403) {
        await AsyncStorage.removeItem('userData');
        await clearTokens()
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Home" }],
          })
        )
      }
    }

  }

  function generarCodigo6Digitos() {
    const numero = Math.floor(Math.random() * 1000000);
    return numero.toString().padStart(6, '0');
  }

  async function handleResetPassword(navigation) {
    const token = generarCodigo6Digitos();
    var Data = {
      destinatario: correo,
      mensaje: "Aqui tienes tu codigo de recuperacion de contraseña: " + token,
      token: token
    };

    const response = await axios.post(SERVER + 'auth/enviar-correo', Data)

    if (response.data.success) {
      navigation.navigate("ResetContraseña", { correo: correo })
    }
    else {
      let errors = {};
      errors.login = response.data.message;
      setErrors(errors)
    }
  }

  const removeSession = async () => {
    try {
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Error al eliminar la sesión:', error);
    }
  };

  const logout = async () => {
    try {
      await removeSession();
      await clearTokens();
      await CalendarManager.deleteAllEvents();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleLogout = (navigation) => {
    logout().then(() => {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Home" }],
        })
      )
    });
  };

  const { height, width } = Dimensions.get('window');

  var titleFont, buttonWidth, buttonHeight, buttonFont = moderateScale(25), iconSize = moderateScale(15);

  if (Platform.OS === 'web' && !isMobile) {
    titleFont = moderateScale(50)
    buttonHeight = height * 0.15
    buttonWidth = width * 0.25
  }
  else {
    titleFont = moderateScale(37)
    buttonHeight = height * 0.13
    buttonWidth = width * 0.45

  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden={false} translucent={true} />
      {/* <Text style={{ flexWrap: 'wrap', paddingTop: height * 0.03, backgroundColor: '#F8F8F8', }}></Text> */}
      <SafeAreaView style={styles(height, width).header}>
        <Text style={{ flexWrap: 'wrap', flex: 3 }}></Text>
        <Text style={{ flexWrap: 'wrap', flex: 10, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Perfil</Text>
        <Text style={{ flexWrap: 'wrap', flex: 1 }}></Text>
        <TouchableOpacity
          onPress={() => handleLogout(navigation)} style={{ flex: 2, alignItems: 'flex-start' }} >
          <Icon style={{ fontSize: iconSize, fontSize: titleFont, color: 'red' }} name="sign-out" />
        </TouchableOpacity>
      </SafeAreaView>




      <View style={styles(height, width).container} >
        <View style={{ alignItems: 'center', justifyContent: 'space-around', alignItems: 'center', }}>
          <Text style={styles(height, width).container3}>{nombre} {apellidos}</Text>

        </View>
        <Text style={{ flexWrap: 'wrap', paddingBottom: width * 0.06, }}></Text>
        <Text style={styles(height, width).container3}>Dni: {dni}</Text>
        <Text style={{ flexWrap: 'wrap', paddingBottom: width * 0.02, }}></Text>
        <Text style={styles(height, width).container3}>Medico: {medico}</Text>
        <Text style={{ flexWrap: 'wrap', paddingBottom: width * 0.02, }}></Text>
        <Text style={styles(height, width).container3}>Centro: {centro}</Text>
      </View>

      <View style={styles(height, width).container2}>
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
          onPress={() => { handleResetPassword(navigation) }}>
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: buttonFont, color: 'white' }}>
            Cambiar contraseña
          </Text>
        </TouchableOpacity>
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
            navigation.navigate("SolicitarCambios", { id: id })}>
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: buttonFont, color: 'white' }}>
            Solicitar cambios
          </Text>
        </TouchableOpacity>
      </View>


      <FooterPaciente item='perfil' navigation={navigation} id={id}></FooterPaciente>

    </View>
  );

};


export const styles = (height, width) => StyleSheet.create({
  container: {
    flex: 6,
    backgroundColor: '#fff',
    padding: width * 0.02,
    paddingLeft: width * 0.1,
    paddingRight: width * 0.1,
    alignItems: 'left',
  },
  container3: {
    fontFamily: 'Nunito',
    fontSize: moderateScale(25),
    borderRadius: 10,
  },
  container2: {
    flex: 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  header: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
  }
});


