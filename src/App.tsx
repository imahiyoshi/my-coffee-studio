import { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from './firebase';
import { generateAppIcon } from './services/iconService';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import RecordForm from './components/RecordForm';
import RecordDetail from './components/RecordDetail';
import Logo from './components/Logo';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <Logo animated />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
        <Routes>
          <Route path="/login" element={!user ? <AuthScreen /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/new" element={user ? <RecordForm user={user} /> : <Navigate to="/login" />} />
          <Route path="/edit/:id" element={user ? <RecordForm user={user} /> : <Navigate to="/login" />} />
          <Route path="/record/:id" element={user ? <RecordDetail user={user} /> : <AuthScreen />} />
        </Routes>
      </div>
    </Router>
  );
}
