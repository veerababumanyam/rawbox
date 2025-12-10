import React, { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppButton } from './ui/AppButton';
import { AppInput } from './ui/AppInput';
import { AppCard } from './ui/AppCard';

export function LoginView() {
    const { login, error, isLoading } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        // Basic validation
        if (!username.trim()) {
            setLocalError('Username is required');
            return;
        }
        if (!password) {
            setLocalError('Password is required');
            return;
        }

        try {
            await login({ username: username.trim(), password });
        } catch (err: any) {
            // Error is already set in auth context
            console.error('Login failed:', err);
        }
    };

    const displayError = localError || error;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <AppCard className="p-8">
                    {/* Logo and Title */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <img 
                                src="/logo.svg" 
                                alt="RawBox Logo" 
                                className="h-16 w-auto"
                            />
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary mb-2">
                            Welcome to RawBox
                        </h1>
                        <p className="text-text-secondary">
                            Sign in to continue to your gallery
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AppInput
                            label="Username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                            autoComplete="username"
                            autoFocus
                        />

                        <AppInput
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                        />

                        {displayError && (
                            <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                                <p className="text-sm text-error">{displayError}</p>
                            </div>
                        )}

                        <AppButton
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </AppButton>
                    </form>

                    {/* Default Credentials Help */}
                    <div className="mt-6 p-4 rounded-lg bg-surface border border-border">
                        <p className="text-xs text-text-secondary mb-2">
                            <strong>Default Accounts:</strong>
                        </p>
                        <div className="space-y-1 text-xs text-text-tertiary font-mono">
                            <div>superadmin / SuperAdmin@123</div>
                            <div>admin / Admin@123</div>
                            <div>prouser / ProUser@123</div>
                            <div>poweruser / PowerUser@123</div>
                            <div>user / User@123</div>
                        </div>
                    </div>
                </AppCard>

                {/* Footer */}
                <div className="mt-6 text-center text-xs text-text-tertiary">
                    <p>RawBox Gallery Management System</p>
                    <p className="mt-1">© 2024 All rights reserved</p>
                </div>
            </div>
        </div>
    );
}
