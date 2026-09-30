// RakshaPay DEMO route table (owned by the head). Screens hand off through usePayStore().setDraft → /pay → /done/:recordId.
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PhoneFrame } from './components/PhoneFrame';
import { useLinkHeartbeat } from './hooks/useLinkHeartbeat';
import Home from './screens/Home';
import Scan from './screens/Scan';
import Pay from './screens/Pay';
import Outcome from './screens/Outcome';
import Activity from './screens/Activity';
import Shield from './screens/Shield';
import Profile from './screens/Profile';
import Login, { isLoggedIn } from './screens/Login';
import { useState } from 'react';

export function PayRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/scan" element={<Scan />} />
      <Route path="/pay" element={<Pay />} />
      <Route path="/done/:recordId" element={<Outcome />} />
      <Route path="/activity" element={<Activity />} />
      <Route path="/shield" element={<Shield />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Shell() {
  useLinkHeartbeat();
  const [authed, setAuthed] = useState(isLoggedIn);
  return (
    <PhoneFrame>
      {authed ? <PayRoutes /> : <Login onLogin={() => setAuthed(true)} />}
    </PhoneFrame>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
