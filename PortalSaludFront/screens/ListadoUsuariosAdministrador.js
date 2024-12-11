import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, Dimensions, SafeAreaView, StatusBar, FlatList, Platform } from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { CommonActions, useFocusEffect } from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER } from '@env';
import axios from 'axios';
import { getTokens, storeTokens, clearTokens } from '../components/TokenStorage'
import Footer from '../components/FooterAdministrador';
import { moderateScale } from 'react-native-size-matters';

const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};

export default function ListadoUsuariosAdministrador({ navigation, route }) {
  const { tipo, accion } = route.params;


  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');



  useEffect(() => {
    const loadResources = async () => {
      await loadFonts();
    };

    loadResources();


  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      const { accessToken, refreshToken } = await getTokens();

      Data = {
        tipo: tipo
      };
      const response = await axios.post(SERVER + 'users/listado', Data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-refresh-token': refreshToken,
        }
      })
      setItems(response.data.lista)
      setFilteredItems(response.data.lista);

      if (response.data.accessToken && response.data.refreshToken) {
        storeTokens(response.data.accessToken, response.data.refreshToken);
      }

    } catch (error) {
      console.error('Error al enviar la solicitud:', error.message);
      if (error.response && error.response.status === 403) {
       await AsyncStorage.removeItem('userData');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Home" }],
          })
        )
      }
    }
  }

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = items.filter((item) =>
      item.usuario.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  const deleteUsuario = async (id) => {
    try {
      const { accessToken, refreshToken } = await getTokens();
      Data = {
        id: id
      };

      const response = await axios.post(SERVER + 'users/borrar', Data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-refresh-token': refreshToken,
        }
      })

      if (response.data.accessToken && response.data.refreshToken) {
        storeTokens(response.data.accessToken, response.data.refreshToken);
      }

      if (response.data.success) {
        await fetchData()


        if (Platform.OS === 'web') {
          window.alert(
            "El usuario ha sido eliminado con éxito."
          );
        } else {

          Alert.alert(
            "Usuario Eliminado",
            "El usuario ha sido eliminado con éxito.",
            [{ text: "OK" }]
          );
        }
        const userData = JSON.parse(await AsyncStorage.getItem('userData'));
   
        if (id == userData.id) {

          await AsyncStorage.removeItem('userData');
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Home" }],
            })
          )

        }
      }
      else {
        if (Platform.OS === 'web') {
          window.alert(
            "Ocurrió un error al intentar borrar el usuario. Inténtalo de nuevo."
          );
        } else {

          Alert.alert(
            "Error al Eliminar",
            "Ocurrió un error al intentar borrar el usuario. Inténtalo de nuevo.",
            [{ text: "OK" }]
          );
        }
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

  const handlePress = (item) => {
    if (accion == "modificar") {

      navigation.navigate("EditarUsuario", { usuario: item.id, tipo: tipo })
    }
    else if (accion == "eliminar") {
      if (Platform.OS === 'web') {
        const userConfirmed = window.confirm(
          "¿Estás seguro de que deseas eliminar el usuario?"
        );
        if (userConfirmed) {
          deleteUsuario(item.id);
        }
      }
      else {
        Alert.alert(
          "Eliminar usuario",
          "¿Estás seguro de que deseas eliminar el usuario?",
          [
            {
              text: "Cancelar",
              style: "cancel"
            },
            {
              text: "Eliminar",
              onPress: () => {
                deleteUsuario(item.id);
              }
            }
          ],
          { cancelable: true }
        )
      }
    }
  };

  const { height, width } = Dimensions.get('window');

  var titleFont, textFont, buttonWidth, buttonHeight

  if (Platform.OS === 'web' && !isMobile) {
    titleFont = moderateScale(40)
    buttonWidth = width * 0.7
    buttonHeight = height * 0.08
  }
  else {
    titleFont = moderateScale(37)
    buttonWidth = width * 0.8
    buttonHeight = height * 0.1
  }

  textFont = moderateScale(20)

  var titleText, placeHolderText, sinUsuarios;

  if (tipo === "Medico") {
    titleText = "Medicos";
    placeHolderText = "Buscar medico...";
    sinUsuarios = "No hay medicos actualmente"
  }
  else if (tipo === "Paciente") {
    titleText = "Pacientes";

    placeHolderText = "Buscar paciente...";
    sinUsuarios = "No hay pacientes actualmente"
  }
  else if (tipo === "Administrador") {
    titleText = "Administradores";

    placeHolderText = "Buscar administrador...";
    sinUsuarios = "No hay administradores actualmente"
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden={false} translucent={true} />
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles(height, width).header}>
        <Text style={{ flexWrap: 'wrap', flex: 1 }}></Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()} style={{ flex: 1, alignItems: 'flex-start' }} >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: '#24a0ed' }}>
            {"<"}
          </Text>
        </TouchableOpacity>
        <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>{titleText}</Text>
        <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
      </SafeAreaView>

      <View style={styles(height, width).container2}>
        <TextInput
          style={{
            height: buttonHeight,
            width: buttonWidth,
            fontSize: moderateScale(20),
            fontFamily: 'Nunito',
            borderColor: 'gray',
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            backgroundColor: 'white'
          }}

          placeholder={placeHolderText}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <View style={styles(height, width).container}>

        <ScrollView contentContainerStyle={styles(height, width).scrollContainer}
          showsVerticalScrollIndicator={false}>
          {filteredItems.length === 0 ? (
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'black' }}>
              {sinUsuarios}
            </Text>
          ) : (
            filteredItems.map((item, index) => (
              <View key={index} style={{ paddingBottom: height * 0.05 }}>
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
                  onPress={() => handlePress(item)}
                >
                  <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'white' }}>
                    {item.usuario}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <Footer item={accion} navigation={navigation}></Footer>
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
    justifyContent: 'center',
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


