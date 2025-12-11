import { useState } from 'react';
import { Map, Navigation, Zap, MapPin, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

function RouteOptimization() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [optimized, setOptimized] = useState(false);

  const loadRoutes = async () => {
    setLoading(true);
    setOptimized(false);
    try {
      const response = await axios.get('/api/repairs/route/optimize', {
        params: { date: selectedDate }
      });
      setRoutes(response.data.data);
    } catch (error) {
      console.error('Fehler beim Laden der Routen:', error);
    } finally {
      setLoading(false);
    }
  };

  const optimizeRoute = () => {
    // PLATZHALTER: Routenoptimierung
    setOptimized(true);
    alert('Routenoptimierung: Diese Funktion wird zukünftig mit Google Maps API oder GraphHopper implementiert!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Routenplanung</h1>
        <p className="text-gray-600 mt-1">
          Optimieren Sie Ihre Reparaturrouten geografisch
        </p>
      </div>

      {/* Routenoptimierung Platzhalter Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-semibold text-purple-900">
              Routenoptimierung (Platzhalter)
            </h3>
            <p className="text-sm text-purple-700 mt-1">
              Diese Funktion wird in Zukunft eine intelligente Routenoptimierung bieten.
            </p>
            <ul className="text-sm text-purple-700 mt-2 list-disc list-inside">
              <li>Geografische Optimierung basierend auf Kundenstandorten</li>
              <li>Minimierung der Fahrtzeit und Distanz</li>
              <li>Integration mit Google Maps oder GraphHopper</li>
              <li>Berücksichtigung von Verkehrslage (live)</li>
              <li>Automatische Terminvorschläge für Voice Bot</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Datums-Auswahl */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datum auswählen
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex gap-2 items-end">
            <button
              onClick={loadRoutes}
              disabled={loading}
              className="btn-primary flex items-center"
            >
              <Map className="h-5 w-5 mr-2" />
              {loading ? 'Lade...' : 'Routen laden'}
            </button>
            {routes.length > 0 && (
              <button
                onClick={optimizeRoute}
                className="btn-primary bg-green-600 hover:bg-green-700 flex items-center"
              >
                <Zap className="h-5 w-5 mr-2" />
                Optimieren
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Routen-Übersicht */}
      {routes.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Reparaturen am {new Date(selectedDate).toLocaleDateString('de-DE')}
            </h2>
            {optimized && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                ✓ Optimiert
              </span>
            )}
          </div>

          <div className="space-y-4">
            {routes.map((route, index) => (
              <div
                key={route.AuftragCode}
                className="border-l-4 border-primary-500 bg-gray-50 p-4 rounded-r-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {route.KundeName}
                    </h3>

                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {route.Strasse}, {route.PLZ} {route.Ort}
                    </div>

                    {route.Datum && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        {new Date(route.Datum).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}

                    {route.Bemerkung && (
                      <p className="mt-2 text-sm text-gray-600">
                        {route.Bemerkung}
                      </p>
                    )}
                  </div>

                  {/* PLATZHALTER: Entfernung zum nächsten Punkt */}
                  {index < routes.length - 1 && (
                    <div className="text-sm text-gray-500">
                      <Navigation className="h-4 w-4 inline mr-1" />
                      <span className="text-xs">
                        → {Math.floor(Math.random() * 15) + 1} km
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Gesamt-Statistik (Platzhalter) */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {routes.length}
                </div>
                <div className="text-sm text-gray-600">Stopps</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.floor(Math.random() * 50) + 20} km
                </div>
                <div className="text-sm text-gray-600">Gesamt-Distanz</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.floor(Math.random() * 120) + 60} min
                </div>
                <div className="text-sm text-gray-600">Fahrzeit</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
              * Platzhalter-Werte - echte Berechnung erfolgt mit Google Maps API
            </p>
          </div>
        </div>
      )}

      {routes.length === 0 && !loading && (
        <div className="card text-center py-12">
          <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            Wählen Sie ein Datum und laden Sie die Routen
          </p>
        </div>
      )}
    </div>
  );
}

export default RouteOptimization;
