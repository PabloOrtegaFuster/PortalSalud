import { useEffect, useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Dimensions,
  SafeAreaView, StatusBar,
  Platform
} from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { moderateScale } from 'react-native-size-matters';



import Footer from '../components/FooterMedico';

const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};

export default function ListadoCitas({ navigation, route }) {
  const { id, paciente } = route.params;


  useEffect(() => {

    const loadResources = async () => {
      await loadFonts();
    };

    loadResources();
  }, []);


  const { height, width } = Dimensions.get('window');

  var titleFont, buttonWidth, buttonHeight;

  if (Platform.OS === 'web' && !isMobile) {
    titleFont = moderateScale(40)
    buttonWidth = width * 0.35
    buttonHeight = height * 0.1
  }
  else {
    titleFont = moderateScale(37)
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
        <Text style={{ flexWrap: 'wrap', flex: 1 }}></Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()} style={{ flex: 1, alignItems: 'flex-start' }} >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: '#24a0ed' }}>
            {"<"}
          </Text>
        </TouchableOpacity>
        <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Paciente</Text>
        <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
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
              height: height * 0.13,
              width: width * 0.9,

            }}
            onPress={() => navigation.navigate("ListadoRecetas", { id: paciente, medico: id, tipo: "Medico" })}  >
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
              Recetas
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
              height: height * 0.13,
              width: width * 0.9,

            }}
            onPress={() => navigation.navigate("ListadoCitas", { id: paciente, medico: id, tipo: "Medico" })}  >
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
              Citas
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
              height: height * 0.13,
              width: width * 0.9,

            }}
            onPress={() => navigation.navigate("ListadoChats", { id1: id, id2: paciente, tipo: "Medico" })}  >
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
              Conversaciones
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
        </View>
      </View>
      <Footer item='pacientes' navigation={navigation} id={id}></Footer>


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

  },
});


