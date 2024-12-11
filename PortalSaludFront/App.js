import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/Login";
import RegistroScreen from "./screens/Registro";
import ContraseñaOlvidadaScreen from "./screens/ContraseñaOlvidada";
import ResetContraseñaScreen from "./screens/ResetContraseña";

import ListadoTomasScreen from "./screens/ListadoTomas";
import NuevaTomaScreen from "./screens/NuevaToma";
import DetalleTomaScreen from "./screens/DetalleToma";

import ListadoRecetasScreen from "./screens/ListadoRecetas";
import ListadoRecetasExpiradasScreen from "./screens/ListadoRecetasExpiradas";
import DetalleRecetaScreen from "./screens/DetalleReceta";
import CrearRecetaScreen from "./screens/CrearReceta";

import ListadoCitasScreen from "./screens/ListadoCitas";
import SolicitarCitaScreen from "./screens/SolicitarCita";
import SolicitarCitaHoraScreen from "./screens/SolicitarCitaHora";
import DetalleCitaScreen from "./screens/DetalleCita";


import ListadoCitasMedicoScreen from "./screens/ListadoCitasMedico";

import ListadoChatsScreen from "./screens/ListadoChats";
import ListadoChatsPendientesScreen from "./screens/ListadoChatsPendientes";
import CrearChatScreen from "./screens/CrearChat";
import ChatScreen from "./screens/Chat";

import ListadoPacientesScreen from "./screens/ListadoPacientes";
import ListadoUsuariosAdministradorScreen from "./screens/ListadoUsuariosAdministrador";


import PacienteScreen from "./screens/Paciente";
import PerfilScreen from "./screens/Perfil";
import HorarioMedicoScreen from "./screens/HorarioMedico";

import AltaCentroScreen from "./screens/AltaCentro";
import EditarCentroScreen from "./screens/EditarCentro";
import ListadoCentrosScreen from "./screens/ListadoCentros";

import AltaMedicamentoScreen from "./screens/AltaMedicamento";
import EditarMedicamentoScreen from "./screens/EditarMedicamento";
import ListadoMedicamentosScreen from "./screens/ListadoMedicamentos";

import ListadoSolicitudesScreen from "./screens/ListadoSolicitudes";
import SolicitudScreen from "./screens/Solicitud";
import SolicitarCambiosScreen from "./screens/SolicitarCambios";

import AltaScreen from "./screens/Alta";
import EditarScreen from "./screens/Editar";
import EliminarScreen from "./screens/Eliminar";
import AltaUsuarioScreen from "./screens/AltaUsuario";
import EditarUsuarioScreen from "./screens/EditarUsuario";


const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Registro" component={RegistroScreen} />
        <Stack.Screen name="ContraseñaOlvidada" component={ContraseñaOlvidadaScreen} />
        <Stack.Screen name="ResetContraseña" component={ResetContraseñaScreen} />
        <Stack.Screen name="ListadoTomas" component={ListadoTomasScreen} />
        <Stack.Screen name="NuevaToma" component={NuevaTomaScreen} />
        <Stack.Screen name="DetalleToma" component={DetalleTomaScreen} />        
        <Stack.Screen name="ListadoRecetas" component={ListadoRecetasScreen} />
        <Stack.Screen name="ListadoRecetasExpiradas" component={ListadoRecetasExpiradasScreen} />
        <Stack.Screen name="DetalleReceta" component={DetalleRecetaScreen} />
        <Stack.Screen name="CrearReceta" component={CrearRecetaScreen} />     
        <Stack.Screen name="ListadoCitas" component={ListadoCitasScreen} />
        <Stack.Screen name="SolicitarCita" component={SolicitarCitaScreen} />
        <Stack.Screen name="SolicitarCitaHora" component={SolicitarCitaHoraScreen} />
        <Stack.Screen name="DetalleCita" component={DetalleCitaScreen} />
        <Stack.Screen name="ListadoChats" component={ListadoChatsScreen} />
        <Stack.Screen name="ListadoChatsPendientes" component={ListadoChatsPendientesScreen} />
        <Stack.Screen name="CrearChat" component={CrearChatScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="ListadoCitasMedico" component={ListadoCitasMedicoScreen} />        
        <Stack.Screen name="ListadoPacientes" component={ListadoPacientesScreen} />
        <Stack.Screen name="Paciente" component={PacienteScreen} />
        <Stack.Screen name="Perfil" component={PerfilScreen} />
        <Stack.Screen name="HorarioMedico" component={HorarioMedicoScreen} />
        <Stack.Screen name="Eliminar" component={EliminarScreen} />
        <Stack.Screen name="Alta" component={AltaScreen} />
        <Stack.Screen name="AltaUsuario" component={AltaUsuarioScreen} />       
        <Stack.Screen name="ListadoSolicitudes" component={ListadoSolicitudesScreen} />
        <Stack.Screen name="Solicitud" component={SolicitudScreen} />
        <Stack.Screen name="SolicitarCambios" component={SolicitarCambiosScreen} />        
        <Stack.Screen name="ListadoUsuariosAdministrador" component={ListadoUsuariosAdministradorScreen} />
        <Stack.Screen name="EditarUsuario" component={EditarUsuarioScreen} />
        <Stack.Screen name="Editar" component={EditarScreen} />                
        <Stack.Screen name="AltaCentro" component={AltaCentroScreen} />
        <Stack.Screen name="EditarCentro" component={EditarCentroScreen} />
        <Stack.Screen name="ListadoCentros" component={ListadoCentrosScreen} />       
        <Stack.Screen name="AltaMedicamento" component={AltaMedicamentoScreen} />
        <Stack.Screen name="EditarMedicamento" component={EditarMedicamentoScreen} />
        <Stack.Screen name="ListadoMedicamentos" component={ListadoMedicamentosScreen} />     
      </Stack.Navigator>
    </NavigationContainer>
  )
};

