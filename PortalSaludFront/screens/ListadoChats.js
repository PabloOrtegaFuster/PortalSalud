import { useRef, useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Dimensions,
  ActivityIndicator, SafeAreaView, StatusBar,
  FlatList, Platform
} from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { moderateScale } from 'react-native-size-matters';


import FooterPaciente from '../components/FooterPaciente';
import FooterMedico from '../components/FooterMedico';
import { useIsFocused } from '@react-navigation/native';

import { collection, orderBy, query, onSnapshot, where, getDocs } from "firebase/firestore"
import { database } from "../config/firebase"


const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};

export default function ListadoChats({ navigation, route }) {

  const { id1, id2, tipo } = route.params;

  const [conversaciones, setConversaciones] = useState([])
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();


  const fetchChats = async () => {
    try {
      const chatsList = [];
      if (tipo == "Paciente") {
        const chatsQuery = query(
          collection(database, 'conversaciones'),
          where('paciente', '==', id1),
          where('medico', '==', id2),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(chatsQuery);


        querySnapshot.forEach((doc) => {
          chatsList.push({ id: doc.id, ...doc.data() });
        });
      }
      else if (tipo == "Medico") {
        const chatsQuery = query(
          collection(database, 'conversaciones'),
          where('paciente', '==', id2),
          where('medico', '==', id1),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(chatsQuery);


        querySnapshot.forEach((doc) => {
          chatsList.push({ id: doc.id, ...doc.data() });
        });
      }


      setConversaciones(chatsList); 
    } catch (err) {
      console.error("Error al recuperar los chats:", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (isFocused) {
      fetchChats();
    }
    const loadResources = async () => {
      await loadFonts();
    };




    loadResources();
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
      {tipo === "Paciente" &&
        (<SafeAreaView style={styles(height, width).header}>
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont }}>Conversaciones</Text>
        </SafeAreaView>)}

      {tipo === "Medico" && (<SafeAreaView style={styles(height, width).header}>
        <Text style={{ flexWrap: 'wrap', flex: 1 }}></Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()} style={{ flex: 1, alignItems: 'flex-start' }} >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: '#24a0ed' }}>
            {"<"}
          </Text>
        </TouchableOpacity>
        <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Conversaciones</Text>
        <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
      </SafeAreaView>)}

      <View style={styles(height, width).container}>

        <FlatList showsVerticalScrollIndicator={false}
          data={conversaciones}
          ListEmptyComponent={() => (
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', paddingTop: height * 0.2, fontSize: titleFont, color: 'black' }}>
              No tienes conversaciones actualmente
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
                    backgroundColor: item.ultimoRemitente === id2 ? '#24a0ed' : '#585c64',
                    borderRadius: 10,
                    height: height * 0.13,
                    width: width * 0.9,

                  }}
                  onPress={() => navigation.navigate("Chat", { id1: id1, id2: id2, conversacionId: item.id, tipo: tipo })}  >
                  <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
                    {item.titulo}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }}
        />
        <View style={{
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
            onPress={() => navigation.navigate("CrearChat", { id1: id1, id2: id2, tipo: tipo })}  >
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
              Crear conversacion
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {tipo === "Paciente" && (
        <FooterPaciente item='chats' navigation={navigation} id={id1}></FooterPaciente>
      )}
      {tipo === "Medico" && (
        <FooterMedico item='pacientes' navigation={navigation} id={id1}></FooterMedico>
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


