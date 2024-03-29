import React from "react";
import { GoogleMap, Marker, LoadScript } from "@react-google-maps/api";
import { DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
import "./MapContainer.css";

const mapContainerStyle = {
  width: "800px",
  height: "600px",
};

const defaultCenter = {
  lat: -23.55052,
  lng: -46.633308,
};

class MapContainer extends React.Component {
  state = {
    markers: [],
    directionsResponse: null,
    currentCenter: defaultCenter,
    addingStop: false,
    canCalculateRoute: false,
    distances: [],
  };

  calculateRoute = () => {
    if (this.state.markers.length >= 2) {
      const waypoints = this.state.markers
        .slice(1)
        .map((marker) => ({ location: marker, stopover: true }));

      this.setState({
        directionsServiceOptions: {
          origin: this.state.markers[0],
          destination: this.state.markers[this.state.markers.length - 1],
          waypoints: waypoints,
          travelMode: "DRIVING",
        },
      });
    }
  };

  handleDirectionsResponse = (response) => {
    if (response !== null) {
      this.setState({
        directionsResponse: response,
      });
    }
  };

  onMapClick = (event) => {
    if (this.state.addingStop || this.state.markers.length < 2) {
      const newMarker = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      this.setState((prevState) => ({
        markers: [...prevState.markers, newMarker],
        addingStop: false,
        canCalculateRoute: prevState.markers.length >= 1,
      }));
    }
  };

  addStop = () => {
    this.setState({ addingStop: true });
  };

  geocodeCep = async (cep) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${cep}&key=API_KEY`
      );
      const data = await response.json();
      if (data.status === "OK") {
        return data.results[0].geometry.location; // Retorna as coordenadas do primeiro resultado
      } else {
        console.error("Erro na geocodificação:", data.status);
        return null;
      }
    } catch (error) {
      console.error("Erro ao geocodificar o CEP:", error);
      return null;
    }
  };

  // Função para adicionar CEP
  addCep = async (cep) => {
    const coordinates = await this.geocodeCep(cep);
    if (coordinates) {
      this.setState((prevState) => ({
        markers: [...prevState.markers, coordinates],
        currentCenter: coordinates, // Atualiza o centro do mapa
        addingStop: false,
        canCalculateRoute: prevState.markers.length >= 0,
      }));

      if (this.cepInput) {
        this.cepInput.value = "";
      }
    }
  };

  haversineDistance = (coords1, coords2) => {
    const R = 6371.071; // Raio da Terra em Km
    const rlat1 = coords1.lat * (Math.PI / 180); // Convertendo graus para radianos
    const rlat2 = coords2.lat * (Math.PI / 180);
    const difflat = rlat2 - rlat1; // Diferença em radianos
    const difflon = (coords2.lng - coords1.lng) * (Math.PI / 180);

    const d =
      2 *
      R *
      Math.asin(
        Math.sqrt(
          Math.sin(difflat / 2) * Math.sin(difflat / 2) +
            Math.cos(rlat1) *
              Math.cos(rlat2) *
              Math.sin(difflon / 2) *
              Math.sin(difflon / 2)
        )
      );
    return d;
  };

  calculateDistances = () => {
    const { markers } = this.state;
    const distances = [];

    for (let i = 0; i < markers.length - 1; i++) {
      const distance = this.haversineDistance(markers[i], markers[i + 1]);
      distances.push(distance.toFixed(2)); // Distância em Km
    }

    console.log(this.state);

    this.setState({ distances });
  };

  render() {
    return (
      <LoadScript googleMapsApiKey="API_KEY">
        <div className="map-container">
          <div className="button-container">
            <input
              type="text"
              placeholder="Digite um CEP"
              ref={(ref) => (this.cepInput = ref)}
            />
            <button onClick={() => this.addCep(this.cepInput.value)}>
              Adicionar CEP
            </button>
            <button
              onClick={this.calculateRoute}
              disabled={!this.state.canCalculateRoute}
            >
              Calcular Rota
            </button>
            <button onClick={this.addStop}>Nova Parada</button>
            <button onClick={this.calculateDistances}>
              Calcular Distâncias
            </button>
          </div>
        </div>

        <GoogleMap
          id="map-container"
          mapContainerStyle={mapContainerStyle}
          center={this.state.currentCenter}
          zoom={14}
          onClick={this.onMapClick}
        >
          {this.state.markers.map((marker, index) => (
            <Marker key={index} position={marker} />
          ))}

          {this.state.directionsServiceOptions && (
            <DirectionsService
              options={this.state.directionsServiceOptions}
              callback={this.handleDirectionsResponse}
            />
          )}

          {this.state.directionsResponse && (
            <DirectionsRenderer
              options={{
                directions: this.state.directionsResponse,
              }}
            />
          )}
        </GoogleMap>
        <div className="distance-display">
          {this.state.distances.map((dist, index) => (
            <p key={index}>
              Distância entre o ponto {index} e {index + 1}: {dist} km
            </p>
          ))}
        </div>
      </LoadScript>
    );
  }
}

export default MapContainer;
