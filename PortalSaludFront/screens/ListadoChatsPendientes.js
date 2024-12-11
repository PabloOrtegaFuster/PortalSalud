import { useRef, useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Dimensions,
  ActivityIndicator, SafeAreaView, StatusBar,
  FlatList, Platform
} from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { SERVER } from '@env';
import axios from 'axios';
import { getTokens, storeTokens, clearTokens } from '../components/TokenStorage'
import { useIsFocused } from '@react-navigation/native';
import Footer from '../components/FooterMedico';
import { moderateScale } from 'react-native-size-matters';

import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, orderBy, query, onSnapshot, where, getDocs } from "firebase/firestore"
import { database } from "../config/firebase"


const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};

export default function ListadoChats({ navigation, route }) {

  const { id } = route.params;


  const [items, setItems] = useState([]);
  const [conversaciones, setConversaciones] = useState([])
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

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

  const fetchChats = async () => {
    try {
      const chatsList = [];
      const chatsQuery = await query(
        collection(database, 'conversaciones'),
        where('medico', '==', id),
        where('ultimoRemitente', '!=', id),
        orderBy('updatedAt', 'desc') 
      );


      const querySnapshot = await getDocs(chatsQuery);


      querySnapshot.forEach((doc) => {
        chatsList.push({ id: doc.id, ...doc.data() }); 
      });



      setConversaciones(chatsList);
    } catch (err) {
      console.error("Error al recuperar los chats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadResources = async () => {
      await loadFonts();
      await fetchData();

      await fetchChats();
    };

    if (isFocused) {
      loadResources();
    }

  }, [isFocused]);



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
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
      {/* <Text style={{ flexWrap: 'wrap', paddingTop: height * 0.03, backgroundColor: '#F8F8F8', }}></Text> */}
      <SafeAreaView style={styles.header}>
        <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont }}>Chats pendientes</Text>
      </SafeAreaView>

      <View style={styles.container}>

        <FlatList showsVerticalScrollIndicator={false}
          data={conversaciones}
          ListEmptyComponent={() => (
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', paddingTop: height * 0.2, fontSize: titleFont, color: 'black' }}>
              No tienes conversaciones pendientes
            </Text>
          )}
          contentContainerStyle={{ flexGrow: 1 }}
          renderItem={({ item }) => {
            const paciente = items.find((x) => x.id === item.paciente);
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
                  onPress={() => navigation.navigate("Chat", { id1: id, id2: item.paciente, conversacionId: item.id, tipo: "Medico" })}  >
                  <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
                    {paciente.usuario}
                  </Text>
                  <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
                    {item.titulo}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }}
        />
      </View>

      <Footer item='pendientes' navigation={navigation} id={id}></Footer>

    </View>

  );

};


const styles = StyleSheet.create({
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


