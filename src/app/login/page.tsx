'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'
import { useRouter } from 'next/navigation'
import { COLORS } from '@/lib/dashboard-data'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/dashboard")
    })
  }, [router])

  const handleSignUp = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) throw error

      setMessage(`Inscription réussie — Vérifiez vos emails.`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setMessage(`Erreur : ${errorMessage}`)
    }
  }

  const handleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      setMessage(`Connexion réussie !`);
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setMessage(`Erreur : ${errorMessage}`);
    }
  };

  return (
    <div className="login-container">
      <div className="blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
      </div>

      <div className="login-card">
        <div className="logo-wrap">
          <div className="pulse" />
          <h1 className="brand">Ambota<b>kany</b></h1>
        </div>

        <p className="subtitle">Accédez à vos trajets personnalisés et signalez des incidents en temps réel.</p>

        <div className="form">
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
            />
          </div>

          <div className="input-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="actions">
            <button className="btn-secondary" onClick={handleSignUp}>S&apos;inscrire</button>
            <button className="btn-primary" onClick={handleSignIn}>Se connecter</button>
          </div>

          {message && (
            <div className={`message ${message.includes('réussie') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          background: #050811;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: inherit;
        }

        /* Effets de fond (Blobs) */
        .blobs {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .blob {
          position: absolute;
          filter: blur(80px);
          opacity: 0.15;
          border-radius: 50%;
        }
        .blob-1 {
          top: -10%; left: -10%;
          width: 500px; height: 500px;
          background: ${COLORS.primary};
        }
        .blob-2 {
          bottom: -20%; right: -10%;
          width: 600px; height: 600px;
          background: ${COLORS.warn};
        }

        .login-card {
          position: relative;
          z-index: 1;
          background: rgba(10, 14, 26, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 40px;
          border-radius: 24px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
        }

        .logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .pulse {
          width: 12px; height: 12px; border-radius: 50%;
          background: ${COLORS.primary};
          box-shadow: 0 0 16px ${COLORS.primary};
          animation: pulse 1.5s ease-in-out infinite;
          margin-bottom: 12px;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        .brand { 
          font-size: 52px; 
          font-weight: 900; 
          color: #fff;
          letter-spacing: -0.04em; 
          line-height: 1; 
          margin-bottom: 0;
        }
        .brand b { color: #00E5A0; font-weight: 900; }

        .subtitle {
          text-align: center;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 32px;
          line-height: 1.5;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-group label {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.8);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .input-group input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .input-group input:focus {
          border-color: ${COLORS.primary};
          background: rgba(0, 229, 160, 0.05);
        }

        .actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        
        button {
          flex: 1;
          padding: 14px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .btn-primary {
          background: ${COLORS.primary};
          color: #0A0E1A;
          box-shadow: 0 4px 16px rgba(0, 229, 160, 0.3);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 229, 160, 0.4);
        }
        .btn-secondary {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .message {
          margin-top: 16px;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          text-align: center;
        }
        .message.success {
          background: rgba(0, 229, 160, 0.1);
          color: ${COLORS.primary};
          border: 1px solid rgba(0, 229, 160, 0.2);
        }
        .message.error {
          background: rgba(255, 61, 0, 0.1);
          color: #FF3D00;
          border: 1px solid rgba(255, 61, 0, 0.2);
        }
      `}</style>
    </div>
  )
}