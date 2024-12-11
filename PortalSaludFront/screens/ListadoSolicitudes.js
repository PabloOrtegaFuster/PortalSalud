import { useEffect, useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Dimensions,
  SafeAreaView, StatusBar, FlatList,
  Platform, ScrollView
} from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { moderateScale } from 'react-native-size-matters';


import { CommonActions, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER } from '@env';
import axios from 'axios';
import { getTokens, storeTokens, clearTokens } from '../components/TokenStorage'
import Footer from '../components/FooterAdministrador';

const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};

export default function ListadoSolicitudes({ navigation, route }) {
  const { tipo } = route.params;

  const [items, setItems] = useState([]);
  const isFocused = useIsFocused(); 


  useEffect(() => {

    const loadResources = async () => {
      await loadFonts();
      if (isFocused) {
        await fetchData();
      }
    };

    loadResources();
  }, [isFocused, route.params]);

  const fetchData = async () => {
    try {
      const { accessToken, refreshToken } = await getTokens();
      Data = {
        tipo: tipo
      };
      const response = await axios.post(SERVER + 'solicitudes/listado', Data, {
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

  var titleFont, textFont, buttonWidth, buttonHeight;

  if (Platform.OS === 'web' && !isMobile) {
    titleFont = moderateScale(50)
    textFont = moderateScale(20)
    buttonWidth = width * 0.35
    buttonHeight = height * 0.08
  }
  else {
    titleFont = moderateScale(37)
    textFont = moderateScale(23)
    buttonWidth = width * 0.4
    buttonHeight = height * 0.15
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden={false} translucent={true} />
      <SafeAreaView style={styles(height, width).header}>
        <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont }}>{tipo}s</Text>
      </SafeAreaView>


      <View style={styles(height, width).container}>

        <ScrollView contentContainerStyle={styles(height, width).scrollContainer}
          showsVerticalScrollIndicator={false}>
          {items.length === 0 ? (
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', paddingTop: height * 0.2, fontSize: textFont, color: 'black' }}>
              {"No hay solicitudes actualmente"}
            </Text>
          ) : (
            items.map((item, index) => (
              <View key={index} style={{ paddingTop: height * 0.05 }}>
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
                  onPress={() => navigation.navigate("Solicitud", { id: item.id, usuario: item.usuario, accion: tipo })}
                >
                  <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'white' }}>
                    {item.nombre}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <View style={styles(height, width).container2}>
          
      {tipo != "Rechazada" && (
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
          onPress={() => navigation.navigate("ListadoSolicitudes", { tipo: "Rechazada" })}  >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'white' }}>
            Solicitudes rechazadas
          </Text>
        </TouchableOpacity>)}
        {tipo != "Pendiente" && (
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
          onPress={() => navigation.navigate("ListadoSolicitudes", { tipo: "Pendiente" })}  >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'white' }}>
            Solicitudes pendientes
          </Text>
        </TouchableOpacity>)}
        {tipo != "Aprobada" && (
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
          onPress={() => navigation.navigate("ListadoSolicitudes", { tipo: "Aprobada" })}  >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'white' }}>
            Solicitudes aceptadas
          </Text>
        </TouchableOpacity>)}
      </View>
      <Footer item='solicitudes' navigation={navigation}></Footer>

    </View>

  );

};


export const styles = (height, width) => StyleSheet.create({
  container: {
    flex: 6,
    backgroundColor: '#fff',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',

  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
});


