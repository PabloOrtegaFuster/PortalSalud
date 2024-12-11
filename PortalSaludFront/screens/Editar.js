import { useEffect, useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Dimensions,
  SafeAreaView, StatusBar,
  Platform
} from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { moderateScale } from 'react-native-size-matters';


import Footer from '../components/FooterAdministrador';

const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};

export default function Editar({ navigation }) {

  useEffect(() => {

    const loadResources = async () => {
      await loadFonts();
    };

    loadResources();
  }, []);


  const { height, width } = Dimensions.get('window');

  var titleFont, textFont, buttonWidth, buttonHeight;

  if (Platform.OS === 'web' && !isMobile) {
    titleFont = moderateScale(40)
    textFont = moderateScale(20)
    buttonWidth = width * 0.6
    buttonHeight = height * 0.1
  }
  else {
    titleFont = moderateScale(37)
    textFont = moderateScale(20)
    buttonWidth = width * 0.8
    buttonHeight = height * 0.1
  }


  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden={false} translucent={true} />
      {/* <Text style={{ flexWrap: 'wrap', paddingTop: height * 0.03, backgroundColor: '#F8F8F8', }}></Text> */}
      {/* <SafeAreaView style={styles(height, width).header}>
        <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont }}>Paciente</Text>
      </SafeAreaView> */}

      <SafeAreaView style={styles(height, width).header}>
        <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Modificar</Text>

      </SafeAreaView>

      <View style={styles(height, width).container}>

        <View style={{ flex: 1 }}>
        </View>
        <View style={{ flex: 2 }}>
          <TouchableOpacity
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 8,
              backgroundColor: '#585c64',
              borderRadius: 10,
              height: buttonHeight,
              width: buttonWidth,

            }}
            onPress={() => navigation.navigate("ListadoUsuariosAdministrador", { tipo: "Paciente", accion: "modificar" })}  >
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'white' }}>
              Paciente
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 2 }}>
          <TouchableOpacity
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 8,
              backgroundColor: '#585c64',
              borderRadius: 10,
              height: buttonHeight,
              width: buttonWidth,

            }}
            onPress={() => navigation.navigate("ListadoUsuariosAdministrador", { tipo: "Medico", accion: "modificar" })}  >
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'white' }}>
              Medico
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 2 }}>
          <TouchableOpacity
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 8,
              backgroundColor: '#585c64',
              borderRadius: 10,
              height: buttonHeight,
              width: buttonWidth,

            }}
            onPress={() => navigation.navigate("ListadoUsuariosAdministrador", { tipo: "Administrador", accion: "modificar" })}  >
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'white' }}>
              Administrador
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 2 }}>
          <TouchableOpacity
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 8,
              backgroundColor: '#585c64',
              borderRadius: 10,
              height: buttonHeight,
              width: buttonWidth,

            }}
            onPress={() => navigation.navigate("ListadoCentros", { accion: "modificar" })}  >
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'white' }}>
              Centro
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 2 }}>
          <TouchableOpacity
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 8,
              backgroundColor: '#585c64',
              borderRadius: 10,
              height: buttonHeight,
              width: buttonWidth,

            }}
            onPress={() => navigation.navigate("ListadoMedicamentos", { accion: "modificar" })}  >
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'white' }}>
              Medicamento
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
        </View>
      </View>

      <Footer item='modificar' navigation={navigation}></Footer>


    </View>

  );

};


export const styles = (height, width) => StyleSheet.create({
  container: {
    flex: 8,
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

  }
});


