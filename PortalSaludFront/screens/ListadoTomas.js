import { useEffect, useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Dimensions,
  SafeAreaView, StatusBar, FlatList,
  Platform
} from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import axios from 'axios';
import Footer from '../components/FooterPaciente';
import { useIsFocused } from '@react-navigation/native';
import { CalendarManager } from '../CalendarManager';
import { SERVER } from '@env';

import { moderateScale } from 'react-native-size-matters';



const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};

export default function ListadoTomas({ navigation, route }) {

  const { id } = route.params;

  const [items, setItems] = useState([]);
  const isFocused = useIsFocused(); 





  useEffect(() => {
    if (isFocused) {
      fetchData();
    }

    const loadResources = async () => {
      await loadFonts();
      await CalendarManager.syncEvents(id);
    };

    loadResources();
  }, [isFocused]);


  const fetchData = async () => {

    var Data = {
      id: id
    };
    await axios.post(SERVER + 'tomas/listado', Data)
      .then(response => {
        if (response.data.success) {
          const id = response.data.id
          setItems(response.data.lista)

        }
        let errors = {};
        errors.login = response.data.message;
      })
      .catch(error => {
        console.error('Error al enviar la solicitud:', error.message);
      });
  }



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
        <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont }}>Tomas</Text>
      </SafeAreaView>

      <View style={styles(height, width).container}>

        <FlatList showsVerticalScrollIndicator={false}

          data={items}
          ListEmptyComponent={() => (
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', paddingTop: height * 0.2, fontSize: titleFont, color: 'black' }}>
              No tienes tomas actualmente
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
                  onPress={() => navigation.navigate("DetalleToma", { id: id, toma: item.id })}  >
                  <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
                    {item.descripcion}
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
              width: width * 0.8,
            }}
            onPress={() => navigation.navigate("NuevaToma", { id: id })}  >
            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
              Nueva toma
            </Text>
          </TouchableOpacity>
        </View>
      </View>


      <Footer item='tomas' navigation={navigation} id={id}></Footer>
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


