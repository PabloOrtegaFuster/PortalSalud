import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, KeyboardAvoidingView, TextInput, SafeAreaView, StatusBar, Platform } from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarManager } from '../CalendarManager';
import { CommonActions } from '@react-navigation/native';
import axios from 'axios';
import { clearTokens, storeTokens } from '../components/TokenStorage'
import { SERVER } from '@env';
import { moderateScale } from 'react-native-size-matters';

const loadFonts = async () => {
    await Font.loadAsync({
        'Nunito': require('./../assets/fonts/NunitoBold.ttf')
    });
};


export default function Login({ navigation }) {

    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState("");

    useEffect(() => {
        const loadResources = async () => {
            await loadFonts();

        };

        loadResources();
    }, []);

    const { height, width } = Dimensions.get('window');

    const saveSession = async (userData) => {
        try {
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            
        } catch (error) {
        }
    };

    async function handleLogin(navigation) {

        try {

            var Data = {
                correo: correo,
                password: password,
            };

            const response = await axios.post(SERVER + 'auth/login', Data)

            if (response.data.success) {
                const { id, tipo, accessToken, refreshToken } = response.data;
                var tipoaux = tipo
                var pagina;
                if (tipo == "Paciente") {
                    const medico = response.data.medico
                    Data = {
                        correo: Data.correo,
                        password: Data.password,
                        id: id,
                        tipo: tipo,
                        medico: medico
                    };
                    pagina = "ListadoCitas"
                }
                else if (tipo == "Medico") {
                    Data = {
                        correo: Data.correo,
                        password: Data.password,
                        id: id,
                        tipo: tipo,
                    };
                    pagina = "ListadoCitasMedico"
                }
                else if (tipo == "Administrador") {
                    Data = {
                        correo: Data.correo,
                        password: Data.password,
                        id: id,
                        tipo: tipo,
                    };
                    pagina = "ListadoSolicitudes"
                    tipoaux = "Pendiente"
                }

                await saveSession(Data)
                await storeTokens(accessToken, refreshToken);
                if (Platform.OS !== 'web' && tipo == "Paciente")

                    await CalendarManager.initializeCalendarConfig(id)

                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: pagina, params: { id: id, tipo: tipoaux } }],
                    })
                )

            }
            else {
                let errors = {};

                errors.login = response.data.message;
                setErrors(errors)
            }
        }
        catch (err) {
        }
    }

    const handleForgot = (navigation) => {
        navigation.navigate("ContraseñaOlvidada")
    }


    var titleFont, textFont, paddingTitle, buttonWidth, buttonHeight, viewWidth, viewHeight

    if (Platform.OS === 'web' && !isMobile) {
        titleFont = moderateScale(40)
        textFont = moderateScale(20)
        paddingTitle = width * 0.33
        buttonWidth = 455
        buttonHeight = 192
        viewWidth = width * 0.55
        viewHeight = height * 0.05
    }
    else {
        titleFont = moderateScale(37)
        textFont = moderateScale(20)
        paddingTitle = width * 0.10
        buttonWidth = width * 0.9
        buttonHeight = height * 0.15
        viewWidth = width * 0.9
        viewHeight = height * 0.05
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior='height' enabled={false}>
            <SafeAreaView style={styles.header}>




                <Text style={{ flexWrap: 'wrap', flex: 1 }}></Text>
                <TouchableOpacity
                    onPress={() => navigation.goBack()} style={{ flex: 1, alignItems: 'flex-start' }} >
                    <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: '#24a0ed' }}>
                        {"<"}
                    </Text>
                </TouchableOpacity>
                <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Iniciar sesión</Text>
                <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
            </SafeAreaView>

            <View style={styles.container1}>

                <View style={{ width: viewWidth }}>
                    <Text style={{ flexWrap: 'wrap', paddingTop: height * 0.07 }}></Text>
                    <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingBottom: height * 0.03 }}>Correo electrónico:</Text>
                    <TextInput
                        accessibilityLabel='Correo'
                        style={{
                            fontFamily: 'Nunito',
                            fontSize: textFont,
                            alignItems: 'center',
                            justifyContent: 'center',
                            elevation: 8,
                            backgroundColor: '#E3E3E3',
                            borderRadius: 10,
                            height: viewHeight,
                            width: viewWidth,
                        }}
                        placeholder="Introduce tu correo"
                        value={correo}
                        onChangeText={setCorreo}
                        autoCapitalize='none' />
                    <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: viewHeight, paddingBottom: height * 0.03 }}>Contraseña</Text>
                    <TextInput
                        accessibilityLabel='Password'
                        style={{
                            fontFamily: 'Nunito',
                            fontSize: textFont,
                            alignItems: 'center',
                            justifyContent: 'center',
                            elevation: 8,
                            backgroundColor: '#E3E3E3',
                            borderRadius: 10,
                            height: viewHeight,
                            width: viewWidth,
                        }} placeholder="Introduce tu contraseña"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        autoCapitalize='none'
                    />
                    {
                        errors.login ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.05, color: 'red', marginBottom: 10 }}>{errors.login}</Text> : null
                    }
                </View>

            </View>
            <View style={styles.container2}>
                <TouchableOpacity
                    onPress={() => handleForgot(navigation)}  >
                    <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: '#24a0ed' }}>
                        He olvidado mi contraseña
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    accessibilityLabel='Acceder'
                    style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        elevation: 8,
                        backgroundColor: '#24a0ed',
                        borderRadius: 10,
                        height: buttonHeight,
                        width: buttonWidth,
                    }}
                    onPress={() => handleLogin(navigation)}  >
                    <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
                        Acceder
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );

};

const styles = StyleSheet.create({
    container1: {
        flex: 6,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    container2: {
        flex: 3,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    header: {
        flex: 1,
        paddingTop: StatusBar.currentHeight,
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: '#F8F8F8',

    },
    input: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        marginBottom: 15,
        padding: 10,
        borderRadius: 5,
    }
});
