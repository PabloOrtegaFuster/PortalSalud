import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, KeyboardAvoidingView, Dimensions, TextInput, ScrollView, Pressable, SafeAreaView, StatusBar, Platform } from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { moderateScale } from 'react-native-size-matters';
import axios from 'axios';
import DateTimePicker from "@react-native-community/datetimepicker";
import DropDownPicker from 'react-native-dropdown-picker';
import { SERVER } from '@env';

const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};



export default function Registro({ navigation }) {

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [centro, setCentro] = useState("");
  const [errors, setErrors] = useState("");


  const [fecha, setFecha] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);

  const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const patronTelefono = /^(6|7|8)\d{8}$|^9\d{8}$/;

  const toggleDatepicker = () => {
    setShowPicker(!showPicker);
  }

  const onChange = ({ type }, fechaSeleccionada) => {
    if (type == 'set') {
      const fechaActual = fechaSeleccionada;
      setFecha(fechaActual);

      toggleDatepicker();
      setFechaNacimiento(fechaActual.toLocaleDateString('es-ES'));
    }
    else {
      toggleDatepicker();
    }
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

  const validacionDNI = (dni, letra) => {
    var resto = dni % 23;

    switch (resto) {
      case 0:
        if (letra === 'T') return true;
        break;
      case 1:
        if (letra === 'R') return true;
        break;
      case 2:
        if (letra === 'W') return true;
        break;
      case 3:
        if (letra === 'A') return true;
        break;
      case 4:
        if (letra === 'G') return true;
        break;
      case 5:
        if (letra === 'M') return true;
        break;
      case 6:
        if (letra === 'Y') return true;
        break;
      case 7:
        if (letra === 'F') return true;
        break;
      case 8:
        if (letra === 'P') return true;
        break;
      case 9:
        if (letra === 'D') return true;
        break;
      case 10:
        if (letra === 'X') return true;
        break;
      case 11:
        if (letra === 'B') return true;
        break;
      case 12:
        if (letra === 'N') return true;
        break;
      case 13:
        if (letra === 'J') return true;
        break;
      case 14:
        if (letra === 'Z') return true;
        break;
      case 15:
        if (letra === 'S') return true;
        break;
      case 16:
        if (letra === 'Q') return true;
        break;
      case 17:
        if (letra === 'V') return true;
        break;
      case 18:
        if (letra === 'H') return true;
        break;
      case 19:
        if (letra === 'L') return true;
        break;
      case 20:
        if (letra === 'C') return true;
        break;
      case 21:
        if (letra === 'K') return true;
        break;
      case 22:
        if (letra === 'E') return true;
        break;
      default:
        return false;
    }

  }

  const validacion = () => {
    let errors = {};

    if (!nombre) errors.nombre = "El nombre es necesario.";
    if (!apellidos) errors.apellidos = "Los apellidos son necesarios.";

    if (!correo) errors.correo = "El correo es necesario.";
    else if (!patronCorreo.test(correo)) errors.correo = "El correo electronico es invalido.";

    if (!password) errors.password = "La contraseña es necesaria.";
    else if (password.length < 8) errors.password = "La contraseña es demasiado corta.";
    else if (!/\d/.test(password)) errors.password = "La contraseña no contiene numeros.";
    else if (!/[A-Z]/.test(password)) errors.password = "La contraseña no contiene letra mayuscula.";
    else if (!/[a-z]/.test(password)) errors.password = "La contraseña no contiene letra minuscula.";

    if (!fechaNacimiento) errors.fechaNacimiento = "La fecha de nacimiento es necesaria.";
    else if (fecha > new Date()) errors.fechaNacimiento = "La fecha de nacimiento no puede ser posterior al día actual."

    if (!dni) errors.dni = "El DNI es necesario.";
    else if (dni.length != 9) errors.dni = "La longitud del DNI es incorrecta.";
    else if (!validacionDNI(dni.substring(0, 8), dni.substring(8))) errors.dni = "El DNI no es correcto."

    if (!telefono) errors.telefono = "El numero de telefono es necesario.";
    else if (telefono.length != 9) errors.telefono = "La longitud del numero de telefono es incorrecta.";
    else if (!patronTelefono.test(telefono)) errors.telefono = "El número de teléfono no es válido. Por favor, ingresa un número de teléfono español válido.";

    if (!centro) errors.centro = "Es necesario seleccionar un centro.";


    setErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleRegistro(navigation) {
    if (validacion()) {

      var Data = {
        correo: correo,
        dni: dni,
        tipo: 'Paciente'
      };

      await axios.post(SERVER + 'auth/comprobacionRegistro', Data)
        .then(response => {

          if (response.data.message == "OK") {
            Data = {
              nombre: nombre,
              apellidos: apellidos,
              correo: correo,
              password: password,
              fechaNacimiento: formatDate(fechaNacimiento),
              dni: dni,
              telefono: telefono,
              centro: centro
            };

            axios.post(SERVER + 'auth/registro', Data)
              .then(response => {
                navigation.navigate("Login");
              })
              .catch(error => {
                console.error('Error al enviar la solicitud 2:', error.message);
              });
          }
        })
        .catch(error => {
          console.error('Error al enviar la solicitud 1:', error.message);
        });
    }
  }


  useEffect(() => {
    const loadResources = async () => {
      await loadFonts();

    };

    loadResources();


    fetchData()

  }, []);

  const fetchData = async () => {
    await axios.get(SERVER + 'auth/centros')
      .then(response => {
        setItems(response.data.lista)
      })
      .catch(error => {
        console.error('Error al enviar la solicitud:', error.message);
      });
  }



  const { height, width } = Dimensions.get('window');


  var titleFont, textFont, buttonWidth, buttonHeight;

  if (Platform.OS === 'web' && !isMobile) {
    titleFont = moderateScale(40)
    textFont  = moderateScale(20)
    buttonWidth = width * 0.35
    buttonHeight = height * 0.1
  }
  else {
    titleFont = moderateScale(37)
    textFont  = moderateScale(20)
    buttonWidth = width * 0.8
    buttonHeight = height * 0.1
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
        <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Registro</Text>
        <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
      </SafeAreaView>

      <View style={styles(height, width).container}>
        

        <ScrollView style={{ width: width * 0.9 }} showsVerticalScrollIndicator={false}>
        <Text style={{ flexWrap: 'wrap', width: width * 0.9, fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.03, paddingBottom: height * 0.03 }}>Centro</Text>
       <DropDownPicker
            open={open}
            value={value}
            items={items}
            setOpen={setOpen}
            setValue={setValue}
            setItems={setItems}
            searchable={true}
            placeholderStyle={{
              fontSize: textFont
            }}
            placeholder='Selecciona un centro'
            searchPlaceholder='Introduce el centro que quieres.'
            ListEmptyComponent={({
              listMessageContainerStyle, listMessageTextStyle, ActivityIndicatorComponent, loading, message
            }) => (
              <View style={[listMessageTextStyle, { justifyContent: 'center', alignItems: 'center', fontSize: textFont }]}>
                {loading ? (
                  <ActivityIndicatorComponent />
                ) : (
                  <Text style={[listMessageTextStyle, { textAlign: 'center', fontSize: textFont }]}>
                    No hay centros disponibles
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
              setCentro(item.value)
            }} />
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
              width: width * 0.9,
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
              width: width * 0.9,
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
              width: width * 0.9,
            }} value={correo} onChangeText={setCorreo} autoCapitalize='none' />
          {
            errors.correo ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.correo}</Text> : null
          }
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.03, paddingBottom: height * 0.03 }}>Contraseña</Text>
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
            }} secureTextEntry value={password} onChangeText={setPassword} />
          {
            errors.password ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.password}</Text> :
              <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.03, paddingBottom: height * 0.03, color: 'grey' }}>La contraseña debe tener 1 numero, 1 letra mayuscula y una miniscula, y tener una longitud de 8 caracteres</Text>
          }
          {showPicker && (
            <DateTimePicker
              mode="date"
              value={fecha}
              onChange={onChange}
            />)}
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.03, paddingBottom: height * 0.03 }}>Fecha de Nacimiento</Text>
          <Pressable onPress={toggleDatepicker}>
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
              }} value={fechaNacimiento} onChangeText={setFechaNacimiento} editable={false} />
          </Pressable>
          {
            errors.fechaNacimiento ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.fechaNacimiento}</Text> : null
          }
          <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.03, paddingBottom: height * 0.03 }}>DNI</Text>
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
              width: width * 0.9,
            }} value={telefono} onChangeText={setTelefono} />
          {
            errors.telefono ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.telefono}</Text> : null
          }
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
            Registrarse
          </Text>
        </TouchableOpacity>
      </View>
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
    flex: 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
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
