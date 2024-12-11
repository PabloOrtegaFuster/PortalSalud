import { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Platform, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Font from 'expo-font';
import { CommonActions } from '@react-navigation/native';
import { isMobile } from 'react-device-detect';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { moderateScale } from 'react-native-size-matters';

const loadFonts = async () => {
    await Font.loadAsync({
        'Nunito': require('./../assets/fonts/NunitoBold.ttf')
    });
};
const removeSession = async () => {
    try {
        await AsyncStorage.removeItem('userData');
    } catch (error) {
        console.error('Error al eliminar la sesión:', error);
    }
};

const logout = async (navigation) => {
    try {
        await removeSession();
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: "Home" }],
            })
        )
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
};

const handleLogout = (navigation) => {
    if (Platform.OS === 'web') {
        const userConfirmed = window.confirm(
            "¿Estás seguro de que deseas cerrar sesión?"
        );
        if (userConfirmed) {
            logout(navigation);
        }
    } else {
        Alert.alert(
            "Confirmar salida",
            "¿Estás seguro de que deseas cerrar sesión?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Salir",
                    onPress: () => {
                        logout(navigation);
                    }
                }
            ],
            { cancelable: true }
        );
    }
};

const Footer = ({ item, navigation }) => {

    useEffect(() => {
        const loadResources = async () => {
            await loadFonts();
        };

        loadResources();
    }, []);

    const listadoColors = {
        modificar: "#8e8e93",
        alta: "#8e8e93",
        solicitudes: "#8e8e93",
        eliminar: "#8e8e93",
        salir: "#8e8e93"
    };

    listadoColors[item] = "#0a84ff";


    const { height, width } = Dimensions.get('window');

    var textFont, iconSize;

    if (Platform.OS === 'web' && !isMobile) {
        textFont = moderateScale(20)
        iconSize = moderateScale(20)
    }
    else {
        textFont = moderateScale(14)
        iconSize = moderateScale(30)
    }

    return (
        <View style={[styles(height, width).footer]}>
            <View style={{ alignItems: 'center', flex: 1 }}>
                <TouchableOpacity onPress={() =>
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: "Editar" }],
                        })
                    )}>
                    <Icon style={{ fontSize: iconSize, color: listadoColors.modificar }} name="edit" color="#333" />
                </TouchableOpacity>
                <Text style={{ flexWrap: 'wrap', fontSize: textFont, color: listadoColors.modificar }}>Modificar</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
                <TouchableOpacity onPress={() =>
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: "Alta" }],
                        })
                    )}>
                    <Icon style={{ fontSize: iconSize, color: listadoColors.alta }} name="plus-circle" color="#333" />
                </TouchableOpacity>
                <Text style={{ flexWrap: 'wrap', fontSize: textFont, color: listadoColors.alta }}>Alta</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
                <TouchableOpacity onPress={() =>
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: "ListadoSolicitudes", params: { tipo: "Pendiente" } }],
                        })
                    )}>
                    <Icon style={{ fontSize: iconSize, color: listadoColors.solicitudes }} name="list-alt" color="#333" />
                </TouchableOpacity>
                <Text style={{ flexWrap: 'wrap', fontSize: textFont, color: listadoColors.solicitudes }}>Solicitudes</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
                <TouchableOpacity onPress={() =>
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: "Eliminar" }],
                        })
                    )}>
                    <Icon style={{ fontSize: iconSize, color: listadoColors.eliminar }} name="trash" color="#333" />
                </TouchableOpacity>
                <Text style={{ flexWrap: 'wrap', fontSize: textFont, color: listadoColors.eliminar }}>Borrar</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
                {/* <TouchableOpacity onPress={() => navigation.replace("ListadoChats", { id: id, otroUsuario: medico })}> */}
                <TouchableOpacity onPress={() => handleLogout(navigation)}>
                    <Icon style={{ fontSize: iconSize, color: listadoColors.salir }} name="sign-out" color="#333" />
                </TouchableOpacity>
                <Text style={{ flexWrap: 'wrap', fontSize: textFont, color: listadoColors.salir }}>Salir</Text>
            </View>
        </View>
    );
};

export const styles = (height, width) => StyleSheet.create({
    footer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#f2f2f2',
    }
});

export default Footer;