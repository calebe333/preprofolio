import React from 'react';
import { auth, provider, signInWithPopup } from '../firebase';

export default function LoginScreen({ onGuestLogin }) {
    const handleSignIn = async () => {
        if (!auth || !provider) {
            console.error("Firebase is not configured.");
            return;
        }
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Authentication error:", error);
        }
    };
    
    const scrollTo = (id) => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="w-full bg-gray-100 dark:bg-gray-900">
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        <h1 className="text-xl font-bold">PreProFolio</h1>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={() => scrollTo('features')} className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</button>
                        <button onClick={() => scrollTo('about')} className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</button>
                    </div>
                </nav>
            </header>

            <main>
                <section className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
                     <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-80 dark:opacity-70"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    </div>
                    <div className="relative z-10 w-full max-w-md p-8 space-y-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 text-center">
                        <h1 className="text-5xl font-extrabold text-white tracking-tight">Your Journey Starts Here.</h1>
                        <p className="mt-2 text-lg text-gray-200">The smart, secure, and simple way to track your pre-health journey.</p>
                        <div className="space-y-4 pt-4">
                            <button onClick={handleSignIn} className="w-full flex items-center justify-center gap-3 py-3 px-4 text-lg font-semibold text-gray-700 bg-white rounded-xl shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105">
                                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.836 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
                                Sign In with Google
                            </button>
                            <button onClick={onGuestLogin} className="w-full py-3 px-4 text-lg font-semibold text-white bg-white/20 rounded-xl shadow-md hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white transition-all duration-300">
                                Continue as Guest
                            </button>
                        </div>
                    </div>
                </section>

                <section id="features" className="py-20 bg-white dark:bg-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-extrabold">Features</h2>
                        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Everything you need, nothing you don't.</p>
                    </div>
                </section>

                <section id="about" className="py-20 bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-extrabold">About PreProFolio</h2>
                        <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                            PreProFolio was built by a pre-health student, for pre-health students. We know the struggle of juggling coursework, volunteering, and clinical hours. Our goal is to simplify the tracking process so you can focus on what truly matters: gaining valuable experience and preparing for your future career in healthcare.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
