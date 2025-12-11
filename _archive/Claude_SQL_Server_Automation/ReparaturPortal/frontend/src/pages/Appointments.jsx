import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import axios from 'axios';

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const response = await axios.get('/api/repairs/appointments/upcoming');
      setAppointments(response.data.data);
    } catch (error) {
      console.error('Fehler beim Laden der Termine:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncWithOutlook = async () => {
    setSyncing(true);
    // PLATZHALTER: Outlook-Synchronisation
    setTimeout(() => {
      alert('Outlook-Synchronisation: Diese Funktion wird in Zukunft implementiert!');
      setSyncing(false);
    }, 1000);
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
          <h1 className="text-3xl font-bold text-gray-900">Termine</h1>
          <p className="text-gray-600 mt-1">
            {appointments.length} anstehende Termine
          </p>
        </div>
        <button
          onClick={syncWithOutlook}
          disabled={syncing}
          className="btn-primary flex items-center"
        >
          <RefreshCw className={`h-5 w-5 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Synchronisiere...' : 'Mit Outlook sync'}
        </button>
      </div>

      {/* Outlook-Integration Platzhalter Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900">
              Outlook-Integration (Platzhalter)
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Diese Seite zeigt aktuell Termine aus der Datenbank. Die Synchronisation mit
              Outlook wird in einer zukünftigen Version implementiert.
            </p>
            <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
              <li>Automatische Termin-Synchronisation</li>
              <li>Bidirektionale Updates</li>
              <li>Kalender-Übersicht</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Termine-Kalender */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Anstehende Termine</h2>

        {appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Keine anstehenden Termine gefunden
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const appointmentDate = new Date(appointment.Termin);
              const isToday = appointmentDate.toDateString() === new Date().toDateString();

              return (
                <div
                  key={appointment.AuftragCode}
                  className={`border-l-4 p-4 rounded-r-lg ${
                    isToday
                      ? 'border-red-500 bg-red-50'
                      : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <span className="font-semibold text-gray-900">
                          {appointmentDate.toLocaleDateString('de-DE', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                        {isToday && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                            HEUTE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-700">
                        <Clock className="h-4 w-4" />
                        {appointmentDate.toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>

                      <div className="mt-3">
                        <h3 className="font-semibold text-gray-900">
                          {appointment.KundeName} {appointment.KundeVorname}
                        </h3>
                        {(appointment.Strasse || appointment.Ort) && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            {appointment.Strasse}, {appointment.PLZ} {appointment.Ort}
                          </div>
                        )}
                        {appointment.Telefon && (
                          <div className="text-sm text-gray-600 mt-1">
                            Tel: {appointment.Telefon}
                          </div>
                        )}
                      </div>

                      {appointment.Bemerkung && (
                        <p className="mt-3 text-sm text-gray-600 border-t pt-3">
                          {appointment.Bemerkung}
                        </p>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                        {appointment.Status || 'Geplant'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Appointments;
