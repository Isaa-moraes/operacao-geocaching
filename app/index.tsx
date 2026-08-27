import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Alert, StatusBar } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';

interface Coordenadas {
    latitude: number;
    longitude: number;
}

// 2. Coordenadas do pátio do SESI
const TESOURO_COORDS: Coordenadas = {
    latitude: -21.800481,
    longitude: -50.884091,
};

const RAIO_VITORIA: number = 8;

export default function GameScreen() {
    const [location, setLocation] = useState<Coordenadas | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [vitoria, setVitoria] = useState<boolean>(false);

    useEffect(() => {
        let locationSubscription: Location.LocationSubscription | null = null;

        const iniciarRadar = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permissão de localização negada pelo usuário.');
                return;
            }

            locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    distanceInterval: 1,
                    timeInterval: 1000,
                },
                (newLocation) => {
                    const userCoords: Coordenadas = {
                        latitude: newLocation.coords.latitude,
                        longitude: newLocation.coords.longitude,
                    };

                    setLocation(userCoords);

                    const dist = getDistance(userCoords, TESOURO_COORDS);
                    setDistance(dist);

                    if (dist <= RAIO_VITORIA) {
                        setVitoria(true);
                        if (locationSubscription) {
                            locationSubscription.remove();
                        }
                    }
                }
            );
        };

        iniciarRadar();

        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, []);

    if (errorMsg) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>❌ {errorMsg}</Text>
            </View>
        );
    }

    if (!location || distance === null) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#00796B" />
                <Text style={styles.loadingText}>SINTONIZANDO SATÉLITES RADAR...</Text>
            </View>
        );
    }


    let hudStyle = styles.gelado;
    let hudText = "❄️ SCANNER: DISTANTE";
    let statusColor = "#1E88E5";

    if (distance < 20) {
        hudStyle = styles.fogo;
        hudText = "🔥 ALERTA: MUITO PERTO!";
        statusColor = "#E53935";
    } else if (distance <= 100) {
        hudStyle = styles.quente;
        hudText = "⚡ SCANNER: EM APROXIMAÇÃO";
        statusColor = "#FB8C00";
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={statusColor} />

            {/* 1. Mapeamento de Satélite */}
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.002,
                    longitudeDelta: 0.002,
                }}
                showsUserLocation={true}
            >
                <Marker
                    coordinate={TESOURO_COORDS}
                    title="🎯 ALVO: CÓDIGO DO FUNDADOR"
                    description="Siga em direção a este ponto no pátio!"
                    pinColor="#E53935"
                />
            </MapView>

            <View style={[styles.hud, hudStyle]}>
                <Text style={styles.hudTitle}>{hudText}</Text>
                <View style={styles.divider} />
                <Text style={styles.hudDistance}>MENSURAÇÃO DE DISTÂNCIA</Text>
                <Text style={styles.distanceValue}>{distance} <Text style={styles.meterUnit}>METROS</Text></Text>
            </View>

            {/* Interface de Vitória */}
            {vitoria && (
                <View style={styles.vitoriaContainer}>
                    <Text style={styles.vitoriaEmoji}>🏆</Text>
                    <Text style={styles.vitoriaTitle}>OPERAÇÃO CONCLUÍDA</Text>
                    <Text style={styles.vitoriaSub}>Você alcançou as coordenadas e obteve o sinal do Fundador.</Text>
                    <TouchableOpacity
                        style={styles.recompensaBtn}
                        onPress={() => Alert.alert("Dados Extraídos", "Código do Fundador: SESI_GEO_FOUNDER_2026")}
                    >
                        <Text style={styles.recompensaBtnText}>DESCRIPTOGRAFAR RECOMPENSA</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5'
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 20
    },
    map: {
        flex: 1
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    loadingText: {
        color: '#00796B',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginTop: 15
    },
    hud: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    gelado: { 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        borderColor: '#1E88E5' 
    },
    quente: { 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        borderColor: '#FB8C00' 
    },
    fogo: { 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        borderColor: '#E53935' 
    },
    hudTitle: { 
        color: '#212121', 
        fontSize: 13, 
        fontWeight: '900', 
        letterSpacing: 1.5 
    },
    divider: { 
        width: '100%', 
        height: 1, 
        backgroundColor: 'rgba(0,0,0,0.1)', 
        marginVertical: 8 
    },
    hudDistance: { 
        color: '#616161', 
        fontSize: 10, 
        fontWeight: 'bold', 
        letterSpacing: 1 
    },
    distanceValue: { 
        color: '#212121', 
        fontSize: 34, 
        fontWeight: '900', 
        marginTop: 2 
    },
    meterUnit: { 
        fontSize: 16, 
        fontWeight: '300', 
        color: '#616161' 
    },
    vitoriaContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    vitoriaEmoji: { 
        fontSize: 60, 
        marginBottom: 10 
    },
    vitoriaTitle: { 
        fontSize: 24, 
        color: '#388E3C', 
        fontWeight: '900', 
        letterSpacing: 3 
    },
    vitoriaSub: { 
        fontSize: 14, 
        color: '#455A64', 
        textAlign: 'center', 
        marginTop: 10, 
        marginBottom: 30, 
        lineHeight: 22 
    },
    recompensaBtn: { 
        backgroundColor: '#388E3C', 
        paddingVertical: 14, 
        paddingHorizontal: 35, 
        borderRadius: 25 
    },
    recompensaBtnText: { 
        color: '#FFF', 
        fontSize: 15, 
        fontWeight: '900', 
        letterSpacing: 1 
    },
});