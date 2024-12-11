import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { CommonActions } from '@react-navigation/native';
import { moderateScale } from 'react-native-size-matters';

const loadFonts = async () => {
    await Font.loadAsync({
        'Nunito': require('./../assets/fonts/NunitoBold.ttf')
    });
};

const Footer = ({ item, navigation, id }) => {


    const [medico, setMedico] = useState("");

    useEffect(() => {
        const loadResources = async () => {
            await loadFonts();
            const userData = await AsyncStorage.getItem('userData');
            const user = JSON.parse(userData)
            setMedico(user.medico)
        };

        loadResources();
    }, []);


    const listadoColors = {
        tomas: "#8e8e93",
        recetas: "#8e8e93",
        citas: "#8e8e93",
        chats: "#8e8e93",
        perfil: "#8e8e93"
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
            {Platform.OS !== "web" && (
                <View style={{ alignItems: 'center', flex: 1 }}>
                    <TouchableOpacity onPress={() =>
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: "ListadoTomas", params: { id } }],
                            })
                        )}>
                        <Icon style={{ fontSize: iconSize, color: listadoColors.tomas }} name="clock-o" color="#333" />
                    </TouchableOpacity>
                    <Text style={{ flexWrap: 'wrap', fontSize: textFont, color: listadoColors.tomas }}>Tomas</Text>
                </View>)}

            <View style={{ alignItems: 'center', flex: 1 }}>
                <TouchableOpacity onPress={() =>
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: "ListadoRecetas", params: { id: id, tipo: "Paciente" } }],
                        })
                    )}>
                    <Icon style={{ fontSize: iconSize, color: listadoColors.recetas }} name="file-text-o" color="#333" />
                </TouchableOpacity>
                <Text style={{ flexWrap: 'wrap', fontSize: textFont, color: listadoColors.recetas }}>Recetas</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
                <TouchableOpacity onPress={() =>
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: "ListadoCitas", params: { id: id, tipo: "Paciente" } }],
                        })
                    )}>
                    <Icon style={{ fontSize: iconSize, color: listadoColors.citas }} name="medkit" color="#333" />
                </TouchableOpacity>
                <Text style={{ flexWrap: 'wrap', fontSize: textFont, color: listadoColors.citas }}>Citas</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
                <TouchableOpacity onPress={() =>
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: "ListadoChats", params: { id1: id, id2: medico, tipo: "Paciente" } }],
                        })
                    )}>
                    <Icon style={{ fontSize: iconSize, color: listadoColors.chats }} name="comments-o" color="#333" />
                </TouchableOpacity>
                <Text style={{ flexWrap: 'wrap', fontSize: textFont, color: listadoColors.chats }}>Chat</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
                {/* <TouchableOpacity onPress={() => navigation.replace("ListadoChats", { id: id, otroUsuario: medico })}> */}
                <TouchableOpacity onPress={() =>
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: "Perfil", params: { id: id } }],
                        })
                    )}>
                    <Icon style={{ fontSize: iconSize, color: listadoColors.perfil }} name="user" color="#333" />
                </TouchableOpacity>
                <Text style={{ flexWrap: 'wrap', fontSize: textFont, color: listadoColors.perfil }}>Perfil</Text>
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