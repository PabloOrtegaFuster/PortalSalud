import { useEffect, useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Dimensions,
  SafeAreaView, StatusBar, FlatList,
  Platform
} from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { moderateScale } from 'react-native-size-matters';


import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER } from '@env';
import axios from 'axios';
import { getTokens, storeTokens, clearTokens } from '../components/TokenStorage'
import FooterPaciente from '../components/FooterPaciente';
import FooterMedico from '../components/FooterMedico';
import { useIsFocused } from '@react-navigation/native';

const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};

export default function ListadoCitas({ navigation, route }) {
  const { id, medico, tipo } = route.params;

  const [items, setItems] = useState([]);
  const isFocused = useIsFocused(); 





  useEffect(() => {
    if (isFocused) {
      fetchData();
    }

    const loadResources = async () => {
      await loadFonts();
    };

    loadResources();
  }, [isFocused]);

  const fetchData = async () => {
    try {
      const { accessToken, refreshToken } = await getTokens();
      Data = {
        id: id
      };
      const response = await axios.post(SERVER + 'citas/listado', Data, {
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
      {tipo === "Paciente" &&
        (<SafeAreaView style={styles(height, width).header}>
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont }}>Citas</Text>
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
          <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Citas</Text>
          <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
        </SafeAreaView>)}

      <View style={styles(height, width).container}>

        <FlatList showsVerticalScrollIndicator={false}
          data={items}
          ListEmptyComponent={() => (
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', paddingTop: height * 0.2, fontSize: titleFont, color: 'black' }}>
              No tienes citas actualmente
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
                    height: height * 0.13,
                    width: width * 0.9,

                  }}
                  onPress={() => navigation.navigate("DetalleCita", { id: id, cita: item.id, tipo: tipo })}  >
                  <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
                    {item.fecha_hora}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }}
        />
        {tipo === "Paciente" &&
          (<View style={{
            paddingTop: height * 0.05, paddingBottom: height * 0.05
          }}>
            <TouchableOpacity
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 8,
                backgroundColor: '#24a0ed',
                borderRadius: 10,
                height: height * 0.13,
                width: width * 0.85,
              }}
              onPress={() => navigation.navigate("SolicitarCita", { id: id })}  >
              <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
                Solicitar cita
              </Text>
            </TouchableOpacity>
          </View>)}

      </View>
      {tipo === "Paciente" && (
        <FooterPaciente item='citas' navigation={navigation} id={id}></FooterPaciente>
      )}
      {tipo === "Medico" && (
        <FooterMedico item='pacientes' navigation={navigation} id={medico}></FooterMedico>
      )}
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


