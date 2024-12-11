import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, KeyboardAvoidingView, Dimensions, TextInput, ScrollView, Alert, SafeAreaView, StatusBar, Platform } from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import Footer from '../components/FooterPaciente';
import { getTokens, storeTokens, clearTokens } from '../components/TokenStorage';

import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';



import axios from 'axios';
import { SERVER } from '@env';
import { moderateScale } from 'react-native-size-matters';

const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};



export default function SolicitarCambios({ navigation, route }) {

  const { id } = route.params;

  const [cambios, setCambios] = useState("");


  const [errors, setErrors] = useState("");

  const validacion = () => {
    let errors = {};

    if (!cambios) errors.cambios = "No has introducido datos.";

    setErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleRegistro(navigation) {
    try {
      if (validacion()) {

        const { accessToken, refreshToken } = await getTokens();

        var Data = {
          id: id,
          cambios: cambios,
        };

        const response = await axios.post(SERVER + 'solicitudes/crear', Data, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-refresh-token': refreshToken,
          }
        })


        if (response.data.accessToken && response.data.refreshToken) {
          storeTokens(response.data.accessToken, response.data.refreshToken);
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
    };
    loadResources();

  }, []);


  const { height, width } = Dimensions.get('window');


  var titleFont, textFont, buttonWidth, buttonHeight, textInputWidth, textInpuHeight;

  if (Platform.OS === 'web' && !isMobile) {
    titleFont = moderateScale(50)
    textFont = moderateScale(20)
    buttonWidth = width * 0.35
    buttonHeight = height * 0.1
    textInputWidth = width * 0.8
    textInpuHeight = width * 0.3
  }
  else {
    titleFont = moderateScale(37)
    textFont = moderateScale(23)
    buttonWidth = width * 0.8
    buttonHeight = height * 0.1
    textInputWidth = width * 0.9
    textInpuHeight = width * 0.8
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
        <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Solicitud</Text>
        <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
      </SafeAreaView>

      <View style={styles(height, width).container}>

        <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.03, paddingBottom: height * 0.03 }}>Introduce los cambios a modificar y las causas:</Text>
        <TextInput
          multiline={true}
          textAlignVertical='top'
          style={{
            fontFamily: 'Nunito',
            fontSize: textFont,
            backgroundColor: '#E3E3E3',
            borderRadius: 10,
            height: textInpuHeight,
            width: textInputWidth,
          }} value={cambios} onChangeText={setCambios} />
        {
          errors.cambios ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.cambios}</Text> : null
        }



      </View>


      <View style={styles(height, width).container2}>
        <TouchableOpacity
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 8,
            backgroundColor: '#24a0ed',
            borderRadius: 10,
            height: height * 0.15,
            width: buttonWidth,
          }}
          onPress={() => handleRegistro(navigation)}  >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
            Enviar solicitud
          </Text>
        </TouchableOpacity>
      </View>

      <Footer item='perfil' navigation={navigation}></Footer>
    </View>
  );
};

export const styles = (height, width) => StyleSheet.create({
  container: {
    flex: 6,
    backgroundColor: '#fff',
    paddingRight: width * 0.05,
    paddingLeft: width * 0.05,
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
