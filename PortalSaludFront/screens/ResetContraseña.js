import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, KeyboardAvoidingView, TextInput, SafeAreaView, StatusBar, Platform } from 'react-native';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { CommonActions } from '@react-navigation/native';
import { SERVER } from '@env';
import { moderateScale } from 'react-native-size-matters';

import axios from 'axios';

const loadFonts = async () => {
    await Font.loadAsync({
        'Nunito': require('./../assets/fonts/NunitoBold.ttf')
    });
};

export default function ContraseñaOlvidada({ navigation, route }) {

    const { correo } = route.params;

    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState("");

    useEffect(() => {
        const loadResources = async () => {
            await loadFonts();

        };

        loadResources();


    }, []);

    const { height, width } = Dimensions.get('window');

    const validacion = () => {
        let errors = {};

        if (!password) errors.password = "La contraseña es necesaria.";
        else if (password.length < 8) errors.password = "La contraseña es demasiado corta.";
        else if (!/\d/.test(password)) errors.password = "La contraseña no contiene numeros.";
        else if (!/[A-Z]/.test(password)) errors.password = "La contraseña no contiene letra mayuscula.";
        else if (!/[a-z]/.test(password)) errors.password = "La contraseña no contiene letra minuscula.";

        setErrors(errors);

        return Object.keys(errors).length === 0;
    }

    async function handleResetPassword(navigation) {
        if (validacion()) {
            var Data = {
                correo: correo,
                password: password,
                token: token
            };


            const response = await axios.post(SERVER + 'auth/reset-contra', Data)
            if (response.data.success) {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{ name: "Home" }],
                    })
                )
            }
            else {
                let errors = {};
                errors.login = response.data.message;
                setErrors(errors)
            }
        }

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
        titleFont = moderateScale(30)
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
                <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Cambiar contraseña</Text>
                <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
            </SafeAreaView>

            <View style={styles.container1}>

                <View style={{ width: viewWidth }}>
                    <Text style={{ flexWrap: 'wrap', paddingTop: height * 0.07 }}></Text>
                    <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingBottom: height * 0.03 }}>Codigo verificación:</Text>
                    <TextInput
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
                        placeholder="Introduce tu codigo"
                        value={token}
                        onChangeText={setToken}
                        autoCapitalize='none' />
                    <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingBottom: height * 0.03 }}>Nueva contraseña:</Text>
                    <TextInput
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
                        secureTextEntry
                        placeholder="Introduce nueva contraseña"
                        value={password}
                        onChangeText={setPassword} />
                    {
                        errors.password ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, color: 'red', marginBottom: 10 }}>{errors.password}</Text> :
                            <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.03, paddingBottom: height * 0.03, color: 'grey' }}>La contraseña debe tener 1 numero, 1 letra mayuscula y una miniscula, y tener una longitud de 8 caracteres</Text>
                    }
                    {
                        errors.login ? <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: textFont, paddingTop: height * 0.05, color: 'red', marginBottom: 10 }}>{errors.login}</Text> : null
                    }
                </View>

            </View>
            <View style={styles.container2}>
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
                    onPress={() => handleResetPassword(navigation)}  >
                    <Text style={{ flexWrap: 'wrap', fontFamily: 'Nunito', fontSize: titleFont, color: 'white' }}>
                        Cambiar
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
