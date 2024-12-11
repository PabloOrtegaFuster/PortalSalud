import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, SafeAreaView, StatusBar, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { SERVER } from '@env';
import axios from 'axios';
import Footer from '../components/FooterPaciente';
import { moderateScale } from 'react-native-size-matters';

const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};

export default function DetalleToma({ navigation, route }) {
  const { id, toma } = route.params;
  const [medicamento, setMedicamento] = useState("");
  const [hora, setHora] = useState("");
  const [minutos, setMinutos] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [receta, setReceta] = useState("");


  useEffect(() => {
    const loadResources = async () => {
      await loadFonts();

    };

    loadResources();
    fetchData();
    

  }, []);

  const fetchData = async () => {
    Data = {
      id: toma
    };
    await axios.post(SERVER + 'tomas/detalle', Data)
      .then(response => {
        
        setMedicamento(response.data.medicamento);

        var hour = response.data.hora

        if (hour.toString().length == 1) {
          setHora('0' + hour);
        }
        else {
          setHora(hour);
        }

        var minutes = response.data.minutos
        if (minutes.toString().length == 1) {
          setMinutos('0' + minutes);
        }
        else {
          setMinutos(minutes);
        }

        setFechaFin(response.data.fecha_fin)
        setReceta(response.data.receta);
      })
      .catch(error => {
        console.error('Error al enviar la solicitud:', error.message);
      });
  }

  async function eliminarToma() {
    Data = {
      id: toma
    };
    await axios.post(SERVER + 'tomas/borrar', Data)
      .then(response => {
        navigation.replace("ListadoTomas", { id: id })
      })
      .catch(error => {
        console.error('Error al enviar la solicitud:', error.message);
      });
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior='height' enabled={false}>
      {/* <Text style={{ flexWrap: 'wrap', paddingTop: height * 0.03, backgroundColor: '#F8F8F8', }}></Text> */}
      <SafeAreaView style={styles(height, width).header}>
        <Text style={{ flexWrap: 'wrap', flex: 1 }}></Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()} style={{ flex: 1, alignItems: 'flex-start' }} >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: '#24a0ed' }}>
            {"<"}
          </Text>
        </TouchableOpacity>
        <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Detalle Toma</Text>
        <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
      </SafeAreaView>

      <View style={styles(height, width).container} >
        <Text style={styles(height, width).container3}>Medicamento: {medicamento}</Text>
        <Text style={{ flexWrap: 'wrap', paddingBottom: width * 0.03, }}></Text>
        <Text style={styles(height, width).container3}>Hora de la toma: </Text>
        <Text style={styles(height, width).container3}>{hora + ":" + minutos} </Text>
        <Text style={{ flexWrap: 'wrap', paddingBottom: width * 0.03, }}></Text>
        <Text style={styles(height, width).container3}>Fecha fin de la toma: </Text>
        <Text style={styles(height, width).container3}>{fechaFin} </Text>

      </View>

      <View style={styles(height, width).container2}>
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
          onPress={() => navigation.navigate("DetalleReceta", { id: id, receta: receta })}>
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
            Ver receta
          </Text>
        </TouchableOpacity>
        <Text style={{ flexWrap: 'wrap', paddingBottom: width * 0.02, }}></Text>
        <TouchableOpacity
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 8,
            backgroundColor: 'red',
            borderRadius: 10,
            height: height * 0.13,
            width: width * 0.85,
          }}
          onPress={() => eliminarToma()}>
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
            Eliminar toma
          </Text>
        </TouchableOpacity>
      </View>

      <Footer item='tomas' navigation={navigation} id={id}></Footer>
    </KeyboardAvoidingView>
  );

};


export const styles = (height, width) => StyleSheet.create({
  container: {
    flex: 5,
    backgroundColor: '#fff',
    padding: width * 0.05,
  },
  container3: {
    fontFamily: 'Nunito',
    fontSize: width * 0.076,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    textAlign: 'center'
  },
  container2: {
    flex: 4,
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

  },
});


