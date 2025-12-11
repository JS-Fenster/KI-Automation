import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Phone, Mail } from 'lucide-react';
import axios from 'axios';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data.data);
    } catch (error) {
      console.error('Fehler beim Laden der Kunden:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadCustomers();
      return;
    }

    try {
      const response = await axios.get(`/api/customers/search/${searchTerm}`);
      setCustomers(response.data.data);
    } catch (error) {
      console.error('Fehler bei der Suche:', error);
    }
  };

  const filteredCustomers = searchTerm
    ? customers.filter(c =>
        c.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.Vorname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.Ort?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : customers;

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
          <h1 className="text-3xl font-bold text-gray-900">Kunden</h1>
          <p className="text-gray-600 mt-1">
            {filteredCustomers.length} Kunden gefunden
          </p>
        </div>
        <button className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Neuer Kunde
        </button>
      </div>

      {/* Suchleiste */}
      <div className="card">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Kunde suchen (Name, Ort, Telefon)..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            className="btn-primary"
          >
            Suchen
          </button>
        </div>
      </div>

      {/* Kunden-Tabelle */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase">
                  Kontakt
                </th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase">
                  Adresse
                </th>
                <th className="table-cell text-left text-xs font-medium text-gray-500 uppercase">
                  Angelegt
                </th>
                <th className="table-cell text-right text-xs font-medium text-gray-500 uppercase">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-cell text-center text-gray-500 py-8">
                    Keine Kunden gefunden
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.Code} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div>
                        <div className="font-medium text-gray-900">
                          {customer.Name} {customer.Vorname}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {customer.Code}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        {customer.Telefon && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-1 text-gray-400" />
                            {customer.Telefon}
                          </div>
                        )}
                        {customer.EMail && (
                          <div className="flex items-center text-sm">
                            <Mail className="h-4 w-4 mr-1 text-gray-400" />
                            {customer.EMail}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm">
                        {customer.Strasse && <div>{customer.Strasse}</div>}
                        {(customer.PLZ || customer.Ort) && (
                          <div className="text-gray-500">
                            {customer.PLZ} {customer.Ort}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell text-sm text-gray-500">
                      {customer.Angelegt
                        ? new Date(customer.Angelegt).toLocaleDateString('de-DE')
                        : '-'}
                    </td>
                    <td className="table-cell text-right">
                      <button className="text-primary-600 hover:text-primary-900">
                        <Edit className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Customers;
