import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, KeyboardAvoidingView, Dimensions, TextInput, ScrollView, Alert, SafeAreaView, StatusBar, Platform } from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';

import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getTokens, storeTokens, clearTokens } from '../components/TokenStorage';
import { SERVER } from '@env';
import { moderateScale } from 'react-native-size-matters';

const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};



export default function EditarMedicamento({ navigation, route }) {

  const { medicamento } = route.params;

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prospecto, setProspecto] = useState("");
  const [errors, setErrors] = useState("");


  const validacion = () => {
    let errors = {};

    if (!nombre) errors.nombre = "El nombre es necesario.";
    if (!descripcion) errors.descripcion = "La descripción es necesaria.";
    if (!prospecto) errors.prospecto = "La prospecto es necesaria.";

    setErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleRegistro(navigation) {
    try {
      if (validacion()) {

        const { accessToken, refreshToken } = await getTokens();

        var Data = {
          id: medicamento,
          nombre: nombre,
          descripcion: descripcion,
          prospecto: prospecto
        };

        
        const response = await axios.post(SERVER + 'medicamentos/modificar', Data, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-refresh-token': refreshToken,
          }
        })
        

        if (response.data.accessToken && response.data.refreshToken) {
          storeTokens(response.data.accessToken, response.data.refreshToken);
        }

        if (response.data.success) {
          if (Platform.OS === 'web') {
            window.alert(
              "El medicamento ha sido modificado con éxito."
            );
          } else {

            Alert.alert(
              "Medicamento Modificado",
              "El medicamento ha sido modificado con éxito.",
              [{ text: "OK" }]
            );
          }
        }
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
        id: medicamento
      };

      const response = await axios.post(SERVER + 'medicamentos/detalle', Data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-refresh-token': refreshToken,
        }
      })
      
      setNombre(response.data.nombre)
      setDescripcion(response.data.descripcion)
      setProspecto(response.data.prospecto)

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




  const { height, width } = Dimensions.get('window');


  var titleFont, textFont, buttonWidth, buttonHeight, windowWidth;

  if (Platform.OS === 'web' && !isMobile) {
    titleFont = moderateScale(50)
    textFont = moderateScale(20)
    buttonWidth = width * 0.35
    buttonHeight = height * 0.1
    windowWidth = width * 0.8
  }
  else {
    titleFont = moderateScale(37)
    textFont = 20
    buttonWidth = width * 0.8
    buttonHeight = height * 0.1
    windowWidth = width * 0.9
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden={false} translucent={true} />
      <SafeAreaView style={styles(height, width).header}>
        <Text style={{ flexWrap: 'wrap', flex: 1 }}></Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()} style={{ flex: 1, alignItems: 'flex-start' }} >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: '#24a0ed' }}>
            {"<"}
          </Text>
        </TouchableOpacity>
        <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Modificar medicamento</Text>
        <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
      </SafeAreaView>

      <View style={styles(height, width).container}>

        <ScrollView style={{ width: windowWidth }} showsVerticalScrollIndicator={false}>

          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.03, paddingBottom: height * 0.03 }}>Nombre:</Text>
          <TextInput
            style={{
              fontFamily: 'Nunito',
              fontSize: textFont,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#E3E3E3',
              borderRadius: 10,
              height: height * 0.05,
              width: windowWidth,
            }} value={nombre} onChangeText={setNombre} />
          {
            errors.nombre ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.nombre}</Text> : null
          }

          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.03, paddingBottom: height * 0.03 }}>Descripción:</Text>
          <TextInput
            style={{
              fontFamily: 'Nunito',
              fontSize: textFont,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#E3E3E3',
              borderRadius: 10,
              height: height * 0.05,
              width: windowWidth,
            }} value={descripcion} onChangeText={setDescripcion} />
          {
            errors.descripcion ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.descripcion}</Text> : null
          }

          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.03, paddingBottom: height * 0.03 }}>Prospecto:</Text>
          <TextInput
            style={{
              fontFamily: 'Nunito',
              fontSize: textFont,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#E3E3E3',
              borderRadius: 10,
              height: height * 0.05,
              width: windowWidth,
            }} value={prospecto} onChangeText={setProspecto} />
          {
            errors.prospecto ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.prospecto}</Text> : null
          }

        </ScrollView>


      </View>


      <View style={styles(height, width).container2}>

        <Text style={{}}></Text>
        <TouchableOpacity
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 8,
            backgroundColor: '#24a0ed',
            borderRadius: 10,
            height: height * 0.15,
            width: width * 0.7,
          }}
          onPress={() => handleRegistro(navigation)}  >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
            Modificar medicamento
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const styles = (height, width) => StyleSheet.create({
  container: {
    flex: 7,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  container2: {
    flex: 2,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  header: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',

  },
});
