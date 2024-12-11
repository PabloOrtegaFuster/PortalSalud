import { useEffect, useState, useLayoutEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ActivityIndicator, SafeAreaView, StatusBar, Platform } from 'react-native';
import { GiftedChat, Message } from "react-native-gifted-chat";
import { collection, addDoc, orderBy, query, serverTimestamp, onSnapshot, where, updateDoc, doc } from "firebase/firestore"
import { database } from "../config/firebase"
import * as Font from 'expo-font';
import { isMobile } from 'react-device-detect';
import { moderateScale } from 'react-native-size-matters';
import FooterPaciente from '../components/FooterPaciente';
import FooterMedico from '../components/FooterMedico';


const loadFonts = async () => {
    await Font.loadAsync({
        'Nunito': require('./../assets/fonts/NunitoBold.ttf')
    });
};

export default function Chat({ navigation, route }) {

    const { id1, id2, conversacionId, tipo } = route.params;

    const [mensajes, setMensajes] = useState([])
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const loadResources = async () => {

            await loadFonts();


        };

        loadResources();

        setLoading(false);
    }, []);

    useLayoutEffect(() => {
        const collectionRef = collection(database, 'mensajes')
        const q1 = query(collectionRef,
            where('conversacionId', '==', conversacionId),
            where('user._id', '==', id1),
            where('user2._id', '==', id2),
            orderBy('createdAt', 'desc'));

        const q2 = query(collectionRef,
            where('conversacionId', '==', conversacionId),
            where('user._id', '==', id2),
            where('user2._id', '==', id1),
            orderBy('createdAt', 'desc'));

        const unsubscribeQ1 = onSnapshot(q1, snapshot => {

            const mensajesQ1 = snapshot.docs.map(doc => ({
                _id: doc.id,
                createdAt: doc.data().createdAt.toDate(),
                text: doc.data().text,
                user: doc.data().user
            }));

            const unsubscribeQ2 = onSnapshot(q2, snapshot => {

                const mensajesQ2 = snapshot.docs.map(doc => ({
                    _id: doc.id,
                    createdAt: doc.data().createdAt.toDate(),
                    text: doc.data().text,
                    user: doc.data().user
                }));
                const combinedMensajes = [...mensajesQ1, ...mensajesQ2];

                combinedMensajes.sort((a, b) => b.createdAt - a.createdAt)
          
                setMensajes(combinedMensajes);
                setLoading(false);
            });

            return () => {
                unsubscribeQ2();
            };
        });

        return () => {
            unsubscribeQ1();
        };
    }, []);

    const onSend = useCallback((mensajes = []) => {
        setMensajes(previousMessages => GiftedChat.append(previousMessages, mensajes));

        const { _id, createdAt, text, user } = mensajes[0];

        user2 = {
            _id: id2
        }

        addDoc(collection(database, 'mensajes'), {
            _id,
            createdAt,
            text,
            user,
            user2,
            conversacionId
        })

        updateDoc(doc(database, 'conversaciones', conversacionId), {
            ultimoRemitente: id1,    
            updatedAt: serverTimestamp() 
        });

    }, [])



    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    const { height, width } = Dimensions.get('window');


    var titleFont, textFont = moderateScale(20), messageHeight

    if (Platform.OS === 'web' && !isMobile) {
        titleFont = moderateScale(40)
        messageHeight = height * 0.04
    }
    else {
        titleFont = moderateScale(37)
        messageHeight = height * 0.03
    }

    const renderMessage = (props) => {
        return (
            <Message
                {...props}
                style={{

                }}
                textStyle={{
                    left: {
                        fontFamily: 'Nunito',
                        fontSize: textFont,
                        padding: 3
                    },
                    right: {
                        fontFamily: 'Nunito',
                        fontSize: textFont,
                        padding: 3
                    }
                }}
                renderAvatar={null}
            />
        );
    };

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
                <Text style={{ flexWrap: 'wrap', flex: 15, fontFamily: 'Nunito', textAlign: 'center', fontSize: titleFont }}>Chat</Text>
                <Text style={{ flexWrap: 'wrap', flex: 2 }}></Text>
            </SafeAreaView>
            <View style={styles(height, width).container}>
                {loading ? (  
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                    <GiftedChat
                        messages={mensajes}
                        onSend={mensajes => onSend(mensajes)}
                        user={{
                            _id: id1,
                        }}
                        renderMessage={renderMessage}
                    />
                )}
            </View>

            {tipo === "Paciente" && (
                <FooterPaciente item='chats' navigation={navigation} id={id1}></FooterPaciente>
            )}
            {tipo === "Medico" && (
                <FooterMedico item='pacientes' navigation={navigation} id={id1}></FooterMedico>
            )}
        </View>
    )
}

export const styles = (height, width) => StyleSheet.create({
    container: {
        flex: 8,
        backgroundColor: '#fff',
    },
    header: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: '#F8F8F8',
    },
});