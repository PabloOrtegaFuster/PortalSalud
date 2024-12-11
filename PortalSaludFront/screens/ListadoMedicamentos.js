import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Dimensions, SafeAreaView, StatusBar, Alert, Platform } from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';

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

export default function ListadoMedicamentos({ navigation, route }) {
  const { accion } = route.params;


  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]); 
  const [searchQuery, setSearchQuery] = useState('');



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

      var headers = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-refresh-token': refreshToken,
        }
      }


      const response = await axios.post(SERVER + 'medicamentos/listado', null, {
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


  const deleteMedicamento = async (id) => {
    try {
      const { accessToken, refreshToken } = await getTokens();
      Data = {
        id: id
      };

      const response = await axios.post(SERVER + 'medicamentos/borrar', Data, {
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
            "El medicamento ha sido eliminado con éxito."
          );
        } else {

          Alert.alert(
            "Medicamento Eliminado",
            "El medicamento ha sido eliminado con éxito.",
            [{ text: "OK" }]
          );
        }
      }
      else {
        if (Platform.OS === 'web') {
          window.alert(
            "Ocurrió un error al intentar borrar el medicamento. Inténtalo de nuevo."
          );
        } else {

          Alert.alert(
            "Error al Eliminar",
            "Ocurrió un error al intentar borrar el medicamento. Inténtalo de nuevo.",
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
      navigation.navigate("EditarMedicamento", { medicamento: item.id })
    }
    else if (accion == "eliminar") {
      if (Platform.OS === 'web') {
        const userConfirmed = window.confirm(
          "¿Estás seguro de que deseas eliminar el medicamento?"
        );
        if (userConfirmed) {
          deleteMedicamento(item.id);
        }
      }
      else {
        Alert.alert(
          "Eliminar medicamento",
          "¿Estás seguro de que deseas eliminar el medicamento?",
          [
            {
              text: "Cancelar",
              style: "cancel"
            },
            {
              text: "Eliminar",
              onPress: () => {
                deleteMedicamento(item.id);
              }
            }
          ],
          { cancelable: true }
        )
      }
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = items.filter((item) =>
      item.usuario.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredItems(filtered);
  };


  const { height, width } = Dimensions.get('window');
  

  var titleFont, buttonWidth, buttonHeight

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
      <SafeAreaView style={styles(height, width).header}>
        <Text style={{ flexWrap: 'wrap', flex: 1 }}></Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()} style={{ flex: 1, alignItems: 'flex-start' }} >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: '#24a0ed' }}>
            {"<"}
          </Text>
        </TouchableOpacity>
        <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Medicamentos</Text>
        <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
      </SafeAreaView>

      <View style={styles(height, width).container2}>
        <TextInput
          style={styles(height, width).searchInput}
          placeholder={"Buscar medicamento..."}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <View style={styles(height, width).container}>

        <ScrollView contentContainerStyle={styles(height, width).scrollContainer}
          showsVerticalScrollIndicator={false}>
          {filteredItems.length === 0 ? (
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', paddingTop: height * 0.2, fontSize: titleFont, color: 'black' }}>
              {"No hay medicamentos actualmente"}
            </Text>
          ) : (
            filteredItems.map((item, index) => (
              <View key={index} style={{ paddingTop: height * 0.05 }}>
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
                  onPress={() => handlePress(item)}
                >
                  <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
                    {item.nombre}
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
    flex: 7,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  container2: {
    flex: 1,
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
  searchInput: {
    height: moderateScale(40),
    width: moderateScale(150),
    fontFamily: 'Nunito',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
});


