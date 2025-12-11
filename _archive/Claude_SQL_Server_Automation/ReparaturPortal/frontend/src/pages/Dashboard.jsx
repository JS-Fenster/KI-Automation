import { useState, useEffect } from 'react';
import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [upcomingRepairs, setUpcomingRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, repairsRes] = await Promise.all([
        axios.get('/api/repairs/stats/overview'),
        axios.get('/api/repairs?timeframe=future')
      ]);

      setStats(statsRes.data.data);
      setUpcomingRepairs(repairsRes.data.data.slice(0, 5));
    } catch (error) {
      console.error('Fehler beim Laden der Dashboard-Daten:', error);
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Übersicht über Ihre Reparaturaufträge</p>
      </div>

      {/* Statistik-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Gesamt"
          value={stats?.Gesamt || 0}
          icon={TrendingUp}
          color="text-blue-600"
        />
        <StatCard
          title="Geplant"
          value={stats?.Geplant || 0}
          icon={Clock}
          color="text-yellow-600"
        />
        <StatCard
          title="Abgeschlossen"
          value={stats?.Abgeschlossen || 0}
          icon={CheckCircle}
          color="text-green-600"
        />
        <StatCard
          title="Überfällig"
          value={stats?.Ueberfaellig || 0}
          icon={AlertCircle}
          color="text-red-600"
        />
      </div>

      {/* Anstehende Reparaturen */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Anstehende Reparaturen
        </h2>
        {upcomingRepairs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Keine anstehenden Reparaturen gefunden
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kunde
                  </th>
                  <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ort
                  </th>
                  <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Betrag
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingRepairs.map((repair) => (
                  <tr key={repair.AuftragCode} className="hover:bg-gray-50">
                    <td className="table-cell">
                      {new Date(repair.Auftragsdatum).toLocaleDateString('de-DE')}
                    </td>
                    <td className="table-cell font-medium">
                      {repair.KundeName} {repair.KundeVorname}
                    </td>
                    <td className="table-cell">
                      {repair.KundeOrt}
                    </td>
                    <td className="table-cell">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {repair.Status || 'Offen'}
                      </span>
                    </td>
                    <td className="table-cell">
                      {repair.Betrag ? `${repair.Betrag.toFixed(2)} €` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
