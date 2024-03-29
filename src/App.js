import MapContainer from "./components/MapContainer";

import React, { Component } from "react";

class App extends Component {
  render() {
    return (
      <div className="App">
      <header className="App-header">
        <h1 className="App-title">Bem-vindo ao Mapa</h1>
      </header>
      <MapContainer />
    </div>

    );
  }
}

export default App;
