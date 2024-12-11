import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, SafeAreaView, StatusBar, Platform } from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { Agenda, LocaleConfig } from 'react-native-calendars';
import { SERVER } from '@env';
import axios from 'axios';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTokens, storeTokens, clearTokens } from '../components/TokenStorage'
import Footer from '../components/FooterMedico';
import { useIsFocused } from '@react-navigation/native';
import { moderateScale } from 'react-native-size-matters';

LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
  today: 'Hoy'
};

LocaleConfig.defaultLocale = 'es';

const loadFonts = async () => {
  await Font.loadAsync({
    'Nunito': require('./../assets/fonts/NunitoBold.ttf')
  });
};

export default function ListadoCitasMedico({ navigation, route }) {
  const { id } = route.params;

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; 
  };

  const [items, setItems] = useState({});
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const isFocused = useIsFocused(); 


  const transformToAgendaFormat = (data) => {
    const items2 = {}; 


    if (data.success && Array.isArray(data.lista)) {
      data.lista.forEach(item => {
        const [time, date] = item.time.split(' '); 
        const [day, month, year] = date.split('-'); 

        const formattedDate = `${year}-${month}-${day}`;

        const cita = {
          name: `${item.name}`,
          time: time 
        };

        if (!items2[formattedDate]) {
          items2[formattedDate] = []; 
        }
        items2[formattedDate].push(cita); 
      });
    }

    return items2;
  };


  useEffect(() => {
    if (isFocused) {
      fetchData();
    }

    const loadResources = async () => {
      await loadFonts();
    };

    loadResources();
  }, [isFocused]);

  const fetchData = async () => {
    try {
      const { accessToken, refreshToken } = await getTokens();
      Data = {
        id: id
      };

      const response = await axios.post(SERVER + 'citas/listadoMedico', Data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-refresh-token': refreshToken,
        }
      })
      
      const formattedItems = transformToAgendaFormat(response.data);
      setItems(formattedItems);
      const firstDate = Object.keys(formattedItems)[0]; 
      setSelectedDate(firstDate); 


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

  const { height, width } = Dimensions.get('window');

  var titleFont, buttonWidth, buttonHeight, windowWidth, textFont, padding;

  if (Platform.OS === 'web' && !isMobile) {
    titleFont = moderateScale(40)
    buttonWidth = width * 0.35
    buttonHeight = height * 0.1
    textFont = 25
    paddingHeight = moderateScale(80)
    padding = moderateScale(5)
    windowWidth = '20%'
  }
  else {
    titleFont = moderateScale(40)
    buttonWidth = width * 0.8
    buttonHeight = height * 0.1
    textFont = width * 0.05
    paddingHeight = moderateScale(100)
    padding = moderateScale(10)
    windowWidth= '40%'
  }


  const renderItem = (item) => {
    return (
      <View style={{ height: paddingHeight, justifyContent: 'center', backgroundColor: '#fff' }}>

        <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont }}>{item.name}</Text>
        <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'gray' }}>{item.time}</Text>
      </View>
    );
  };


  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden={false} translucent={true} />
      <SafeAreaView style={styles(height, width).header}>
        <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont }}>Citas</Text>
      </SafeAreaView>

      <View style={styles(height, width).container}>
        <Agenda
          items={items}
          renderItem={renderItem}
          selected={selectedDate} 
          minDate={getTodayDate()}  
          firstDay={1}
          hideKnob={false}
          theme={{
            selectedDayBackgroundColor: '#00adf5',
            todayTextColor: '#00adf5',
            agendaDayTextColor: 'gray',

          }}
          renderEmptyData={() => (
            <View style={{ padding: moderateScale(3), backgroundColor: '#fff' }}>
              <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont }}>No hay citas actualmente</Text>
            </View>
          )}
          renderDay={(day, item) => {
            if (!day) return <View />;

            const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

            const diaSemana = diasSemana[day.getDay()]; 
            const diaMes = day.getDate(); 
            const mes = meses[day.getMonth()]; 

            const formattedDay = `${diaSemana}, ${diaMes} ${mes}`;

            return (
              <View style={{ height: paddingHeight, width: windowWidth, padding: padding, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
                <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont }}>{diaSemana}</Text>
                <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont }}>{diaMes} {mes}</Text>
              </View>
            );
          }}
        />
      </View>



      <Footer item='citas' navigation={navigation} id={id}></Footer>

    </View>

  );

};


export const styles = (height, width) => StyleSheet.create({
  container: {
    flex: 8,
    backgroundColor: '#fff',
  },
  header: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',

  }
});


