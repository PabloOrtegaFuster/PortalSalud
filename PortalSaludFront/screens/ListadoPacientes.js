import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Dimensions, SafeAreaView, StatusBar, FlatList, Platform } from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';

import { SERVER } from '@env';
import axios from 'axios';
import { getTokens, storeTokens, clearTokens } from '../components/TokenStorage'
import Footer from '../components/FooterMedico';
import { moderateScale } from 'react-native-size-matters';

const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};

export default function ListadoPacientes({ navigation, route }) {
  const { id } = route.params;


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
      Data = {
        id: id
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
        <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont }}>Pacientes</Text>
      </SafeAreaView>

      <View style={styles(height, width).container2}>
        <TextInput
          style={styles(height, width).searchInput}
          placeholder="Buscar paciente..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <View style={styles(height, width).container}>

        {/* Lista de pacientes */}
        <ScrollView contentContainerStyle={styles(height, width).scrollContainer}
          showsVerticalScrollIndicator={false}>
          {filteredItems.length === 0 ? (
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', paddingTop: height * 0.2, fontSize: titleFont, color: 'black' }}>
              No tienes pacientes actualmente
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
                  onPress={() => navigation.navigate("Paciente", { id: id, paciente: item.id })}
                >
                  <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
                    {item.usuario}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <Footer item='pacientes' navigation={navigation} id={id}></Footer>
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


