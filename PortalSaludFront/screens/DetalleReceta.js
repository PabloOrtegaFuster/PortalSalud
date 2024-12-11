import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, SafeAreaView, StatusBar, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { SERVER } from '@env';
import axios from 'axios';
import { getTokens, storeTokens, clearTokens } from '../components/TokenStorage'
import FooterPaciente from '../components/FooterPaciente';
import FooterMedico from '../components/FooterMedico';
import { moderateScale } from 'react-native-size-matters';

import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};

export default function DetalleReceta({ navigation, route }) {
  const { id, receta, medico, tipo, eliminar } = route.params;
  const [medicamento, setMedicamento] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prospecto, setProspecto] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [horas, setHoras] = useState("");




  useEffect(() => {
    const loadResources = async () => {
      await loadFonts();

    };

    loadResources();
    fetchData();


  }, []);

  const abrirEnlaceExterno = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error(`No se puede abrir el enlace: ${url}`);
      }
    } catch (error) {
      console.error('Error al intentar abrir el enlace: ', error);
    }
  };

  const abrirEnlace = () => {
    abrirEnlaceExterno(prospecto);
  };

  const fetchData = async () => {
    try {
      const { accessToken, refreshToken } = await getTokens();
      Data = {
        id: receta
      };

      const response = await axios.post(SERVER + 'recetas/detalle', Data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-refresh-token': refreshToken,
        }
      })
      

      setMedicamento(response.data.nombre);
      setDescripcion(response.data.descripcion);
      setProspecto(response.data.prospecto);
      setFechaInicio(response.data.fecha_inicio);
      setFechaFin(response.data.fecha_fin);
      setHoras(response.data.horas);

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

  async function eliminarReceta() {
    try {
      const { accessToken, refreshToken } = await getTokens();
      Data = {
        id: receta
      };
      const response = await axios.post(SERVER + 'recetas/borrar', Data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-refresh-token': refreshToken,
        }
      })
      if (response.data.accessToken && response.data.refreshToken) {
        storeTokens(response.data.accessToken, response.data.refreshToken);
      }

      if (response.data.success) {
        navigation.goBack();
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

  const { height, width } = Dimensions.get('window');

  var titleFont, textFont, buttonWidth, buttonHeight, paddingBottom = height * 0.04;

  if (Platform.OS === 'web' && !isMobile) {
    titleFont = moderateScale(40)
    textFont = moderateScale(20)
    buttonWidth = width * 0.35
    buttonHeight = height * 0.1
  }
  else {
    titleFont = moderateScale(37)
    textFont = moderateScale(25)
    buttonHeight = height * 0.13
    paddingBottom = height * 0.01
    if (tipo === "Medico") {
      buttonWidth = width * 0.45
    }
    else {
      buttonWidth = width * 0.85
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior='height' enabled={false}>
      {/* <Text style={{ flexWrap: 'wrap', paddingTop: height * 0.03, backgroundColor: '#F8F8F8', }}></Text> */}
      <SafeAreaView style={styles(height, width).header}>
        <Text style={{ flexWrap: 'wrap', flex: 1 }}></Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()} style={{ flex: 1, alignItems: 'flex-start' }} >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: '#24a0ed' }}>
            {"<"}
          </Text>
        </TouchableOpacity>
        <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Detalle Receta</Text>
        <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
      </SafeAreaView>


      <View style={styles(height, width).container} >
        <Text style={[styles(height, width).container3, { fontSize: textFont }]}>Medicamento: {medicamento}</Text>
        <Text style={{ flexWrap: 'wrap', paddingBottom: paddingBottom, }}></Text>
        <Text style={[styles(height, width).container3, { fontSize: textFont }]}>Descripcion: {descripcion}</Text>
        <Text style={{ flexWrap: 'wrap', paddingBottom: paddingBottom, }}></Text>
        <Text style={[styles(height, width).container3, { fontSize: textFont }]}>Fecha inicio: {fechaInicio}</Text>
        <Text style={{ flexWrap: 'wrap', paddingBottom: paddingBottom, }}></Text>
        <Text style={[styles(height, width).container3, { fontSize: textFont }]}>Fecha fin: {fechaFin}</Text>
        <Text style={{ flexWrap: 'wrap', paddingBottom: paddingBottom, }}></Text>
        <Text style={[styles(height, width).container3, { fontSize: textFont }]}>Intervalo: cada {horas} horas</Text>
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
          onPress={() => { abrirEnlace() }}>
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
            Prospecto
          </Text>
        </TouchableOpacity>
        {tipo === "Medico" && eliminar != undefined && (
          <TouchableOpacity
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 8,
              backgroundColor: 'red',
              borderRadius: 10,
              height: buttonHeight,
              width: buttonWidth,
            }}
            onPress={() => eliminarReceta()}>
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
              Eliminar recetas
            </Text>
          </TouchableOpacity>
        )}
      </View>


      {tipo === "Paciente" && (
        <FooterPaciente item='recetas' navigation={navigation} id={id}></FooterPaciente>
      )}
      {tipo === "Medico" && (
        <FooterMedico item='pacientes' navigation={navigation} id={medico}></FooterMedico>
      )}
    </KeyboardAvoidingView>
  );

};


export const styles = (height, width) => StyleSheet.create({
  container: {
    flex: 5,
    backgroundColor: '#fff',
    padding: width * 0.05,
  },
  container3: {
    fontFamily: 'Nunito',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
  },
  container2: {
    flex: 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
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


