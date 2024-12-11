import { useEffect, useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Dimensions,
  SafeAreaView, StatusBar, FlatList,
  Platform
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';

import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER } from '@env';
import axios from 'axios';
import { getTokens, storeTokens, clearTokens } from '../components/TokenStorage'
import FooterPaciente from '../components/FooterPaciente';
import FooterMedico from '../components/FooterMedico';

const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};

export default function ListadoRecetas({ navigation, route }) {
  const { id, medico, tipo } = route.params;

  const [items, setItems] = useState([]);




  useEffect(() => {
    const loadResources = async () => {
      await loadFonts();

    };

    loadResources();
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { accessToken, refreshToken } = await getTokens();
      Data = {
        id: id
      };

      const response = await axios.post(SERVER + 'recetas/listado', Data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-refresh-token': refreshToken,
        }
      })
      setItems(response.data.lista);

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
  

  var titleFont, buttonWidth1, buttonWidth2, buttonHeight = height * 0.15

  if (Platform.OS === 'web' && !isMobile) {
    titleFont = moderateScale(50)
    buttonWidth1 = width * 0.4
    if (tipo === "Medico") {

      buttonWidth2 = width * 0.40
    }
    else {

      buttonWidth2 = width * 0.5
    }
  }
  else {
    titleFont = moderateScale(30)
    buttonWidth1 = width * 0.85
    if (tipo === "Medico") {

      buttonWidth2 = width * 0.40
    }
    else {

      buttonWidth2 = width * 0.85
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden={false} translucent={true} />
      {tipo === "Paciente" &&
        (<SafeAreaView style={styles(height, width).header}>
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont }}>Recetas</Text>
        </SafeAreaView>)}
      {tipo === "Medico" &&
        (<SafeAreaView style={styles(height, width).header}>
          <Text style={{ flexWrap: 'wrap', flex: 1 }}></Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()} style={{ flex: 1, alignItems: 'flex-start' }} >
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: '#24a0ed' }}>
              {"<"}
            </Text>
          </TouchableOpacity>
          <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Recetas</Text>
          <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
        </SafeAreaView>)}

      <View style={styles(height, width).container}>


        <FlatList showsVerticalScrollIndicator={false}

          data={items}
          ListEmptyComponent={() => (
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', paddingTop: height * 0.2, fontSize: titleFont, color: 'black' }}>
              No tienes recetas actualmente
            </Text>
          )}
          contentContainerStyle={{ flexGrow: 1 }}
          renderItem={({ item }) => {
            return (
              <View style={{ paddingTop: height * 0.05 }}>
                <TouchableOpacity
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    elevation: 8,
                    backgroundColor: '#585c64',
                    borderRadius: 10,
                    height: buttonHeight,
                    width: buttonWidth1,

                  }}
                  onPress={() => navigation.navigate("DetalleReceta", { id: id, receta: item.id_receta, medico: medico, tipo: tipo, eliminar: "Si" })}  >
                  <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont* 0.8, color: 'white' }}>
                    {item.nombre}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }}
        />

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
            width: buttonWidth2,
          }}
          onPress={() => navigation.navigate("ListadoRecetasExpiradas", { id: id, medico: medico, tipo: tipo })}  >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont* 0.8, color: 'white' }}>
            Recetas caducadas
          </Text>
        </TouchableOpacity>
        {tipo === "Medico" && (
          <TouchableOpacity
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 8,
              backgroundColor: '#24a0ed',
              borderRadius: 10,
              height: buttonHeight,
              width: buttonWidth2,
            }}
            onPress={() => navigation.navigate("CrearReceta", { id: id, medico: medico })}  >
            <Text style={{ justifyContent: 'center', flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont* 0.8 , color: 'white' }}>
              Crear receta
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
    </View>

  );

};


export const styles = (height, width) => StyleSheet.create({
  container: {
    flex: 6,
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
  container2: {
    flex: 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});


