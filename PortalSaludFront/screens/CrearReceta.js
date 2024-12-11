import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, TouchableOpacity, Dimensions, SafeAreaView, StatusBar, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import DropDownPicker from 'react-native-dropdown-picker';
import { registerTranslation, DatePickerModal } from 'react-native-paper-dates';

import { moderateScale } from 'react-native-size-matters';

import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER } from '@env';
import axios from 'axios';
import { getTokens, storeTokens, clearTokens } from '../components/TokenStorage'
import Footer from '../components/FooterMedico';

const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};

registerTranslation('es', {
  save: 'Guardar',
  selectSingle: 'Selecciona una fecha',
  selectMultiple: 'Selecciona fechas',
  selectRange: 'Selecciona un periodo',
  notAccordingToDateFormat: (inputFormat) =>
    `El formato de la fecha debe ser ${inputFormat}`,
  mustBeHigherThan: (date) => `Debe ser posterior a ${date}`,
  mustBeLowerThan: (date) => `Debe ser anterior a ${date}`,
  mustBeBetween: (startDate, endDate) =>
    `Debe estar entre ${startDate} y ${endDate}`,
  dateIsDisabled: 'El día no está permitido',
  previous: 'Anterior',
  next: 'Siguiente',
  typeInDate: 'Escribe una fecha',
  pickDateFromCalendar: 'Elige una fecha del calendario',
  close: 'Cerrar',
});

export default function CrearReceta({ navigation, route }) {

  const { id, medico } = route.params;
  const [medicamento, setMedicamento] = useState("");
  const [horas, setHoras] = useState("");

  const [fechaFin, setFechaFin] = useState("");
  const [fecha, setFecha] = useState(new Date());
  const [openFecha, setOpenFecha] = useState(false);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState("");




  useEffect(() => {
    const loadResources = async () => {
      await loadFonts();
      await fetchData();
    };

    loadResources();



  }, []);

  const onDismissSingle = useCallback(() => {
    setOpenFecha(false);
  }, [setOpenFecha]);

  const onConfirmSingle = useCallback(
    (params) => {
      setOpenFecha(false);
      setFecha(params.date);
      setFechaFin(params.date.toLocaleDateString('es-ES'))
    },
    [setOpenFecha, setFecha]
  );

  const fetchData = async () => {
    try {
      const { accessToken, refreshToken } = await getTokens();
      Data = {
        id: id
      };

      const response = await axios.post(SERVER + 'recetas/informacion', Data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-refresh-token': refreshToken,
        }
      })
      
      setItems(response.data.medicamentos);

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

  const validRange = { startDate: new Date(), endDate: undefined }

  const { height, width } = Dimensions.get('window');

  const validacion = () => {
    let errors = {};

    if (!medicamento) errors.medicamento = "Es necesario seleccionar un medicamento.";
    if (!horas) errors.horas = "Los horas de consumición son necesarias.";

    setErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleValidacion(navigation) {
    try {
      if (validacion()) {
        const { accessToken, refreshToken } = await getTokens();
        var Data = {
          id_paciente: id,
          id_medicamento: medicamento,
          horas: horas,
          fecha: fecha
        };
        const response = await axios.post(SERVER + 'recetas/crear', Data, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-refresh-token': refreshToken,
          }
        })

        
        if (response.data.accessToken && response.data.refreshToken) {
          storeTokens(response.data.accessToken, response.data.refreshToken);
        }

        if (response.data.success) {
          navigation.replace("ListadoRecetas", { id: id, medico: medico, tipo: "Medico" })
        }
        else {
          setError("error");
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


  var titleFont, textFont, buttonWidth, buttonHeight;

  if (Platform.OS === 'web' && !isMobile) {
    titleFont = moderateScale(40)
    textFont = moderateScale(20)
    buttonWidth = width * 0.35
    buttonHeight = height * 0.1
  }
  else {
    titleFont = moderateScale(37)
    textFont = moderateScale(20)
    buttonWidth = width * 0.8
    buttonHeight = height * 0.1
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
        <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Crear receta</Text>
        <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
      </SafeAreaView>
      <View style={styles(height, width).container} >
        <Text style={{ flexWrap: 'wrap', paddingTop: width * 0.1 }}></Text>
        <DropDownPicker
          open={open}
          value={value}
          items={items}
          style={{
            height: height * 0.1,
            width: width * 0.9,
            alignSelf: 'center'
          }}
          setOpen={setOpen}
          setValue={setValue}
          setItems={setItems}
          searchable={true}
          placeholder='Medicamento'
          searchPlaceholder=''
          ListEmptyComponent={({
            listMessageContainerStyle, listMessageTextStyle, ActivityIndicatorComponent, loading, message
          }) => (
            <View style={[listMessageTextStyle, { justifyContent: 'center', alignItems: 'center' }]}>
              {loading ? (
                <ActivityIndicatorComponent />
              ) : (
                <Text style={[listMessageTextStyle, { textAlign: 'center' }]}>
                  No hay medicamentos disponibles
                </Text>
              )}
            </View>
          )}
          textStyle={{
            fontFamily: 'Nunito',
            fontSize: textFont,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            height: height * 0.05,
            width: width * 0.9,
          }}
          onSelectItem={(item) => {
            setMedicamento(item.value)
          }} />
        {
          errors.medicamento ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.medicamento}</Text> : null
        }
        <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.1, paddingBottom: height * 0.03 }}>Fecha fin:</Text>
        <Pressable onPress={() => setOpenFecha(true)}>
          <TextInput
            style={{
              fontFamily: 'Nunito',
              fontSize: textFont,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#E3E3E3',
              borderRadius: 10,
              height: height * 0.05,
              width: width * 0.9,
            }} value={fechaFin} onChangeText={setFechaFin} editable={false} />
        </Pressable>

        <DatePickerModal
          locale="es"
          mode="single"
          visible={openFecha}
          onDismiss={onDismissSingle}
          date={fecha}
          onConfirm={onConfirmSingle}
          validRange={validRange}
        />
        {
          errors.fecha ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.fecha}</Text> : null
        }
        <Text style={{ flexWrap: 'wrap', paddingTop: textFont }} />
        <TextInput
          style={{
            fontFamily: 'Nunito',
            fontSize: textFont,
            backgroundColor: '#E3E3E3',
            borderRadius: 10,
            height: height * 0.1,
            width: width * 0.9,
          }}
          keyboardType="numeric"
          value={horas} onChangeText={setHoras} placeholder=" Horas entre consumicion" />
        {
          errors.horas ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.horas}</Text> : null
        }
        {
          errors.error ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.error}</Text> : null
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
            height: height * 0.13,
            width: width * 0.85,
          }}
          onPress={() => handleValidacion(navigation)}>
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
            Crear
          </Text>
        </TouchableOpacity>
      </View>

      <Footer item='pacientes' navigation={navigation} id={id}></Footer>
    </KeyboardAvoidingView>
  );

};


export const styles = (height, width) => StyleSheet.create({
  container: {
    flex: 7,
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
  container2: {
    flex: 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});


