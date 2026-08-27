import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Alert, StatusBar } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';

// Tipagem estrita para as coordenadas geográficas
interface Coordenadas {
  latitude: number;
  longitude: number;
}

// 2. O ALVO OCULTO - Coordenadas exatas do SESI de Osvaldo Cruz
// Nota: Substitua pelas coordenadas precisas do pátio se necessário
const TESOURO_COORDS: Coordenadas = {
  latitude: -21.7972, 
  longitude: -50.8714, 
};

// S: Gestão de Previsão - Definição de margem de tolerância do hardware de GPS
const RAIO_VITORIA: number = 8; // Menos de 8 metros ativa a vitória (Evita distance === 0)

export default function GameScreen() {
  const [location, setLocation] = useState<Coordenadas | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [vitoria, setVitoria] = useState<boolean>(false);

  useEffect(() => {
    // S: Otimização de Hardware - Variável para guardar a inscrição do GPS
    let locationSubscription: Location.LocationSubscription | null = null;

    const iniciarRadar = async () => {
      // Solicitação de permissões em primeiro plano
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permissão de localização negada pelo usuário.');
        return;
      }

      // 3. Sistema de Radar Real-time e S: Otimização de Hardware
      // Atualiza a cada 1 metro percorrido no pátio ou a cada 1 segundo
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced, // Uso equilibrado para poupar bateria
          distanceInterval: 1, 
          timeInterval: 1000,   
        },
        (newLocation) => {
          const userCoords: Coordenadas = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };
          
          setLocation(userCoords);

          // Cálculo matemático de distância usando geolib
          const dist = getDistance(userCoords, TESOURO_COORDS);
          setDistance(dist);

          // 5. Estado de Vitória (Cálculo com o raio de tolerância do GPS)
          if (dist <= RAIO_VITORIA) {
            setVitoria(true);
            // S: Otimização de Hardware - Interrompe o rastreio assim que alcança o alvo
            if (locationSubscription) {
              locationSubscription.remove();
            }
          }
        }
      );
    };

    iniciarRadar();

    // S: Otimização de Hardware - Limpa a inscrição ao sair da tela/desmontar o componente
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Telas de carregamento e erro tratadas de forma limpa
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
        <ActivityIndicator size="large" color="#00E676" />
        <Text style={styles.loadingText}>SINTONIZANDO SATÉLITES RADAR...</Text>
      </View>
    );
  }

  // 4. HUD DINÂMICO - Lógica de feedback visual ("Quente ou Frio") baseado na distância
  let hudStyle = styles.gelado;
  let hudText = "❄️ SCANNER: GELADO (FORA DE ALCANCE)";
  let statusColor = "#1A237E"; // Azul para a StatusBar

  if (distance < 20) {
    hudStyle = styles.fogo;
    hudText = "🔥 ALERTA: FOGO! SINAL CRÍTICO";
    statusColor = "#D50000"; // Vermelho
  } else if (distance <= 100) {
    hudStyle = styles.quente;
    hudText = "⚡ SCANNER: QUENTE (APROXIMAÇÃO)";
    statusColor = "#FF6D00"; // Laranja
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={statusColor} />
      
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
        customMapStyle={darkMapStyle} // S: UI/UX Imersivo - Tema estilo hacker/game
      >
        {/* 2. O Alvo Oculto - O marcador só renderiza se estiver a 10 metros ou menos */}
        {distance <= 10 && (
          <Marker
            coordinate={TESOURO_COORDS}
            title="🎯 ALVO DETECTADO!"
            description="Código do Fundador pronto para extração."
          />
        )}
      </MapView>

      {/* 4. HUD Dinâmico (Heads-Up Display) Translúcido */}
      <View style={[styles.hud, hudStyle]}>
        <Text style={styles.hudTitle}>{hudText}</Text>
        <View style={styles.divider} />
        <Text style={styles.hudDistance}>MENSURAÇÃO DE DISTÂNCIA</Text>
        <Text style={styles.distanceValue}>{distance} <Text style={styles.meterUnit}>METROS</Text></Text>
      </View>

      {/* 5. Estado de Vitória - Bloqueio de tela com recompensa */}
      {vitoria && (
        <View style={styles.vitoriaContainer}>
          <Text style={styles.vitoriaEmoji}>🏆</Text>
          <Text style={styles.vitoriaTitle}>OPERAÇÃO CONCLUÍDA</Text>
          <Text style={styles.vitoriaSub}>Você decifrou a localização de campo e obteve o sinal do Fundador.</Text>
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

// S: UI/UX Imersivo - Estilização do mapa para parecer um jogo de aventura tecnológica
const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#121212" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2a2a2a" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', padding: 20 },
  map: { flex: 1 },
  errorText: { color: '#FF5252', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  loadingText: { color: '#00E676', fontSize: 11, fontWeight: 'bold', letterSpacing: 2, marginTop: 15 },
  
  // HUD Estilizado com Opacidade (Efeito Vidro/Sci-Fi)
  hud: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  gelado: { backgroundColor: 'rgba(18, 26, 51, 0.9)', borderColor: '#2979FF' },
  quente: { backgroundColor: 'rgba(51, 26, 0, 0.9)', borderColor: '#FF9100' },
  fogo: { backgroundColor: 'rgba(51, 0, 0, 0.95)', borderColor: '#FF1744' },
  
  hudTitle: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  divider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 8 },
  hudDistance: { color: '#B0BEC5', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  distanceValue: { color: '#FFF', fontSize: 34, fontWeight: '900', marginTop: 2 },
  meterUnit: { fontSize: 16, fontWeight: '300' },

  // Interface de Vitória Total
  vitoriaContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.97)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  vitoriaEmoji: { fontSize: 60, marginBottom: 10 },
  vitoriaTitle: { fontSize: 24, color: '#00E676', fontWeight: '900', letterSpacing: 3 },
  vitoriaSub: { fontSize: 14, color: '#B0BEC5', textAlign: 'center', marginTop: 10, marginBottom: 30, lineHeight: 22 },
  recompensaBtn: { backgroundColor: '#00E676', paddingVertical: 14, paddingHorizontal: 35, borderRadius: 25 },
  recompensaBtnText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
});