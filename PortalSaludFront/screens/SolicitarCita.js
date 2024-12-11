import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Pressable, TextInput, Dimensions, SafeAreaView, StatusBar, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { registerTranslation, DatePickerModal } from 'react-native-paper-dates';
import { moderateScale } from 'react-native-size-matters';

import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER } from '@env';
import axios from 'axios';
import { getTokens, storeTokens, clearTokens } from '../components/TokenStorage'
import Footer from '../components/FooterPaciente';

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


export default function SolicitarCita({ navigation, route }) {

  const { id } = route.params;
  const [fechaCita, setFechaCita] = useState(new Date().toLocaleDateString('es-ES'));
  const [fecha, setFecha] = useState(new Date());
  const [open, setOpen] = useState(false);

  const [idMedico, setIdMedico] = useState("");
  const [medico, setMedico] = useState("");

  const [errors, setErrors] = useState("");

  const onDismissSingle = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const onConfirmSingle = useCallback(
    (params) => {
      setOpen(false);
      setFecha(params.date);
      setFechaCita(params.date.toLocaleDateString('es-ES'))
    },
    [setOpen, setFecha]
  );

  useEffect(() => {
    const loadResources = async () => {
      await loadFonts();

    };

    loadResources();
    fetchData();



  }, []);

  const fetchData = async () => {
    try {
      const { accessToken, refreshToken } = await getTokens();
      Data = {
        id: id
      };

      const response = await axios.post(SERVER + 'citas/informacion', Data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-refresh-token': refreshToken,
        }
      })
      setMedico(response.data.medico);
      setIdMedico(response.data.id_medico);

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
    var fechaActual = new Date();
    fechaActual.setHours(0);
    fechaActual.setMinutes(0);
    fechaActual.setSeconds(0);


    if (!fechaCita) errors.fecha = "Es necesario seleccionar una fecha.";
    else if (fecha < fechaActual) errors.fecha = "La fecha no puede ser anterior al día actual."


    setErrors(errors);

    return Object.keys(errors).length === 0;
  }

  function formatDate(date) {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();
      

    if (month.length < 2)
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;
    return [year, month, day].join('-');
  }

  function handleSolicitud(navigation) {
    if (validacion()) {
      navigation.navigate("SolicitarCitaHora", { id: id, fecha: formatDate(fecha), idMedico: idMedico })
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
      {/* <Text style={{ flexWrap: 'wrap', paddingTop: height * 0.03, backgroundColor: '#F8F8F8', }}></Text> */}
      <SafeAreaView style={styles(height, width).header}>
        <Text style={{ flexWrap: 'wrap', flex: 1 }}></Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()} style={{ flex: 1, alignItems: 'flex-start' }} >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: '#24a0ed' }}>
            {"<"}
          </Text>
        </TouchableOpacity>
        <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Solicitar Cita</Text>
        <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
      </SafeAreaView>

      <View style={styles(height, width).container} >
        <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont }}>Médico: {medico}</Text>

        <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.1, paddingBottom: height * 0.03 }}>Dia:</Text>
        <Pressable onPress={() => setOpen(true)}>
          <TextInput
            style={{
              fontFamily: 'Nunito',
              fontSize: textFont,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#E3E3E3',
              borderRadius: 10,
              height: height * 0.05,
              width: buttonWidth,
            }} value={fechaCita} onChangeText={setFechaCita} editable={false} />
        </Pressable>

        <DatePickerModal
          locale="es"
          mode="single"
          visible={open}
          onDismiss={onDismissSingle}
          date={fecha}
          onConfirm={onConfirmSingle}
          validRange={validRange}
        />
        {
          errors.fecha ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.fecha}</Text> : null
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
            width: buttonWidth,
          }}
          onPress={() => { handleSolicitud(navigation) }}>
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
            Solicitar
          </Text>
        </TouchableOpacity>
      </View>

      <Footer item='citas' navigation={navigation} id={id}></Footer>
    </KeyboardAvoidingView>
  );

};


export const styles = (height, width) => StyleSheet.create({
  container: {
    flex: 5,
    backgroundColor: '#fff',
    padding: width * 0.05,
    alignItems: 'center',
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

  },
});


