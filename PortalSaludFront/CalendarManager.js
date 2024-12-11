import * as Calendar from 'expo-calendar';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import axios from 'axios'
import { SERVER } from '@env';

const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';

const loadSession = async () => {
    try {
        const userData = await AsyncStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error al cargar la sesión:', error);
        return null;
    }
};

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
    try {
        const userData = await loadSession()
        syncEvents(userData.id)

        return BackgroundFetch.Result.NewData; 
    } catch (error) {
        console.error('Error en la tarea de fondo:', error);
        return BackgroundFetch.Result.Failed; 
    }
});

async function requestCalendarPermissions() {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === 'granted';
}

async function createCalendar() {
    const granted = await requestCalendarPermissions();
    if (!granted) {
        console.log('Permisos de calendario no concedidos');
        return null;
    }

    var calendarId = await getDefaultCalendarId();
    if (calendarId === undefined) {
        const defaultCalendarSource = { isLocalAccount: true, name: 'Calendario PortalSalud' };

        const calendarName = 'Mi Calendario de Notificaciones PortalSalud';

        const newCalendar = {
            title: calendarName,
            name: calendarName,
            sourceId: defaultCalendarSource.id,
            source: defaultCalendarSource,
            color: '#FF0000',
            entityType: Calendar.EntityTypes.EVENT,
            sourceId: null,
            ownerAccount: 'personal',
            accessLevel: Calendar.CalendarAccessLevel.READ,
            allowsModifications: true,
            isPrimary: true,
            allowedReminders: [
                Calendar.AlarmMethod.ALARM,
                Calendar.AlarmMethod.ALERT,
                Calendar.AlarmMethod.DEFAULT,
            ],
        };
        calendarId = await Calendar.createCalendarAsync(newCalendar);
    }
    return calendarId;
}

async function initializeCalendarConfig(userId) {
    try {
        const calendarPermissionGranted = await requestCalendarPermissions();

        if (!calendarPermissionGranted) {
            throw new Error('No se otorgaron los permisos necesarios.');
        }

        const newCalendarID = await createCalendar();

        var calendarEvents = await CalendarManager.getAllEvents(newCalendarID)

        for (const calendarEvent of calendarEvents) {
            await Calendar.deleteEventAsync(calendarEvent.id);
        }

        await syncEvents(userId);

        return newCalendarID;
    } catch (error) {
        console.error('Error en la inicialización del calendario:', error);
        return null;
    }
}

async function getCalendars() {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    return calendars;
}

async function getCalendar(calendarID) {
    const calendar = await Calendar.getCalendarAsync(calendarID);
    return calendar;
}

async function getDefaultCalendarId() {
    const calendars = await Calendar.getCalendarsAsync();
    const defaultCalendar = calendars.find(calendar => calendar.title === 'Mi Calendario de Notificaciones PortalSalud');

    if (defaultCalendar === undefined)
        return undefined;

    return defaultCalendar.id;
};

function compareEvents(eventA, eventB) {

    if (eventA.notes !== eventB.notes) {
        return false;
    }

    return true;
}

async function syncEvents(userId) {
    idCalendar = await getDefaultCalendarId();
    Data = {
        id: userId
    };
    let lista1 = []
    const dbEvents = []
    await axios.post(SERVER + 'tomas/listado', Data)
        .then(response => {
            
            lista1 = response.data.lista
            for (const item of lista1) {
                const [desc, hora] = item.descripcion.split(' ');
                dbEvents.push({ notes: desc + ":" + item.id_receta + ":" + item.hora + ":" + item.minutos, id: item.id })
            }
        })
        .catch(error => {
            console.error('Error al enviar la solicitud:', error.message);
        });
    const startDate = new Date();
    const endDate = new Date();

    startDate.setFullYear(startDate.getFullYear() - 1)
    endDate.setFullYear(endDate.getFullYear() + 1)

    var calendarEvents = await Calendar.getEventsAsync([idCalendar], startDate, endDate);
   

    for (const calendarEvent of calendarEvents) {
        const foundDbEvent = dbEvents.find(dbEvent =>
            compareEvents(calendarEvent, dbEvent)
        );
        if (!foundDbEvent) {
            await Calendar.deleteEventAsync(calendarEvent.id);
        }
    }

    var calendarEvents = await Calendar.getEventsAsync([idCalendar], startDate, endDate);

    for (const dbEvent of dbEvents) {
        const foundEvent = await calendarEvents.find(calendarEvent =>
            compareEvents(dbEvent, calendarEvent)
        );


        if (!foundEvent) {
            const evento = await lista1.find(evento => evento.id === dbEvent.id)
            const startDate = new Date();

            startDate.setHours(evento.hora)
            startDate.setMinutes(evento.minutos)
            const endDate = new Date(startDate)
            endDate.setHours(endDate.getHours() + 1)

            const [desc, hora] = evento.descripcion.split(' ');
            await Calendar.createEventAsync(idCalendar, {
                title: 'Notificacion de ' + desc,
                startDate: startDate,
                endDate: endDate,
                allDay: false,
                calendarId: idCalendar,
                notes: desc + ":" + evento.id_receta + ":" + evento.hora + ":" + evento.minutos,
                alarms: [{
                    relativeOffset: 0,
                    method: 'alert'
                }],
                recurrenceRule: {
                    frequency: 'daily',
                    endDate: new Date(evento.fin)
                },
            });
        }
    }



}


async function createEvent(eventDetails) {
    const { title, startDate, endDateF, id_receta, desc, hora, minutos } = eventDetails;

    calendarId = await getDefaultCalendarId()

    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1);

    var eventId
    eventId = await Calendar.createEventAsync(calendarId, {
        title,
        startDate,
        endDate,
        allDay: false,
        calendarId,
        notes: desc + ":" + id_receta + ":" + hora + ":" + minutos,
        alarms: [{
            relativeOffset: 0,
            method: 'alert'
        }],
        recurrenceRule: {
            frequency: 'daily',
            endDate: endDateF
        },
    });
    return eventId;
}

async function getEvents(idCalendar, startDate, endDate) {
    const events = await Calendar.getEventsAsync([idCalendar], startDate, endDate);
    return events;
}

async function getAllEvents(idCalendar) {
    const inicio = new Date()
    inicio.setFullYear(inicio.getFullYear() - 1)
    const fin = new Date()
    fin.setFullYear(fin.getFullYear() + 1)
    const events = await Calendar.getEventsAsync([idCalendar], inicio, fin);
    return events;
}

async function getEvent(eventID) {
    try {
        const event = await Calendar.getEventAsync(eventID);
        return event;
    } catch (error) {
        console.error(`Error al obtener el evento: ${error}`);
        return null;
    }
}

async function deleteEvent(eventID) {
    try {
        await Calendar.deleteEventAsync(eventID);
    } catch (error) {
        console.error(`Error al borrar el evento: ${error}`);
    }
}

async function deleteAllEvents() {
    try {
        var events = await getAllEvents(await getDefaultCalendarId())
        for (const calendarEvent of events) {
            await Calendar.deleteEventAsync(calendarEvent.id);
        }
    } catch (error) {
        console.error(`Error al borrar el evento: ${error}`);
    }
}

export const CalendarManager = {
    createCalendar,
    getCalendars,
    getCalendar,
    createEvent,
    getDefaultCalendarId,
    requestCalendarPermissions,
    getEvents,
    getAllEvents,
    getEvent,
    deleteEvent,
    deleteAllEvents,
    syncEvents,
    initializeCalendarConfig, 
};
