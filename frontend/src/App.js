import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API}/auth/register`, userData);
      const { access_token, user: newUser } = response.data;
      setToken(access_token);
      setUser(newUser);
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Navigation Component
const Navigation = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('home');

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setCurrentView('home')}
              className="text-2xl font-bold text-blue-600 hover:text-blue-700"
            >
              toala.at
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <button
                  onClick={() => setCurrentView('browse')}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium"
                >
                  Durchsuchen
                </button>
                <button
                  onClick={() => setCurrentView('my-equipment')}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium"
                >
                  Meine Geräte
                </button>
                <button
                  onClick={() => setCurrentView('requests')}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium"
                >
                  Anfragen
                </button>
                <button
                  onClick={() => setCurrentView('add-equipment')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Gerät inserieren
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700">Hallo, {user.name}</span>
                  <button
                    onClick={logout}
                    className="text-gray-500 hover:text-red-600"
                  >
                    Abmelden
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCurrentView('login')}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium"
                >
                  Anmelden
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Registrieren
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <ViewSwitcher currentView={currentView} setCurrentView={setCurrentView} />
    </nav>
  );
};

// View Switcher
const ViewSwitcher = ({ currentView, setCurrentView }) => {
  const { user } = useAuth();

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage setCurrentView={setCurrentView} />;
      case 'login':
        return <LoginForm setCurrentView={setCurrentView} />;
      case 'register':
        return <RegisterForm setCurrentView={setCurrentView} />;
      case 'browse':
        return user ? <BrowseEquipment setCurrentView={setCurrentView} /> : <HomePage setCurrentView={setCurrentView} />;
      case 'my-equipment':
        return user ? <MyEquipment setCurrentView={setCurrentView} /> : <HomePage setCurrentView={setCurrentView} />;
      case 'add-equipment':
        return user ? <AddEquipment setCurrentView={setCurrentView} /> : <HomePage setCurrentView={setCurrentView} />;
      case 'requests':
        return user ? <RequestsPage setCurrentView={setCurrentView} /> : <HomePage setCurrentView={setCurrentView} />;
      case 'equipment-detail':
        return user ? <EquipmentDetail setCurrentView={setCurrentView} /> : <HomePage setCurrentView={setCurrentView} />;
      case 'chat':
        return user ? <ChatPage setCurrentView={setCurrentView} /> : <HomePage setCurrentView={setCurrentView} />;
      default:
        return <HomePage setCurrentView={setCurrentView} />;
    }
  };

  return <div>{renderView()}</div>;
};

// Home Page
const HomePage = ({ setCurrentView }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/5064868/pexels-photo-5064868.jpeg"
            alt="Equipment sharing community"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Verleihen, Ausleihen, Gemeinschaft stärken
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Verwandle deine ungenutzten Geräte in Einkommen. Finde die Werkzeuge, die du brauchst, von Nachbarn. 
              Werde Teil von Österreichs führendem Geräteverleih-Marktplatz.
            </p>
            <div className="space-x-4">
              {user ? (
                <>
                  <button
                    onClick={() => setCurrentView('browse')}
                    className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
                  >
                    Geräte durchsuchen
                  </button>
                  <button
                    onClick={() => setCurrentView('add-equipment')}
                    className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition duration-300"
                  >
                    Deine Geräte inserieren
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setCurrentView('register')}
                    className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
                  >
                    Jetzt starten
                  </button>
                  <button
                    onClick={() => setCurrentView('login')}
                    className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition duration-300"
                  >
                    Anmelden
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Warum Toala.at wählen?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Der einfachste Weg, Geräte in deiner Gemeinde zu teilen
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <img
                  src="https://images.unsplash.com/photo-1546827209-a218e99fdbe9"
                  alt="Elektrowerkzeuge"
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Qualitätsgeräte</h3>
              <p className="text-gray-600">
                Von Elektrowerkzeugen bis zu Gartengeräten, finde hochwertige Ausrüstung von vertrauenswürdigen Nachbarn.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <img
                  src="https://images.unsplash.com/photo-1458245201577-fc8a130b8829"
                  alt="Gartengeräte"
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Lokale Gemeinschaft</h3>
              <p className="text-gray-600">
                Verbinde dich mit Nachbarn und baue dauerhafte Beziehungen auf, während du Geld und Platz sparst.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <img
                  src="https://images.pexels.com/photos/5845902/pexels-photo-5845902.jpeg"
                  alt="Schweißgeräte"
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Einfach & Sicher</h3>
              <p className="text-gray-600">
                Einfacher Buchungsprozess mit integriertem Messaging und sicherer Bezahlungsabwicklung.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              So funktioniert's
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mb-6 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Inserieren oder Durchsuchen</h3>
              <p className="text-gray-600">
                Inseriere deine ungenutzten Geräte oder durchsuche verfügbare Werkzeuge in deiner Umgebung.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mb-6 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Vernetzen & Chatten</h3>
              <p className="text-gray-600">
                Sende Anfragen und chatte mit Gerätebesitzern, um Abholzeiten zu vereinbaren.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mb-6 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Teilen & Verdienen</h3>
              <p className="text-gray-600">
                Schließe die Vermietung ab, zahle sicher und baue deinen Ruf in der Gemeinschaft auf.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Bereit zum Teilen?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Werde Teil von tausenden Österreichern, die bereits Geräte teilen und stärkere Gemeinschaften aufbauen.
          </p>
          {!user && (
            <button
              onClick={() => setCurrentView('register')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300"
            >
              Bei Toala.at anmelden
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

// Login Form
const LoginForm = ({ setCurrentView }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      setCurrentView('home');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">In dein Konto anmelden</h2>
          <p className="mt-2 text-gray-600">
            Oder{' '}
            <button
              onClick={() => setCurrentView('register')}
              className="text-blue-600 hover:text-blue-500"
            >
              neues Konto erstellen
            </button>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">E-Mail</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Passwort</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Anmeldung läuft...' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Register Form
const RegisterForm = ({ setCurrentView }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    location: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await register(formData);
    
    if (result.success) {
      setCurrentView('home');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Konto erstellen</h2>
          <p className="mt-2 text-gray-600">
            Oder{' '}
            <button
              onClick={() => setCurrentView('login')}
              className="text-blue-600 hover:text-blue-500"
            >
              bei bestehendem Konto anmelden
            </button>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Vollständiger Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">E-Mail</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Passwort</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Telefon (Optional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Standort (Stadt)</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="z.B. Wien, Salzburg, Innsbruck"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Konto wird erstellt...' : 'Konto erstellen'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Browse Equipment Component
const BrowseEquipment = ({ setCurrentView }) => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    max_price: ''
  });

  useEffect(() => {
    fetchEquipment();
  }, [filters]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      if (filters.max_price) params.append('max_price', filters.max_price);
      
      const response = await axios.get(`${API}/equipment?${params}`);
      setEquipment(response.data);
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'power_tools', label: 'Elektrowerkzeuge' },
    { value: 'lawn_equipment', label: 'Gartengeräte' },
    { value: 'welding_equipment', label: 'Schweißgeräte' },
    { value: 'construction_tools', label: 'Bauwerkzeuge' },
    { value: 'automotive', label: 'Fahrzeuge & KFZ' },
    { value: 'household', label: 'Haushalt' },
    { value: 'other', label: 'Sonstiges' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Geräte durchsuchen</h1>
          
          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Alle Kategorien</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Standort</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  placeholder="Stadt oder Region"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max. Preis pro Tag (€)</label>
                <input
                  type="number"
                  value={filters.max_price}
                  onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                  placeholder="Maximaler Preis"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Lade Geräte...</div>
          </div>
        ) : equipment.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Keine Geräte gefunden, die deinen Kriterien entsprechen.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((item) => (
              <EquipmentCard key={item.id} equipment={item} setCurrentView={setCurrentView} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Equipment Card Component
const EquipmentCard = ({ equipment, setCurrentView }) => {
  const handleViewDetails = () => {
    window.selectedEquipment = equipment;
    setCurrentView('equipment-detail');
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {equipment.images && equipment.images.length > 0 && (
        <img
          src={equipment.images[0].startsWith('data:') ? equipment.images[0] : `data:image/jpeg;base64,${equipment.images[0]}`}
          alt={equipment.title}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{equipment.title}</h3>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {equipment.category.replace('_', ' ')}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{equipment.description}</p>
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-2xl font-bold text-green-600">€{equipment.price_per_day}/day</span>
          <span className="text-sm text-gray-500">{equipment.location}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">von {equipment.owner_name}</span>
          <button
            onClick={handleViewDetails}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Details ansehen
          </button>
        </div>
      </div>
    </div>
  );
};

// Equipment Detail Component
const EquipmentDetail = ({ setCurrentView }) => {
  const equipment = window.selectedEquipment;
  const { user } = useAuth();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    start_date: '',
    end_date: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  if (!equipment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">Gerät nicht gefunden</div>
          <button
            onClick={() => setCurrentView('browse')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Zurück zum Durchsuchen
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user && user.id === equipment.owner_id;

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const requestData = {
        equipment_id: equipment.id,
        start_date: new Date(requestForm.start_date).toISOString(),
        end_date: new Date(requestForm.end_date).toISOString(),
        message: requestForm.message
      };

      const response = await axios.post(`${API}/requests`, requestData);
      
      if (response.status === 200) {
        setSuccess(true);
        setShowRequestForm(false);
        setTimeout(() => {
          setCurrentView('requests');
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (requestForm.start_date && requestForm.end_date) {
      const start = new Date(requestForm.start_date);
      const end = new Date(requestForm.end_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return days * equipment.price_per_day;
    }
    return 0;
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-green-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Anfrage erfolgreich gesendet!</h2>
          <p className="text-gray-600">Der Gerätebesitzer wird deine Anfrage prüfen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setCurrentView('browse')}
          className="mb-6 text-blue-600 hover:text-blue-700 flex items-center"
        >
          ← Zurück zum Durchsuchen
        </button>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {equipment.images && equipment.images.length > 0 && (
            <div className="relative">
              <img
                src={equipment.images[0].startsWith('data:') ? equipment.images[0] : `data:image/jpeg;base64,${equipment.images[0]}`}
                alt={equipment.title}
                className="w-full h-64 object-cover"
              />
              {equipment.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                  {equipment.images.length} photos
                </div>
              )}
            </div>
          )}
          
          <div className="p-8">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{equipment.title}</h1>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {equipment.category.replace('_', ' ')}
              </span>
            </div>
            
            <p className="text-gray-600 mb-6">{equipment.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-3">Mietdetails</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preis pro Tag:</span>
                    <span className="font-semibold text-green-600">€{equipment.price_per_day}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mindestmietdauer:</span>
                    <span>{equipment.min_rental_days} Tag(e)</span>
                  </div>
                  {equipment.max_rental_days && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Maximale Mietdauer:</span>
                      <span>{equipment.max_rental_days} Tag(e)</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Besitzer-Informationen</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Besitzer:</span>
                    <span>{equipment.owner_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Standort:</span>
                    <span>{equipment.location}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t">
              {!user ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Bitte melde dich an, um eine Mietanfrage zu senden</p>
                  <button 
                    onClick={() => setCurrentView('login')}
                    className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 text-lg font-semibold"
                  >
                    Anmelden für Anfrage
                  </button>
                </div>
              ) : isOwner ? (
                <div className="text-center">
                  <p className="text-gray-600">Das ist dein Geräteeintrag</p>
                </div>
              ) : showRequestForm ? (
                <form onSubmit={handleRequestSubmit} className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Mietanfrage senden</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Startdatum</label>
                      <input
                        type="date"
                        required
                        value={requestForm.start_date}
                        onChange={(e) => setRequestForm({ ...requestForm, start_date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Enddatum</label>
                      <input
                        type="date"
                        required
                        value={requestForm.end_date}
                        onChange={(e) => setRequestForm({ ...requestForm, end_date: e.target.value })}
                        min={requestForm.start_date || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  {requestForm.start_date && requestForm.end_date && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span>Gesamtpreis:</span>
                        <span className="text-xl font-bold text-blue-600">€{calculateTotalPrice()}</span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nachricht an Besitzer</label>
                    <textarea
                      required
                      rows={3}
                      value={requestForm.message}
                      onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                      placeholder="Erzähle dem Besitzer von deinen Mietbedürfnissen..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Wird gesendet...' : 'Anfrage senden'}
                    </button>
                  </div>
                </form>
              ) : (
                <button 
                  onClick={() => setShowRequestForm(true)}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 text-lg font-semibold"
                >
                  Send Rental Request
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// My Equipment Component
const MyEquipment = ({ setCurrentView }) => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyEquipment();
  }, []);

  const fetchMyEquipment = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/my-equipment`);
      setEquipment(response.data);
    } catch (error) {
      setError('Failed to fetch equipment');
      console.error('Failed to fetch equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading your equipment...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Equipment</h1>
          <button
            onClick={() => setCurrentView('add-equipment')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            + Add Equipment
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {equipment.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-600 mb-4">You haven't listed any equipment yet.</div>
            <button
              onClick={() => setCurrentView('add-equipment')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              List Your First Equipment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {item.images && item.images.length > 0 && (
                  <img
                    src={item.images[0].startsWith('data:') ? item.images[0] : `data:image/jpeg;base64,${item.images[0]}`}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.is_available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-2xl font-bold text-green-600">€{item.price_per_day}/day</span>
                    <span className="text-sm text-gray-500">{item.location}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Category: {item.category.replace('_', ' ')}
                    </span>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Add Equipment Component
const AddEquipment = ({ setCurrentView }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'power_tools',
    price_per_day: '',
    location: '',
    min_rental_days: 1,
    max_rental_days: ''
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const categories = [
    { value: 'power_tools', label: 'Elektrowerkzeuge' },
    { value: 'lawn_equipment', label: 'Gartengeräte' },
    { value: 'welding_equipment', label: 'Schweißgeräte' },
    { value: 'construction_tools', label: 'Bauwerkzeuge' },
    { value: 'automotive', label: 'Fahrzeuge & KFZ' },
    { value: 'household', label: 'Haushalt' },
    { value: 'other', label: 'Sonstiges' }
  ];

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fullDataUrl = event.target.result; // Keep the full data URL
        setImages(prev => [...prev, fullDataUrl]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const equipmentData = {
        ...formData,
        price_per_day: parseFloat(formData.price_per_day),
        max_rental_days: formData.max_rental_days ? parseInt(formData.max_rental_days) : null,
        images: images
      };

      const response = await axios.post(`${API}/equipment`, equipmentData);
      
      if (response.status === 200) {
        setSuccess(true);
        setTimeout(() => {
          setCurrentView('my-equipment');
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create equipment listing');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-green-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Equipment Listed Successfully!</h2>
          <p className="text-gray-600">Your equipment is now available for rent.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => setCurrentView('browse')}
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            ← Back to Browse
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">List Your Equipment</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Professional Welding Machine"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your equipment, its condition, and any special requirements..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price per Day (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price_per_day}
                onChange={(e) => setFormData({ ...formData, price_per_day: e.target.value })}
                placeholder="25.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Vienna, Salzburg, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rental Days</label>
              <input
                type="number"
                min="1"
                value={formData.min_rental_days}
                onChange={(e) => setFormData({ ...formData, min_rental_days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Rental Days (Optional)</label>
              <input
                type="number"
                min="1"
                value={formData.max_rental_days}
                onChange={(e) => setFormData({ ...formData, max_rental_days: e.target.value })}
                placeholder="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Images (Max 10)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setCurrentView('browse')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'List Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Requests Page Component
const RequestsPage = ({ setCurrentView }) => {
  const [activeTab, setActiveTab] = useState('received');
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [receivedResponse, sentResponse] = await Promise.all([
        axios.get(`${API}/requests/received`),
        axios.get(`${API}/requests/sent`)
      ]);
      
      setReceivedRequests(receivedResponse.data);
      setSentRequests(sentResponse.data);
    } catch (error) {
      setError('Failed to fetch requests');
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      await axios.put(`${API}/requests/${requestId}/status`, null, {
        params: { status }
      });
      
      // Refresh requests
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      setError('Failed to update request status');
      console.error('Failed to update request status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const RequestCard = ({ request, isReceived = false }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{request.equipment_title}</h3>
          <p className="text-gray-600">
            {isReceived ? `From: ${request.requester_name}` : `To: ${request.owner_name}`}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Duration:</span>
          <span>{formatDate(request.start_date)} - {formatDate(request.end_date)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Price:</span>
          <span className="font-semibold text-green-600">€{request.total_price}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Requested:</span>
          <span>{formatDate(request.created_at)}</span>
        </div>
      </div>
      
      <p className="text-gray-700 text-sm mb-4 line-clamp-2">{request.message}</p>
      
      <div className="flex justify-between items-center">
        <button
          onClick={() => setSelectedRequest(request)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View Details
        </button>
        
        {isReceived && request.status === 'pending' && (
          <div className="space-x-2">
            <button
              onClick={() => updateRequestStatus(request.id, 'approved')}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => updateRequestStatus(request.id, 'declined')}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Decline
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Rental Requests</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'received'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Received ({receivedRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'sent'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sent ({sentRequests.length})
          </button>
        </div>

        {/* Request Lists */}
        {activeTab === 'received' ? (
          <div>
            {receivedRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-600 mb-4">No received requests yet.</div>
                <button
                  onClick={() => setCurrentView('add-equipment')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  List Equipment to Receive Requests
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {receivedRequests.map((request) => (
                  <RequestCard key={request.id} request={request} isReceived={true} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {sentRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-600 mb-4">No sent requests yet.</div>
                <button
                  onClick={() => setCurrentView('browse')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Browse Equipment to Send Requests
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sentRequests.map((request) => (
                  <RequestCard key={request.id} request={request} isReceived={false} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Request Detail Modal */}
        {selectedRequest && (
          <RequestDetailModal 
            request={selectedRequest} 
            onClose={() => setSelectedRequest(null)}
            onStatusUpdate={updateRequestStatus}
            isReceived={activeTab === 'received'}
            setCurrentView={setCurrentView}
          />
        )}
      </div>
    </div>
  );
};

// Request Detail Modal Component
const RequestDetailModal = ({ request, onClose, onStatusUpdate, isReceived, setCurrentView }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">{request.equipment_title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="font-semibold text-gray-900">
                {isReceived ? `Request from ${request.requester_name}` : `Request to ${request.owner_name}`}
              </h4>
              <p className="text-gray-600">Requested on {formatDateTime(request.created_at)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Rental Period</h5>
              <p className="text-gray-700">{formatDate(request.start_date)} - {formatDate(request.end_date)}</p>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Total Price</h5>
              <p className="text-2xl font-bold text-green-600">€{request.total_price}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h5 className="font-medium text-gray-900 mb-2">Message</h5>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{request.message}</p>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <button
              onClick={() => {
                window.selectedRequest = request;
                setCurrentView('chat');
                onClose();
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Open Chat
            </button>
            
            {isReceived && request.status === 'pending' && (
              <div className="space-x-3">
                <button
                  onClick={() => onStatusUpdate(request.id, 'declined')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Decline
                </button>
                <button
                  onClick={() => onStatusUpdate(request.id, 'approved')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
              </div>
            )}
            
            {request.status === 'approved' && (
              <button
                onClick={() => onStatusUpdate(request.id, 'completed')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Mark as Completed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Chat Page Component
const ChatPage = ({ setCurrentView }) => {
  const request = window.selectedRequest;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!request) {
      setCurrentView('requests');
      return;
    }
    fetchMessages();
    // Set up polling for new messages (simple approach for MVP)
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [request]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/messages/${request.id}`);
      setMessages(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch messages');
      console.error('Failed to fetch messages:', error);
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const recipientId = user.id === request.owner_id ? request.requester_id : request.owner_id;
      
      const messageData = {
        recipient_id: recipientId,
        request_id: request.id,
        content: newMessage.trim()
      };

      await axios.post(`${API}/messages`, messageData);
      setNewMessage('');
      fetchMessages(); // Refresh messages
    } catch (error) {
      setError('Failed to send message');
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">No request selected</div>
          <button
            onClick={() => setCurrentView('requests')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading chat...</div>
      </div>
    );
  }

  const otherUser = user.id === request.owner_id ? request.requester_name : request.owner_name;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('requests')}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{otherUser}</h1>
              <p className="text-sm text-gray-600">{request.equipment_title}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)]">
        {/* Request Info */}
        <div className="bg-blue-50 border-b px-6 py-4">
          <div className="text-sm text-blue-800">
            <span className="font-medium">Rental Period:</span> {' '}
            {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
            {' • '}
            <span className="font-medium">Total:</span> €{request.total_price}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.001 8.001 0 01-7.7-6M3 12c0-4.418 3.582-8 8-8s8 3.582 8 8" />
                </svg>
              </div>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === user.id
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t bg-white px-6 py-4">
          <form onSubmit={sendMessage} className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sending}
              />
            </div>
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navigation />
      </div>
    </AuthProvider>
  );
}

export default App;
