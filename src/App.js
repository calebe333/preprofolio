import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { auth, signOut } from './firebase';

// Import Pages
import Dashboard from './pages/Dashboard';
import ExperiencesPage from './pages/ExperiencesPage';
import CoursesPage from './pages/CoursesPage';
import SchoolsPage from './pages/SchoolsPage';
import TimelinePage from './pages/TimelinePage';
// CommunityPage import removed
import ExportPage from './pages/ExportPage';
import SettingsPage from './pages/SettingsPage';
import LoginScreen from './pages/LoginScreen';

// Import Components
import Header from './components/Header';
import LoadingScreen from './components/LoadingScreen';

// --- Main App Component ---
export default function App() {
    return (
        <AuthProvider>
            <PreProFolioApp />
        </AuthProvider>
    );
}

// --- Wrapper Component for the main application logic ---
function PreProFolioApp() {
    const [darkMode, setDarkMode] = useState(false);
    const { user, loading } = useAuth();
    const [currentPage, setCurrentPage] = useState('dashboard');

    // Dynamically load external scripts
    useEffect(() => {
        const scripts = [
            'https://cdn.jsdelivr.net/npm/framer-motion@10/dist/framer-motion.umd.js',
            'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        ];
        scripts.forEach(scriptSrc => {
            if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
                const script = document.createElement('script');
                script.src = scriptSrc;
                script.async = true;
                document.body.appendChild(script);
            }
        });
    }, []);

    useEffect(() => {
        const isDark = localStorage.getItem('darkMode') === 'true';
        setDarkMode(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        setDarkMode(prevMode => {
            const newMode = !prevMode;
            if (newMode) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('darkMode', 'false');
            }
            return newMode;
        });
    };
    
    const backgroundClass = !user && !loading ? 'bg-gray-100 dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900';

    return (
        <div className={`min-h-screen font-sans ${backgroundClass} text-gray-800 dark:text-gray-200 transition-colors duration-300`}>
            <AppContent 
                darkMode={darkMode} 
                toggleDarkMode={toggleDarkMode} 
                currentPage={currentPage} 
                setCurrentPage={setCurrentPage} 
            />
        </div>
    );
}

// --- App Content (Handles Routing) ---
const AppContent = ({ darkMode, toggleDarkMode, currentPage, setCurrentPage }) => {
    const { user, loading } = useAuth();
    const [isGuest, setIsGuest] = useState(false);
    const motion = window.motion;

    const handleSignOut = async () => {
        if (isGuest) {
            setIsGuest(false);
            setCurrentPage('dashboard');
        } else {
            try {
                await signOut(auth);
                setCurrentPage('dashboard');
            } catch (error) {
                console.error("Error signing out:", error);
            }
        }
    };
    
    if (loading) {
        return <LoadingScreen />;
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard isGuest={isGuest} setCurrentPage={setCurrentPage} />;
            case 'experiences':
                return <ExperiencesPage isGuest={isGuest} />;
            case 'courses':
                return <CoursesPage isGuest={isGuest} />;
            case 'schools':
                return <SchoolsPage isGuest={isGuest} />;
            case 'timeline':
                return <TimelinePage isGuest={isGuest} />;
            // case 'community' removed
            case 'export':
                return <ExportPage isGuest={isGuest} />;
            case 'settings':
                return <SettingsPage setCurrentPage={setCurrentPage} />;
            default:
                return <Dashboard isGuest={isGuest} setCurrentPage={setCurrentPage}/>;
        }
    }
    
    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        in: { opacity: 1, y: 0 },
        out: { opacity: 0, y: -20 }
    };

    const pageTransition = {
        type: 'tween',
        ease: 'anticipate',
        duration: 0.5
    };
    
    const GuestBanner = () => (
        <div className="bg-yellow-400/80 dark:bg-yellow-600/80 text-center py-2 px-4 text-sm text-black dark:text-white font-semibold backdrop-blur-sm">
            You are in Guest Mode. Your data will not be saved.
        </div>
    );

    return (
        <>
            {user || isGuest ? <Header darkMode={darkMode} setDarkMode={toggleDarkMode} onSignOut={handleSignOut} showSignOut={!!user || isGuest} currentPage={currentPage} setCurrentPage={setCurrentPage} /> : null}
            {isGuest && <GuestBanner />}
            <main>
                {user || isGuest ? (
                    <div className="p-4 sm:p-6 lg:p-8">
                        {motion ? (
                            <motion.AnimatePresence mode="wait">
                                <motion.div
                                    key={currentPage}
                                    initial="initial"
                                    animate="in"
                                    exit="out"
                                    variants={pageVariants}
                                    transition={pageTransition}
                                >
                                    {renderPage()}
                                </motion.div>
                            </motion.AnimatePresence>
                        ) : renderPage() }
                    </div>
                ) : <LoginScreen onGuestLogin={() => setIsGuest(true)} />}
            </main>
        </>
    );
};
