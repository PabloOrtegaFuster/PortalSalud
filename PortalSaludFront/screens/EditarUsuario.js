import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Dimensions, TextInput, ScrollView, Pressable, SafeAreaView, StatusBar, Platform } from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import Footer from '../components/FooterAdministrador';

import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getTokens, storeTokens, clearTokens } from '../components/TokenStorage';
import { registerTranslation, DatePickerModal,TimePickerModal } from 'react-native-paper-dates';
import DropDownPicker from 'react-native-dropdown-picker';
import { SERVER } from '@env';
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

export default function EditarUsuario({ navigation, route }) {

  const { usuario, tipo } = route.params;

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [centro, setCentro] = useState("");
  const [errors, setErrors] = useState("");

  const [openMedico, setOpenMedico] = useState(false);
  const [medicos, setMedicos] = useState([]);
  const [medico, setMedico] = useState(null);


  const [fecha, setFecha] = useState(new Date());
  const [openFecha, setOpenFecha] = useState(false);
  const [hoy, setHoy] = useState(new Date());

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);

  const [schedule, setSchedule] = useState([]);

  const [isPickerVisible, setPickerVisible] = useState(false);
  const [currentDayId, setCurrentDayId] = useState(null);
  const [currentTimeType, setCurrentTimeType] = useState(null);

  const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const patronTelefono = /^(6|7|8)\d{8}$|^9\d{8}$/;

  const handleConfirm = ({ hours, minutes }) => {
    if (hours.toString().length == 1) {
      hours = '0' + hours;
    }
    if (minutes.toString().length == 1) {
      minutes = '0' + minutes;
    }
    setSchedule((prevSchedule) =>
      prevSchedule.map((item) =>
        item.id === currentDayId
          ? { ...item, [currentTimeType]: hours + ":" + minutes }
          : item
      )
    );
    setPickerVisible(false);
  };

  const showPicker = (id, type) => {
    setCurrentDayId(id);
    setCurrentTimeType(type);
    setPickerVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={{
        fontFamily: 'Nunito',
        fontSize: textFont,
      }}>{item.day}</Text>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
      }}>
        <Pressable onPress={() => showPicker(item.id, 'startTime')}>
          <TextInput
            style={{
              fontFamily: 'Nunito',
              fontSize: textFont,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#E3E3E3',
              borderRadius: 10,
              height: height * 0.05,
              width: width * 0.20,
            }} value={item.startTime} editable={false} />
        </Pressable>
        <Pressable onPress={() => showPicker(item.id, 'endTime')}>
          <TextInput
            style={{
              fontFamily: 'Nunito',
              fontSize: textFont,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#E3E3E3',
              borderRadius: 10,
              height: height * 0.05,
              width: width * 0.20,
            }} value={item.endTime} editable={false} />
        </Pressable>
      </View>
    </View>
  );

  const onDismissSingle = useCallback(() => {
    setOpenFecha(false);
  }, [setOpenFecha]);

  const onConfirmSingle = useCallback(
    (params) => {
      setOpenFecha(false);
      setFecha(params.date);
      setFechaNacimiento(params.date.toLocaleDateString('es-ES'))
    },
    [setOpenFecha, setFecha]
  );

  const validacion = () => {
    let errors = {};

    if (!nombre) errors.nombre = "El nombre es necesario.";
    if (!apellidos) errors.apellidos = "Los apellidos son necesarios.";

    if (!correo) errors.correo = "El correo es necesario.";
    else if (!patronCorreo.test(correo)) errors.correo = "El correo electronico es invalido.";

    if (!fechaNacimiento) errors.fechaNacimiento = "La fecha de nacimiento es necesaria.";
    else if (fecha > new Date()) errors.fechaNacimiento = "La fecha de nacimiento no puede ser posterior al día actual."

    if (!telefono) errors.telefono = "El numero de telefono es necesario.";
    else if (telefono.length != 9) errors.telefono = "La longitud del numero de telefono es incorrecta.";
    else if (!patronTelefono.test(telefono)) errors.telefono = "El número de teléfono no es válido. Por favor, ingresa un número de teléfono español válido.";

    if (tipo != "Administrador") {
      if (!centro) errors.centro = "Es necesario seleccionar un centro.";
    }

    if (tipo == "Paciente") {
      if (!medico) errors.medico = "Es necesario seleccionar un medico.";
    }

    setErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleRegistro(navigation) {
    try {
      if (validacion()) {


        const { accessToken, refreshToken } = await getTokens();

        var Data = {
          correo: correo,
          dni: dni,
          tipo: tipo
        };

        
        const response = await axios.post(SERVER + 'users/comprobacionUpdate', Data, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-refresh-token': refreshToken,
          }
        })

        
        var f = new Date(fecha)
        fecha.setHours(12)
        setFecha(f)
        if (response.data.message == "OK") {
          Data = {
            nombre: nombre,
            apellidos: apellidos,
            correo: correo,
            fechaNacimiento: fecha,
            id: usuario,
            telefono: telefono,
            centro: centro,
            tipo: tipo,
            medico: medico,
            horarios: tipo === "Medico" ? schedule : null
          };


          const response = await axios.post(SERVER + 'users/modificar', Data, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'x-refresh-token': refreshToken,
            }
          })
          
          if (response.data.success) {

            if (Platform.OS === 'web') {
              window.alert(
                "El usuario ha sido modificado con éxito."
              );
            } else {

              Alert.alert(
                "Usuario Modificado",
                "El usuario ha sido modificado con éxito.",
                [{ text: "OK" }]
              );
            }
            navigation.goBack();
          }


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


  useEffect(() => {
    const loadResources = async () => {
      await loadFonts();

      await fetchData()

      const newHoy = new Date();
      newHoy.setFullYear(newHoy.getFullYear() - 18);
      setHoy(newHoy); 
    };

    loadResources();

  }, []);

  const fetchData = async () => {
    try {
      const { accessToken, refreshToken } = await getTokens();

      Data = {
        id: usuario
      }

      const response1 = await axios.get(SERVER + 'auth/centros', Data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-refresh-token': refreshToken,
        }
      })

      setItems(response1.data.lista);

      if (response1.data.accessToken && response1.data.refreshToken) {
        storeTokens(response1.data.accessToken, response1.data.refreshToken);
      }

      const response2 = await axios.post(SERVER + 'users/detalle', Data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-refresh-token': refreshToken,
        }
      })


      if (response2.data.success) {
        
        setNombre(response2.data.nombre)
        setApellidos(response2.data.apellidos)
        setCorreo(response2.data.correo)
        var f = new Date(response2.data.fecha_nacimiento)
        f.setHours(1)
        setFecha(f)

        setFechaNacimiento(f.toLocaleDateString('es-ES'))

        setDni(response2.data.dni)
        setTelefono(response2.data.telefono)

        setCentro(response2.data.centro)
        setValue(response2.data.centroid)
        setMedico(response2.data.medicoid)
        setMedicos(response2.data.lista)
        setSchedule(response2.data.horario)


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

  const medicosFiltrados = medicos
    .filter((medico) => medico.centro === centro)
    .map((medico) => ({ label: medico.label, value: medico.value })) || [];

  const handleCentroChange = (val) => {
    setCentro(val);


    const medicoValido = medicos.some(
      (med) => med.value === medico && med.centro === value
    );


    if (!medicoValido) {
      setMedico(null);
    }
  }

  const validRange = { startDate: undefined, endDate: hoy }

  const { height, width } = Dimensions.get('window');


  var titleFont, textFont, buttonWidth, buttonHeight, windowWidth;

  if (Platform.OS === 'web' && !isMobile) {
    titleFont = moderateScale(50)
    textFont = moderateScale(20)
    buttonWidth = width * 0.35
    buttonHeight = height * 0.1
    windowWidth = width * 0.8
  }
  else {
    titleFont = moderateScale(37)
    textFont = 20
    buttonWidth = width * 0.8
    buttonHeight = height * 0.1
    windowWidth = width * 0.9
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden={false} translucent={true} />
      <SafeAreaView style={styles(height, width).header}>
        <Text style={{ flexWrap: 'wrap', flex: 1 }}></Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()} style={{ flex: 1, alignItems: 'flex-start' }} >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: '#24a0ed' }}>
            {"<"}
          </Text>
        </TouchableOpacity>
        <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Editar usuario</Text>
        <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
      </SafeAreaView>

      <View style={styles(height, width).container}>

        <ScrollView style={{ width: windowWidth }} showsVerticalScrollIndicator={false}>
          {tipo !== "Administrador" &&
            (
              <Text style={{ flexWrap: 'wrap', width: windowWidth, fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.03, paddingBottom: height * 0.03 }}>Centro</Text>
            )}

          {tipo !== "Administrador" &&
            (
              <DropDownPicker
                open={open}
                value={value}
                label
                items={items}
                labelStyle={{
                  fontSize: textFont, fontFamily: 'Nunito'
                }}
                setOpen={setOpen}
                setValue={setValue}
                searchable={true}
                onChangeValue={handleCentroChange}
                placeholder='Selecciona un centro'
                searchPlaceholder='Introduce el centro que quieres.'
                fontSize={textFont}
                placeholderStyle={{
                  fontFamily: 'Nunito',
                  fontSize: textFont,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  height: height * 0.05,
                  width: windowWidth,
                }}
                ListEmptyComponent={({
                  listMessageTextStyle, ActivityIndicatorComponent, loading, message
                }) => (
                  <View style={[listMessageTextStyle, { justifyContent: 'center', alignItems: 'center' }]}>
                    {loading ? (
                      <ActivityIndicatorComponent />
                    ) : (
                      <Text style={[listMessageTextStyle, { textAlign: 'center' }]}>
                        No hay centros disponibles
                      </Text>
                    )}
                  </View>
                )}
                onSelectItem={(item) => {
                  setCentro(item.value)
                }} />

            )}

          {
            errors.centro ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.centro}</Text> : null
          }

          <Text style={{ flexWrap: 'wrap', paddingTop: height * 0.01 }}></Text>
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingBottom: height * 0.03 }}>Nombre:</Text>
          <TextInput
            style={{
              fontFamily: 'Nunito',
              fontSize: textFont,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#E3E3E3',
              borderRadius: 10,
              height: height * 0.05,
              width: windowWidth,
            }} value={nombre} onChangeText={setNombre} />
          {
            errors.nombre ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.nombre}</Text> : null
          }
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.03, paddingBottom: height * 0.03 }}>Apellidos</Text>
          <TextInput
            style={{
              fontFamily: 'Nunito',
              fontSize: textFont,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#E3E3E3',
              borderRadius: 10,
              height: height * 0.05,
              width: windowWidth,
            }} value={apellidos} onChangeText={setApellidos} />
          {
            errors.apellidos ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.apellidos}</Text> : null
          }
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.03, paddingBottom: height * 0.03 }}>Correo</Text>
          <TextInput
            style={{
              fontFamily: 'Nunito',
              fontSize: textFont,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#E3E3E3',
              borderRadius: 10,
              height: height * 0.05,
              width: windowWidth,
            }} value={correo} onChangeText={setCorreo} autoCapitalize='none' />
          {
            errors.correo ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.correo}</Text> : null
          }

          {tipo === "Paciente" &&
            (
              <Text style={{ flexWrap: 'wrap', width: windowWidth, fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.03, paddingBottom: height * 0.03 }}>Medico</Text>
            )}

          {tipo === "Paciente" &&
            (
              <DropDownPicker
                open={openMedico}
                value={medico}
                items={medicosFiltrados}
                labelStyle={{
                  fontSize: textFont, fontFamily: 'Nunito'
                }}
                setOpen={setOpenMedico}
                setValue={setMedico}
                searchable={true}
                disabled={!centro}
                placeholder='Selecciona un medico'
                searchPlaceholder='Introduce el medico que quieres.'
                fontSize={textFont}
                placeholderStyle={{
                  fontFamily: 'Nunito',
                  fontSize: textFont,
                  alignItems: 'center',
                  justifyContent: 'center',
                  
                  borderRadius: 10,
                  height: height * 0.05,
                  width: windowWidth,
                }}
                ListEmptyComponent={({
                  listMessageContainerStyle, listMessageTextStyle, ActivityIndicatorComponent, loading, message
                }) => (
                  <View style={[listMessageTextStyle, { justifyContent: 'center', alignItems: 'center' }]}>
                    {loading ? (
                      <ActivityIndicatorComponent />
                    ) : (
                      <Text style={[listMessageTextStyle, { textAlign: 'center' }]}>
                        No hay medicos disponibles
                      </Text>
                    )}
                  </View>
                )}
                onSelectItem={(item) => {
                  setMedico(item.value)
                }} />

            )}

          {
            errors.medico ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.medico}</Text> : null
          }


          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.03, paddingBottom: height * 0.03 }}>Fecha de Nacimiento</Text>

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
              }} value={fechaNacimiento} onChangeText={setFechaNacimiento} />
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
            errors.fechaNacimiento ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.fechaNacimiento}</Text> : null
          }
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.03, paddingBottom: height * 0.03 }}>DNI</Text>
          <TextInput
            editable={false}
            style={{
              fontFamily: 'Nunito',
              fontSize: textFont,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#E3E3E3',
              borderRadius: 10,
              height: height * 0.05,
              width: windowWidth,
            }} value={dni} onChangeText={setDni} />
          {
            errors.dni ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.dni}</Text> : null
          }
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.03, paddingBottom: height * 0.03 }}>Telefono</Text>
          <TextInput
            style={{
              fontFamily: 'Nunito',
              fontSize: textFont,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#E3E3E3',
              borderRadius: 10,
              height: height * 0.05,
              width: windowWidth,
            }} value={telefono} onChangeText={setTelefono} />
          {
            errors.telefono ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.telefono}</Text> : null
          }
          {tipo === "Medico" && (
            <View >
              <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont }}>Horario Semanal</Text>
              <FlatList showsVerticalScrollIndicator={false}
                data={schedule}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
              />
              {isPickerVisible && (
                <TimePickerModal
                  visible={isPickerVisible}
                  onDismiss={() => setPickerVisible(false)}
                  onConfirm={handleConfirm}
                />
              )}
              <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingBottom: height * 0.02 }}></Text>

            </View>
          )}
        </ScrollView>


      </View>


      <View style={styles(height, width).container2}>

        <Text style={{}}></Text>
        <TouchableOpacity
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 8,
            backgroundColor: '#24a0ed',
            borderRadius: 10,
            height: height * 0.15,
            width: width * 0.7,
          }}
          onPress={() => handleRegistro(navigation)}  >
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
            Modificar usuario
          </Text>
        </TouchableOpacity>
      </View>


      <Footer item='eliminar' navigation={navigation}></Footer>
    </View>
  );
};

export const styles = (height, width) => StyleSheet.create({
  container: {
    flex: 6,
    backgroundColor: '#fff',
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
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',

  },
});