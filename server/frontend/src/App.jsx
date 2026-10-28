import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Dealers from "./components/Dealers/Dealers";
import Dealer from "./components/Dealer/Dealer";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import { getSession } from "./services/api";

function App() {
  const [session, setSession] = useState({ authenticated: false, userName: "" });

  useEffect(() => {
    getSession()
      .then((data) => setSession(data))
      .catch(() => setSession({ authenticated: false, userName: "" }));
  }, []);

  return (
    <div className="app-shell">
      <Header session={session} onLogout={() => setSession({ authenticated: false, userName: "" })} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dealers session={session} />} />
          <Route path="/dealers" element={<Dealers session={session} />} />
          <Route path="/dealers/:state" element={<Dealers session={session} />} />
          <Route path="/dealer/:id" element={<Dealer session={session} />} />
          <Route path="/login" element={<Login onLogin={setSession} />} />
          <Route path="/register" element={<Register onRegister={setSession} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
