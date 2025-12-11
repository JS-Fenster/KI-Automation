import { useState, useEffect } from 'react';
import { Plus, Filter, Calendar, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const STATUS_COLORS = {
  'Anfrage': 'bg-gray-100 text-gray-800',
  'Erstbesichtigung geplant': 'bg-blue-100 text-blue-800',
  'Erstbesichtigung durchgeführt': 'bg-indigo-100 text-indigo-800',
  'Ersatzteil bestellt': 'bg-yellow-100 text-yellow-800',
  'Ersatzteil eingetroffen': 'bg-purple-100 text-purple-800',
  'Folgetermin geplant': 'bg-cyan-100 text-cyan-800',
  'Reparatur durchgeführt': 'bg-green-100 text-green-800',
  'Abgeschlossen': 'bg-green-200 text-green-900',
  'Storniert': 'bg-red-100 text-red-800',
};

function Repairs() {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTimeframe, setFilterTimeframe] = useState('all');

  useEffect(() => {
    loadRepairs();
  }, [filterTimeframe]);

  const loadRepairs = async () => {
    try {
      const params = filterTimeframe !== 'all' ? { timeframe: filterTimeframe } : {};
      const response = await axios.get('/api/repairs', { params });
      setRepairs(response.data.data);
    } catch (error) {
      console.error('Fehler beim Laden der Reparaturen:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reparaturen</h1>
          <p className="text-gray-600 mt-1">
            {repairs.length} Reparaturaufträge
          </p>
        </div>
        <button className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Neue Reparatur
        </button>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <div className="flex gap-2">
            <button
              onClick={() => setFilterTimeframe('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterTimeframe === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setFilterTimeframe('future')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterTimeframe === 'future'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Zukünftig
            </button>
            <button
              onClick={() => setFilterTimeframe('past')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterTimeframe === 'past'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Vergangen
            </button>
          </div>
        </div>
      </div>

      {/* Reparatur-Liste */}
      <div className="grid gap-4">
        {repairs.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">Keine Reparaturen gefunden</p>
          </div>
        ) : (
          repairs.map((repair) => (
            <div
              key={repair.AuftragCode}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {repair.KundeName} {repair.KundeVorname}
                    </h3>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        STATUS_COLORS[repair.Status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {repair.Status || 'Offen'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(repair.Auftragsdatum).toLocaleDateString('de-DE', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>

                    {(repair.KundeOrt || repair.KundePLZ) && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {repair.KundePLZ} {repair.KundeOrt}
                      </div>
                    )}

                    {repair.KundeTelefon && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {repair.KundeTelefon}
                      </div>
                    )}
                  </div>

                  {repair.Bemerkung && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                      {repair.Bemerkung}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  {repair.Betrag && (
                    <div className="text-2xl font-bold text-gray-900">
                      {repair.Betrag.toFixed(2)} €
                    </div>
                  )}
                  <div className="text-sm text-gray-500 mt-1">
                    #{repair.AuftragCode}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Repairs;
