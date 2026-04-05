import { useEffect, useState } from 'react'
import { supabase } from './utils/supabaseClient.ts'
import type { Session } from '@supabase/supabase-js'
import FlowCanvas from "./components/FlowCanvas.tsx";
import {type AuthUIProps} from './types/supabaseTypes.ts';
import './App.css'


function AuthUI({
                    setEmail,
                    setPassword,
                    handleLogin,
                    handleSignUp,
                }: AuthUIProps) {
    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>Login / Sign Up</h2>
                <p className="auth-subtitle">Access your builder workspace</p>

                <input
                    className="auth-input"
                    type="email"
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    className="auth-input"
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <div className="auth-actions">
                    <button className="auth-button auth-button--primary" onClick={handleLogin}>Login</button>
                    <button className="auth-button auth-button--secondary" onClick={handleSignUp}>Sign Up</button>
                </div>
            </div>
        </div>
    )
}

export default function App() {
    const [session, setSession] = useState<Session | null>(null)
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        // Get session on load
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session)
            setLoading(false)
        })

        const { data: listener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session)
            }
        )

        return () => {
            listener.subscription.unsubscribe()
        }
    }, [])

    const handleSignUp = async (): Promise<void> => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        })

        if (error) {
            alert(error.message)
        } else {
            alert('Check your email!')
        }
    }

    const handleLogin = async (): Promise<void> => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            alert(error.message)
        }
    }

    const handleLogout = async (): Promise<void> => {
        await supabase.auth.signOut()
    }

    // 🔄 Prevent flicker
    if (loading) return <p className="app-loading">Loading...</p>

    return (
        <div style={{ padding: 0 }}>
            {!session ? (
                <AuthUI
                    setEmail={setEmail}
                    setPassword={setPassword}
                    handleLogin={handleLogin}
                    handleSignUp={handleSignUp}
                />
            ) : (
                <FlowCanvas session={session} handleLogout={handleLogout} />
            )}
        </div>
    )
}
