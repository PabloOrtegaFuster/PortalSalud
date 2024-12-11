import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Keyboard, Dimensions, SafeAreaView, StatusBar, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { moderateScale } from 'react-native-size-matters';
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { database } from "../config/firebase"

import Footer from '../components/FooterPaciente';

const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};

export default function CrearChat({ navigation, route }) {

  const { id1, id2, tipo } = route.params;
  const [titulo, setTitulo] = useState("");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const [errors, setErrors] = useState("");




  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    const loadResources = async () => {
      await loadFonts();

    };

    loadResources();
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };

  }, []);

  async function createConversation(navigation) {
    if (validacion()) {
      try {
        var conversationRef
        if (tipo === "Paciente") {

          conversationRef = await addDoc(collection(database, 'conversaciones'), {
            titulo: titulo,
            medico: id2,           
            paciente: id1,            
            createdAt: serverTimestamp(), 
          });
        }
        else if (tipo === "Medico") {
          conversationRef = await addDoc(collection(database, 'conversaciones'), {
            titulo: titulo,
            medico: id1,           
            paciente: id2,           
            createdAt: serverTimestamp(),
          });
        }

        navigation.replace("Chat", { id1: id1, id2: id2, conversacionId: conversationRef.id, tipo: tipo })
      } catch (error) {
        console.error("Error al crear la conversación:", error);
      }
    }
  }

  const { height, width } = Dimensions.get('window');

  const validacion = () => {
    let errors = {};

    if (!titulo) errors.notas = "El titulo es necesario";

    setErrors(errors);

    return Object.keys(errors).length === 0;
  }

  var titleFont, textFont, buttonWidth, buttonHeight, paddingTop = 0;

  if (Platform.OS === 'web' && !isMobile) {
    titleFont = moderateScale(40)
    textFont = moderateScale(20)
    buttonWidth = width * 0.35
    buttonHeight = height * 0.1
    paddingTop = height * 0.05
  }
  else {
    titleFont = moderateScale(37)
    textFont = moderateScale(30)
    buttonWidth = width * 0.8
    buttonHeight = height * 0.15
    paddingTop = height * 0.15
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior='height' enabled={false}>
      <SafeAreaView style={styles(height, width).header}>
        <Text style={{ flexWrap: 'wrap', flex: 1 }}></Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()} style={{ flex: 1, alignItems: 'flex-start' }} >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: '#24a0ed' }}>
            {"<"}
          </Text>
        </TouchableOpacity>
        <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Crear chat</Text>
        <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
      </SafeAreaView>

      <View style={styles(height, width).container} >
        <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: paddingTop }}>Titulo del chat:</Text>

        <TextInput
          style={{
            fontFamily: 'Nunito',
            fontSize: textFont,
            backgroundColor: '#E3E3E3',
            borderRadius: 10,
            height: height * 0.1,
          }} value={titulo} onChangeText={setTitulo} placeholder=" Titulo" />
        {
          errors.titulo ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.titulo}</Text> : null
        }



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
            width: buttonWidth,
          }}
          onPress={() => createConversation(navigation)}>
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'white' }}>
            Crear conversacion
          </Text>
        </TouchableOpacity>
      </View>

      {!isKeyboardVisible && (
        <Footer item='chats' navigation={navigation} id={id1}></Footer>
      )}
    </KeyboardAvoidingView>
  );

};


export const styles = (height, width) => StyleSheet.create({
  container: {
    flex: 7,
    backgroundColor: '#fff',
    paddingLeft: width * 0.1,
    paddingRight: width * 0.1,
  },
  container2: {
    flex: 2,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  header: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',

  }
});


