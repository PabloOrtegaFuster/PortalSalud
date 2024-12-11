import { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Font from 'expo-font';
import { CommonActions } from '@react-navigation/native';
import { isMobile } from 'react-device-detect';
import { moderateScale } from 'react-native-size-matters';

const loadFonts = async () => {
    await Font.loadAsync({
        'Nunito': require('./../assets/fonts/NunitoBold.ttf')
    });
};

const Footer = ({ item, navigation, id }) => {

    useEffect(() => {
        const loadResources = async () => {
            await loadFonts();
        };

        loadResources();
    }, []);

    const listadoColors = {
        pendientes: "#8e8e93",
        pacientes: "#8e8e93",
        citas: "#8e8e93",
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
            <View style={{ alignItems: 'center', flex: 1 }}>
                <TouchableOpacity onPress={() =>
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: "ListadoChatsPendientes", params: { id: id } }],
                        })
                    )}>
                    <Icon style={{ fontSize: iconSize, color: listadoColors.pendientes }} name="comments" color="#333" />
                </TouchableOpacity>
                <Text style={{ flexWrap: 'wrap', fontSize: textFont, color: listadoColors.pendientes }}>Pendientes</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
                <TouchableOpacity onPress={() =>
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: "ListadoPacientes", params: { id: id } }],
                        })
                    )}>
                    <Icon style={{ fontSize: iconSize, color: listadoColors.pacientes }} name="users" color="#333" />
                </TouchableOpacity>
                <Text style={{ flexWrap: 'wrap', fontSize: textFont, color: listadoColors.pacientes }}>Pacientes</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
                <TouchableOpacity onPress={() =>
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [{ name: "ListadoCitasMedico", params: { id: id } }],
                        })
                    )}>
                    <Icon style={{ fontSize: iconSize, color: listadoColors.citas }} name="medkit" color="#333" />
                </TouchableOpacity>
                <Text style={{ flexWrap: 'wrap', fontSize: textFont, color: listadoColors.citas }}>Citas</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
                <TouchableOpacity onPress={() => navigation.replace("HorarioMedico", { id: id })}>
                    <Icon style={{ fontSize: iconSize, color: listadoColors.perfil }} name="user"  color="#333" />
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