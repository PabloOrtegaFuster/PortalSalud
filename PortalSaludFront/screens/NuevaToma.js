import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ScrollView, Text, View, TouchableOpacity, Pressable, TextInput, Dimensions, SafeAreaView, StatusBar, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { registerTranslation, DatePickerModal, TimePickerModal } from 'react-native-paper-dates';
import DropDownPicker from 'react-native-dropdown-picker';
import { SERVER } from '@env';
import axios from 'axios';
import Footer from '../components/FooterPaciente';
import { CalendarManager } from '../CalendarManager';
import { moderateScale } from 'react-native-size-matters';

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

export default function NuevaToma({ navigation, route }) {

  const { id } = route.params;

  const [fechaFin, setFechaFin] = useState(new Date());

  const [hora, setHora] = useState(new Date().getHours());
  const [minutos, setMinutos] = useState(new Date().getMinutes());

  const [openHora, setOpenHora] = useState(false);

  const [fechaAlarmaFin, setFechaAlarmaFin] = useState("");
  const [openFecha, setOpenFecha] = useState(false);
  const [horaAlarma, setHoraAlarma] = useState("");


  const [medicamento, setMedicamento] = useState("");

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);

  const [errors, setErrors] = useState("");

  const onDismissSingleFecha = useCallback(() => {
    setOpenFecha(false);
  }, [setOpenFecha]);

  const onConfirmSingleFecha = useCallback(
    (params) => {
      setOpenFecha(false);
      setFechaFin(params.date);
      setFechaAlarmaFin(params.date.toLocaleDateString('es-ES'))
    },
    [setOpenFecha, setFechaFin]
  );

  const onDismissSingleHora = useCallback(() => {
    setOpenHora(false);
  }, [setOpenHora]);

  const onConfirmSingleHora = useCallback(
    ({ hours, minutes }) => {
      setOpenHora(false);

      if (hours.toString().length == 1) {
        hours = '0' + hours;
      }
      if (minutes.toString().length == 1) {
        minutes = '0' + minutes;
      }

      setHora(hours); 
      setMinutos(minutes); 
      setHoraAlarma(hours + ":" + minutes);
    },
    [setOpenHora]
  );


  const validRange = { startDate: new Date(), endDate: undefined }

  useEffect(() => {
    const loadResources = async () => {
      await loadFonts();

      await fetchData();
    };

    loadResources();



  }, []);

  const fetchData = async () => {
    Data = {
      id: id
    };
    await axios.post(SERVER + 'tomas/listadoRecetas', Data)
      .then(response => {
        setItems(response.data.lista)
      })
      .catch(error => {
        console.error('Error al enviar la solicitud:', error.message);
      });
  }



  const { height, width } = Dimensions.get('window');

  const validacion = () => {
    let errors = {};
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);

    if (!fechaAlarmaFin) errors.fechaFin = "Es necesario seleccionar una fecha de finalización.";

    if (!horaAlarma) errors.horaAlarma = "Es necesario seleccionar una hora.";

    if (!medicamento) errors.medicamento = "Es necesario seleccionar un medicamento.";


    setErrors(errors);

    return Object.keys(errors).length === 0;
  };

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

  async function handleAlarma(navigation) {
    if (validacion()) {
      const [hours, minutes] = horaAlarma.split(':');
      const receta = items.find(receta => receta.value === medicamento)
      const startDate = new Date()


      startDate.setHours(hours)
      startDate.setMinutes(minutes)

      const eventDetails = {
        title: 'Notificacion de ' + medicamento,
        startDate: startDate,
        endDateF: fechaFin,
        id_receta: receta.id,
        desc: medicamento,
        hora: hours,
        minutos: minutes
      }

      const eventId = await CalendarManager.createEvent(eventDetails)
      if (eventId !== undefined) {

        const [hours, minutes] = horaAlarma.split(':');
        Data = {
          id: id,
          fin: fechaFin,
          hora: hours,
          minutos: minutes,
          descripcion: medicamento,
          id_receta: receta.id
        };

        axios.post(SERVER + 'tomas/crear', Data)
          .then(response => {
            navigation.navigate("ListadoTomas", { id: id })
          })
          .catch(error => {
            console.error('Error al enviar la solicitud:', error.message);
          });
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
      {/* <Text style={{ flexWrap: 'wrap', paddingTop: height * 0.03, backgroundColor: '#F8F8F8', }}></Text> */}
      <SafeAreaView style={styles(height, width).header}>
        <Text style={{ flexWrap: 'wrap', flex: 1 }}></Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()} style={{ flex: 1, alignItems: 'flex-start' }} >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: '#24a0ed' }}>
            {"<"}
          </Text>
        </TouchableOpacity>
        <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Nueva toma</Text>
        <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
      </SafeAreaView>

      <View style={styles(height, width).container} >

        <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont }}>Medicamento: </Text>
        <DropDownPicker
          open={open}
          value={value}
          items={items}
          style={{ backgroundColor: '#F8F8F8' }}
          setOpen={setOpen}
          setValue={setValue}
          setItems={setItems}
          searchable={true}
          placeholder='Selecciona un medicamento'
          searchPlaceholder='Introduce el medicamento.'
          ListEmptyComponent={({
            listMessageContainerStyle, listMessageTextStyle, ActivityIndicatorComponent, loading, message
          }) => (
            <View style={[listMessageTextStyle, { justifyContent: 'center', alignItems: 'center' }]}>
              {loading ? (
                <ActivityIndicatorComponent />
              ) : (
                <Text style={[listMessageTextStyle, { textAlign: 'center' }]}>
                  No hay medicamentos recetados
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
        {errors.medicamento && <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.medicamento}</Text>}


        <ScrollView style={{ width: width * 0.9 }} showsVerticalScrollIndicator={false}>


          {/* Fecha de finalización */}
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.05, paddingBottom: height * 0.05 }}>Fecha de finalización:</Text>
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
              }}
              value={fechaAlarmaFin}
              onChangeText={setFechaAlarmaFin}
              editable={false}
            />
          </Pressable>
          <DatePickerModal
            locale="es"
            mode="single"
            visible={openFecha}
            onDismiss={onDismissSingleFecha}
            date={fechaFin}
            onConfirm={onConfirmSingleFecha}
            validRange={validRange}
          />
          {errors.fechaFin && <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.fechaFin}</Text>}

          {/* Hora */}
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.05, paddingBottom: height * 0.05 }}>Hora:</Text>
          <Pressable onPress={() => setOpenHora(true)}>
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
              }}
              value={horaAlarma}
              onChangeText={setHoraAlarma}
              editable={false}
            />
          </Pressable>
          <TimePickerModal
            locale="es"
            visible={openHora}
            onDismiss={onDismissSingleHora}
            onConfirm={onConfirmSingleHora}
            hours={hora} 
            minutes={minutos}
            validRange={validRange}
          />
          {errors.horaAlarma && <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.horaAlarma}</Text>}

        </ScrollView>
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
          onPress={() => { handleAlarma(navigation) }}>
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
            Crear
          </Text>
        </TouchableOpacity>
      </View>

      <Footer item='tomas' navigation={navigation} id={id}></Footer>
    </KeyboardAvoidingView>
  );

};


export const styles = (height, width) => StyleSheet.create({
  container: {
    flex: 6,
    backgroundColor: '#fff',
    padding: textFont,
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


