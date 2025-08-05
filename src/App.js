import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, serverTimestamp, setDoc, getDoc, onSnapshot, orderBy, writeBatch, limit } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- External Libraries for Export & Animation ---
// We will load these dynamically in the main component
// jsPDF for PDF generation
// jsPDF-AutoTable for creating tables in PDFs
// PapaParse for CSV generation
// Framer Motion for animations

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAKE-fU2KRs9flQEbBZdL4PZqKZT-irrKU",
  authDomain: "preprofolio.firebaseapp.com",
  projectId: "preprofolio",
  storageBucket: "preprofolio.appspot.com",
  messagingSenderId: "692987377324",
  appId: "1:692987377324:web:5b2c3b5e7ce7ed5e4f5109",
  measurementId: "G-EE6Z37FY80"
};

// --- Initialize Firebase ---
let app, auth, db, provider;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();
    console.log("Firebase Initialized Successfully.");
} catch (error) {
    console.error("Firebase Initialization Error:", error);
}

// --- App Constants ---
const CATEGORIES = [
    { name: 'Patient Care Experience', color: '#3B82F6' },
    { name: 'Healthcare Experience', color: '#10B981' },
    { name: 'Research', color: '#F59E0B' },
    { name: 'Shadowing', color: '#8B5CF6' },
    { name: 'Volunteer Work', color: '#EF4444' },
    { name: 'Other', color: '#6B7280' },
];
const CATEGORY_NAMES = CATEGORIES.map(c => c.name);


// --- Mock Data for Guest Mode ---
const getMockData = () => ({
    experiences: [
        { id: 'mock1', category: 'Patient Care Experience', date: { toDate: () => new Date('2024-07-15') }, hours: 40, location: 'Community Hospital ER', notes: 'Assisted with patient vitals and transport.', isMeaningful: true },
        { id: 'mock2', category: 'Volunteer Work', date: { toDate: () => new Date('2024-06-20') }, hours: 25, location: 'Local Soup Kitchen', notes: 'Served meals and helped with cleanup.', isMeaningful: false },
        { id: 'mock3', category: 'Research', date: { toDate: () => new Date('2024-05-01') }, hours: 50, location: 'University Lab', notes: 'Conducted data analysis for a study on neuroplasticity.', isMeaningful: true },
    ],
    goals: {
        'Patient Care Experience': 200,
        'Healthcare Experience': 100,
        'Research': 150,
        'Shadowing': 50,
        'Volunteer Work': 100,
        'Other': 0
    },
    courses: [
        { id: 'mock_course_1', name: 'General Chemistry I', code: 'CHEM 101', credits: 4, grade: 'A', semester: 'Fall', year: 2023, isScience: true },
        { id: 'mock_course_2', name: 'Introduction to Psychology', code: 'PSYC 101', credits: 3, grade: 'B+', semester: 'Fall', year: 2023, isScience: false },
        { id: 'mock_course_3', name: 'Organic Chemistry I', code: 'CHEM 231', credits: 4, grade: 'A-', semester: 'Spring', year: 2024, isScience: true },
    ],
    plannedCourses: [
        { id: 'planned_1', name: 'Physics I', code: 'PHYS 220' },
    ],
    coursePlan: {
        'Fall-2024': [{ id: 'mock_course_3', name: 'Organic Chemistry I', code: 'CHEM 231' }]
    },
    profile: {
        track: 'Pre-Med',
        applicationYear: new Date().getFullYear() + 1,
        bio: 'Aspiring physician with a passion for emergency medicine.'
    }
});

// --- Authentication Context ---
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = { user, loading };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
    return useContext(AuthContext);
};


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
            'https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js',
            'https://unpkg.com/jspdf-autotable@3.5.23/dist/jspdf.plugin.autotable.js',
            'https://unpkg.com/papaparse@5.3.2/papaparse.min.js',
            'https://cdn.jsdelivr.net/npm/framer-motion@10/dist/framer-motion.umd.js'
        ];
        
        scripts.forEach(src => {
            if (!document.querySelector(`script[src="${src}"]`)) {
                const script = document.createElement('script');
                script.src = src;
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
    
    // Apply different background for login screen
    const backgroundClass = !user && !loading ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900';

    return (
        <div className={`min-h-screen font-sans ${backgroundClass} text-gray-800 dark:text-gray-200 transition-colors duration-300`}>
            <AppContent darkMode={darkMode} toggleDarkMode={toggleDarkMode} currentPage={currentPage} setCurrentPage={setCurrentPage} />
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
        } else if (auth) {
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

    return (
        <>
            {user || isGuest ? <Header darkMode={darkMode} setDarkMode={toggleDarkMode} onSignOut={handleSignOut} showSignOut={!!user || isGuest} setCurrentPage={setCurrentPage} /> : null}
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

// --- UI Components ---

const Header = ({ darkMode, setDarkMode, onSignOut, showSignOut, setCurrentPage }) => {
    return (
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700/50 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <button onClick={() => setCurrentPage('dashboard')} className="flex items-center space-x-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">PreProFolio</h1>
                    </button>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                        <button onClick={() => setCurrentPage('experiences')} title="Experiences" className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transform hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </button>
                        <button onClick={() => setCurrentPage('courses')} title="Courses" className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transform hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </button>
                        <button onClick={() => setCurrentPage('export')} title="Export Report" className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transform hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </button>
                        <button onClick={() => setCurrentPage('settings')} title="Settings" className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transform hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                        <button onClick={setDarkMode} title="Toggle Dark Mode" className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transform hover:scale-110 transition-transform">
                            {darkMode ? 
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : 
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                            }
                        </button>
                        {showSignOut && (
                            <button onClick={onSignOut} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105">
                                Sign Out
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

const LoginScreen = ({ onGuestLogin }) => {
    const handleSignIn = async () => {
        if (!auth || !provider) {
            alert("Firebase is not configured. Please set up your firebaseConfig in the code to enable Google Sign-In.");
            return;
        }
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Authentication error:", error);
            if (error.code === 'auth/popup-blocked') {
                alert("Popup was blocked by the browser. Please allow popups for this site and try again.");
            } else {
                alert("Authentication failed. Check the console for details.");
            }
        }
    };

    const features = [
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            title: "Effortless Hour Logging",
            description: "Quickly log single or recurring entries for all your pre-health activities, from patient care to research."
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
            title: "Visualize Your Progress",
            description: "Set goals for each category and watch your progress with intuitive charts and dynamic progress bars."
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
            title: "Powerful Search & Filter",
            description: "Instantly find any entry with advanced search and filtering by category, keyword, or date range."
        }
    ];

    return (
        <div className="w-full bg-white dark:bg-gray-900">
            <style>{`
                .animated-gradient {
                    background-size: 400%;
                    -webkit-animation: animation 10s ease infinite;
                    -moz-animation: animation 10s ease infinite;
                    animation: animation 10s ease infinite;
                }

                @keyframes animation {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
            `}</style>
            <div className="relative isolate px-6 pt-14 lg:px-8 bg-gradient-to-r from-blue-100 via-teal-100 to-violet-100 dark:from-blue-900/30 dark:via-teal-900/30 dark:to-violet-900/30 animated-gradient">
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#80ff89] to-[#0077ff] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}></div>
                </div>

                <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
                    <div className="text-center">
                        <div className="flex justify-center items-center gap-4 mb-8">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">PreProFolio</h1>
                        </div>
                        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">The smart, secure, and simple way for pre-health students to track their experience hours and prepare for professional school.</p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                           <button onClick={handleSignIn} className="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transform hover:scale-105 transition-transform duration-300">
                                <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.836 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
                                Sign In with Google
                            </button>
                            <button onClick={onGuestLogin} className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">Try the Demo <span aria-hidden="true">→</span></button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">Built for Your Journey</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Everything you need to stay organized</p>
                        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">Stop wrestling with spreadsheets. PreProFolio is designed from the ground up to make tracking your hours simple, so you can focus on what matters most: gaining experience.</p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                            {features.map((feature) => (
                                <div key={feature.title} className="relative pl-16">
                                    <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                                        <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                            {feature.icon}
                                        </div>
                                        {feature.title}
                                    </dt>
                                    <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-300">{feature.description}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </div>
             <footer className="bg-white dark:bg-gray-900">
                <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
                    <div className="mt-8 md:mt-0 md:order-1">
                        <p className="text-center text-xs leading-5 text-gray-500">&copy; {new Date().getFullYear()} PreProFolio. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const LoadingScreen = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse [animation-delay:0.2s]"></div>
            <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse [animation-delay:0.4s]"></div>
            <p className="text-lg font-semibold">Loading...</p>
        </div>
    </div>
);


// --- Dashboard Components ---
const Dashboard = ({ isGuest, setCurrentPage }) => {
    const { user } = useAuth();
    const [experiences, setExperiences] = useState([]);
    const [courses, setCourses] = useState([]);
    const [goals, setGoals] = useState({});
    const [loading, setLoading] = useState(true);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    
    useEffect(() => {
        if (isGuest) {
            const mock = getMockData();
            setExperiences(mock.experiences);
            setCourses(mock.courses);
            setGoals(mock.goals);
            setLoading(false);
            return;
        }
        if (!user || !db) {
            setLoading(false);
            return;
        };

        setLoading(true);
        
        const unsubscribes = [];

        // Fetch Experiences
        const expQuery = query(collection(db, "experiences"), where("userId", "==", user.uid), orderBy("date", "desc"));
        unsubscribes.push(onSnapshot(expQuery, (snap) => {
            setExperiences(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }));

        // Fetch Courses
        const courseQuery = query(collection(db, "courses"), where("userId", "==", user.uid));
         unsubscribes.push(onSnapshot(courseQuery, (snap) => {
            setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }));

        // Fetch Goals
        const goalDocRef = doc(db, "goals", user.uid);
        unsubscribes.push(onSnapshot(goalDocRef, (docSnap) => {
            setGoals(docSnap.exists() ? docSnap.data() : {});
        }));
        
        setLoading(false);

        return () => unsubscribes.forEach(unsub => unsub());
    }, [user, isGuest]);
    
    const motion = window.motion;

    const containerVariants = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    const displayName = isGuest ? "Guest" : user?.displayName;

    if (loading) return <LoadingScreen />;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back, {displayName}!</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button onClick={() => setIsGoalModalOpen(true)} className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transform hover:scale-105 transition-transform">
                        Set Goals
                    </button>
                    <button onClick={() => setCurrentPage('experiences')} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transform hover:scale-105 transition-transform">
                        Log Experience
                    </button>
                </div>
            </div>
            
            {motion ? (
                <motion.div 
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div className="lg:col-span-2 space-y-6" variants={itemVariants}>
                        <GpaSummary courses={courses} />
                        <RecentExperiences experiences={experiences} setCurrentPage={setCurrentPage} />
                    </motion.div>
                    <motion.div className="lg:col-span-1" variants={itemVariants}>
                        <ProgressSummary experiences={experiences} goals={goals} />
                    </motion.div>
                    <motion.div className="lg:col-span-3" variants={itemVariants}>
                        <MonthlyChart experiences={experiences} />
                    </motion.div>
                </motion.div>
            ) : ( 
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <GpaSummary courses={courses} />
                        <RecentExperiences experiences={experiences} setCurrentPage={setCurrentPage} />
                    </div>
                    <div className="lg:col-span-1">
                        <ProgressSummary experiences={experiences} goals={goals} />
                    </div>
                     <div className="lg:col-span-3">
                        <MonthlyChart experiences={experiences} />
                    </div>
                </div>
            )}

            {motion && <motion.AnimatePresence>
                {isGoalModalOpen && (
                    <GoalModal
                        isOpen={isGoalModalOpen}
                        onClose={() => setIsGoalModalOpen(false)}
                        onSuccess={() => setIsGoalModalOpen(false)}
                        currentGoals={goals}
                        isGuest={isGuest}
                    />
                )}
            </motion.AnimatePresence>}
            {!motion && isGoalModalOpen && (
                 <GoalModal
                    isOpen={isGoalModalOpen}
                    onClose={() => setIsGoalModalOpen(false)}
                    onSuccess={() => setIsGoalModalOpen(false)}
                    currentGoals={goals}
                    isGuest={isGuest}
                />
            )}
        </div>
    );
};

const GpaSummary = ({ courses }) => {
    const cumulativeGpa = calculateGPA(courses);
    const scienceGpa = calculateGPA(courses, true);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                <span>Academic Summary</span>
            </h3>
            <div className="flex justify-around items-center text-center">
                <div>
                    <h4 className="text-md font-semibold text-gray-500 dark:text-gray-400">Cumulative GPA</h4>
                    <p className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{cumulativeGpa}</p>
                </div>
                <div className="border-l border-gray-200 dark:border-gray-700 h-16"></div>
                <div>
                    <h4 className="text-md font-semibold text-gray-500 dark:text-gray-400">Science GPA</h4>
                    <p className="text-4xl font-extrabold text-green-600 dark:text-green-400 mt-1">{scienceGpa}</p>
                </div>
            </div>
        </div>
    );
};

const AnimatedProgressBar = ({ progress, color }) => {
    const motion = window.motion;
    if (!motion) {
        return <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color }}></div>;
    }
    return (
        <motion.div 
            className="h-full rounded-full"
            style={{ backgroundColor: color, originX: 0 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
    );
}

const ProgressSummary = ({ experiences, goals }) => {
    const summary = CATEGORIES.map(cat => {
        const current = experiences.filter(e => e.category === cat.name).reduce((acc, curr) => acc + (curr.hours || 0), 0);
        const goal = goals[cat.name] || 0;
        const progress = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
        return { name: cat.name, current, goal, progress, color: cat.color };
    });

    const totalHours = experiences.reduce((acc, curr) => acc + (curr.hours || 0), 0);
    const totalGoal = Object.values(goals).reduce((acc, curr) => acc + (parseInt(curr, 10) || 0), 0);
    const totalProgress = totalGoal > 0 ? Math.min((totalHours / totalGoal) * 100, 100) : 0;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Hour Progress</h3>
            <div className="space-y-1 mb-4">
                <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-md text-gray-800 dark:text-gray-200">Total Hours</span>
                    <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{totalHours.toFixed(1)} / {totalGoal}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <AnimatedProgressBar progress={totalProgress} color={'#3B82F6'} />
                </div>
            </div>
            <div className="space-y-3">
                {summary.filter(s => s.goal > 0).map((item) => (
                    <div key={item.name}>
                        <div className="flex justify-between text-sm font-medium mb-1">
                            <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                            <span className="text-gray-500 dark:text-gray-400">{item.current.toFixed(1)} / {item.goal} hrs</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                           <AnimatedProgressBar progress={item.progress} color={item.color} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RecentExperiences = ({ experiences, setCurrentPage }) => {
    const recent = experiences.slice(0, 4);
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Experiences</h3>
                <button onClick={() => setCurrentPage('experiences')} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">View All</button>
            </div>
            <div className="space-y-3">
                {recent.length > 0 ? recent.map(exp => (
                    <div key={exp.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{exp.location}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{exp.category}</p>
                        </div>
                        <div className="text-right">
                             <p className="font-bold text-gray-800 dark:text-gray-200">{exp.hours.toFixed(1)} hrs</p>
                             <p className="text-sm text-gray-500 dark:text-gray-400">{exp.date?.toDate().toLocaleDateString()}</p>
                        </div>
                    </div>
                )) : <p className="text-center text-gray-500 dark:text-gray-400 pt-8">No experiences logged yet.</p>}
            </div>
        </div>
    );
};

const MonthlyChart = ({ experiences }) => {
    const monthlyData = experiences.reduce((acc, exp) => {
        if (!exp.date || !exp.date.toDate) return acc;
        const month = exp.date.toDate().toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!acc[month]) {
            acc[month] = { name: month };
            CATEGORIES.forEach(cat => acc[month][cat.name] = 0);
        }
        acc[month][exp.category] = (acc[month][exp.category] || 0) + exp.hours;
        return acc;
    }, {});

    const sortedBarData = Object.values(monthlyData).sort((a, b) => new Date(a.name) - new Date(b.name));

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Monthly Hour Distribution</h3>
            {sortedBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={sortedBarData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `${value.toFixed(1)} hrs`} />
                        <Legend />
                        {CATEGORIES.map(cat => (
                            <Bar key={cat.name} dataKey={cat.name} stackId="a" fill={cat.color} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            ) : <p className="text-center text-gray-500 dark:text-gray-400 pt-16">Log hours to see your monthly progress chart.</p>}
        </div>
    );
}

// --- NEW EXPERIENCES PAGE ---
const ExperiencesPage = ({ isGuest }) => {
    const { user } = useAuth();
    const [experiences, setExperiences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
    const [editingExperience, setEditingExperience] = useState(null);
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const motion = window.motion;

    useEffect(() => {
        if (isGuest) {
            setExperiences(getMockData().experiences);
            setLoading(false);
            return;
        }
        if (!user || !db) {
            setLoading(false);
            return;
        };

        setLoading(true);

        const expQuery = query(collection(db, "experiences"), where("userId", "==", user.uid), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(expQuery, (querySnapshot) => {
            const experiencesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExperiences(experiencesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching experiences:", error);
            alert("Could not fetch experiences. Check Firestore indexes.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, isGuest]);

    const handleAddOrUpdate = () => {
        setIsExperienceModalOpen(false);
        setEditingExperience(null);
    };
    
    const handleEdit = (exp) => {
        setEditingExperience(exp);
        setIsExperienceModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (isGuest) {
            setExperiences(experiences.filter(exp => exp.id !== id));
            return;
        }

        if (window.confirm("Are you sure you want to delete this entry?")) {
            try {
                await deleteDoc(doc(db, "experiences", id));
            } catch (error) {
                console.error("Error deleting experience:", error);
            }
        }
    };
    
    const filteredExperiences = experiences.filter(exp => {
        const categoryMatch = filterCategory === 'All' || exp.category === filterCategory;
        const searchTermMatch = searchTerm === '' || 
                                (exp.location && exp.location.toLowerCase().includes(searchTerm.toLowerCase())) || 
                                (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));
        
        let startDateMatch = true;
        if (dateRange.start) {
            const start = new Date(dateRange.start);
            start.setHours(0, 0, 0, 0);
            startDateMatch = exp.date.toDate() >= start;
        }

        let endDateMatch = true;
        if (dateRange.end) {
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59, 999);
            endDateMatch = exp.date.toDate() <= end;
        }

        return categoryMatch && searchTermMatch && startDateMatch && endDateMatch;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Experience Log</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all your logged activities in one place.</p>
                </div>
                <button onClick={() => { setEditingExperience(null); setIsExperienceModalOpen(true); }} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transform hover:scale-105 transition-transform">
                    Log New Experience
                </button>
            </div>
            
            <ExperienceLog 
                allExperiences={filteredExperiences} 
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                dateRange={dateRange}
                setDateRange={setDateRange}
            />

            {motion && <motion.AnimatePresence>
                {isExperienceModalOpen && (
                    <ExperienceModal 
                        isOpen={isExperienceModalOpen}
                        onClose={() => { setIsExperienceModalOpen(false); setEditingExperience(null); }}
                        onSuccess={handleAddOrUpdate}
                        experience={editingExperience}
                        isGuest={isGuest}
                    />
                )}
            </motion.AnimatePresence>}
             {!motion && isExperienceModalOpen && (
                 <ExperienceModal 
                    isOpen={isExperienceModalOpen}
                    onClose={() => { setIsExperienceModalOpen(false); setEditingExperience(null); }}
                    onSuccess={handleAddOrUpdate}
                    experience={editingExperience}
                    isGuest={isGuest}
                />
            )}
        </div>
    );
};


const ExperienceLog = ({ allExperiences, loading, onEdit, onDelete, filterCategory, setFilterCategory, searchTerm, setSearchTerm, dateRange, setDateRange }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(allExperiences.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentExperiences = allExperiences.slice(startIndex, endIndex);

    const goToNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    const goToPreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [filterCategory, searchTerm, dateRange]);

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">All Experiences</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full lg:w-auto">
                    <input 
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    />
                    <select
                        id="category-filter"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    >
                        <option value="All">All Categories</option>
                        {CATEGORY_NAMES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                     <input type="date" name="start" value={dateRange.start} onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    <input type="date" name="end" value={dateRange.end} onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Category</th>
                            <th scope="col" className="px-6 py-3">Hours</th>
                            <th scope="col" className="px-6 py-3">Location/Org</th>
                            <th scope="col" className="px-6 py-3 hidden md:table-cell">Notes</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center p-8">Loading experiences...</td></tr>
                        ) : currentExperiences.length === 0 ? (
                            <tr><td colSpan="6" className="text-center p-8">No experiences match your search.</td></tr>
                        ) : (
                            currentExperiences.map(exp => <ExperienceRow key={exp.id} exp={exp} onEdit={onEdit} onDelete={onDelete} />)
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between items-center pt-4">
                <span className="text-sm text-gray-700 dark:text-gray-400">
                    Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(endIndex, allExperiences.length)}</span> of <span className="font-semibold">{allExperiences.length}</span> Results
                </span>
                <div className="inline-flex mt-2 xs:mt-0">
                    <button onClick={goToPreviousPage} disabled={currentPage === 1} className="flex items-center justify-center px-3 h-8 text-sm font-medium text-white bg-gray-800 rounded-l hover:bg-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                        Prev
                    </button>
                    <button onClick={goToNextPage} disabled={currentPage === totalPages || totalPages === 0} className="flex items-center justify-center px-3 h-8 text-sm font-medium text-white bg-gray-800 border-0 border-l border-gray-700 rounded-r hover:bg-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

const ExperienceRow = ({ exp, onEdit, onDelete }) => {
    const formattedDate = exp.date?.toDate ? exp.date.toDate().toLocaleDateString() : 'N/A';
    return (
        <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{formattedDate}</td>
            <td className="px-6 py-4">{exp.category}</td>
            <td className="px-6 py-4 font-bold">{exp.hours?.toFixed(1)}</td>
            <td className="px-6 py-4">{exp.location}</td>
            <td className="px-6 py-4 hidden md:table-cell max-w-xs truncate" title={exp.notes}>{exp.notes}</td>
            <td className="px-6 py-4 flex items-center gap-2">
                <button onClick={() => onEdit(exp)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Edit</button>
                <button onClick={() => onDelete(exp.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">Delete</button>
            </td>
        </tr>
    );
};

const ExperienceModal = ({ isOpen, onClose, onSuccess, experience, isGuest }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        category: 'Patient Care Experience',
        date: new Date().toISOString().split('T')[0],
        hours: '',
        location: '',
        notes: ''
    });
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringData, setRecurringData] = useState({
        endDate: '',
        frequency: 'Daily',
        daysOfWeek: { Sun: false, Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const motion = window.motion;

    useEffect(() => {
        if (experience) {
            const date = experience.date?.toDate ? experience.date.toDate() : new Date();
            setFormData({
                category: experience.category,
                date: date.toISOString().split('T')[0],
                hours: experience.hours,
                location: experience.location,
                notes: experience.notes
            });
        } else {
             setFormData({
                category: 'Patient Care Experience',
                date: new Date().toISOString().split('T')[0],
                hours: '',
                location: '',
                notes: ''
            });
        }
    }, [experience]);
    
    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleRecurringChange = (e) => {
        const { name, value } = e.target;
        setRecurringData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleDayToggle = (day) => {
        setRecurringData(prev => ({
            ...prev,
            daysOfWeek: { ...prev.daysOfWeek, [day]: !prev.daysOfWeek[day] }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.hours || formData.hours <= 0) {
            setError('Hours must be a positive number.');
            return;
        }
        if (isRecurring && !recurringData.endDate) {
            setError('End date is required for recurring entries.');
            return;
        }
        setError('');
        setIsSubmitting(true);

        const batch = writeBatch(db);
        
        if (isRecurring) {
            let currentDate = new Date(formData.date + 'T00:00:00'); // Avoid timezone issues
            const lastDate = new Date(recurringData.endDate + 'T00:00:00');
            const selectedDays = Object.keys(recurringData.daysOfWeek).map((day, index) => recurringData.daysOfWeek[day] ? index : -1).filter(index => index !== -1);

            while (currentDate <= lastDate) {
                let shouldAdd = false;
                if (recurringData.frequency === 'Daily') {
                    shouldAdd = true;
                } else if (recurringData.frequency === 'Weekly') {
                    if (selectedDays.length === 0 || selectedDays.includes(currentDate.getDay())) {
                         shouldAdd = true;
                    }
                } else if (recurringData.frequency === 'Bi-Weekly') {
                    const weekDiff = Math.floor((currentDate - new Date(formData.date + 'T00:00:00')) / (1000 * 60 * 60 * 24 * 7));
                    if (weekDiff % 2 === 0 && (selectedDays.length === 0 || selectedDays.includes(currentDate.getDay()))) {
                        shouldAdd = true;
                    }
                }

                if (shouldAdd) {
                    const newDocRef = doc(collection(db, "experiences"));
                    batch.set(newDocRef, {
                        ...formData,
                        hours: parseFloat(formData.hours),
                        date: new Date(currentDate),
                        userId: user.uid,
                        createdAt: serverTimestamp(),
                    });
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        } else {
             const finalData = {
                 ...formData,
                 hours: parseFloat(formData.hours),
                 date: new Date(formData.date),
                 userId: user.uid,
            }
            if (experience) {
                const docRef = doc(db, 'experiences', experience.id);
                batch.update(docRef, { ...finalData, updatedAt: serverTimestamp() });
            } else {
                const newDocRef = doc(collection(db, "experiences"));
                batch.set(newDocRef, { ...finalData, createdAt: serverTimestamp() });
            }
        }

        try {
            await batch.commit();
            onSuccess();
        } catch (err) {
            console.error("Error saving experience(s):", err);
            setError("Failed to save. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalContent = (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{experience ? 'Edit' : 'Log'} Experience</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {/* Form fields... */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium">Date</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} required className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium">Hours</label>
                        <input type="number" name="hours" value={formData.hours} onChange={handleChange} step="0.1" min="0" required placeholder="e.g., 8.5" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium">Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600">
                        {CATEGORY_NAMES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block mb-2 text-sm font-medium">Location / Organization</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} required placeholder="e.g., City General Hospital" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium">Notes / Reflections</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" placeholder="Describe your responsibilities..." className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600"></textarea>
                </div>
                {!experience && (
                    <div className="flex items-center pt-2">
                        <input id="isRecurring" type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">This is a recurring entry</label>
                    </div>
                )}
                {isRecurring && (
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium">End Date</label>
                                <input type="date" name="endDate" value={recurringData.endDate} onChange={handleRecurringChange} required className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium">Frequency</label>
                                <select name="frequency" value={recurringData.frequency} onChange={handleRecurringChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600">
                                    <option>Daily</option>
                                    <option>Weekly</option>
                                    <option>Bi-Weekly</option>
                                </select>
                            </div>
                        </div>
                        {(recurringData.frequency === 'Weekly' || recurringData.frequency === 'Bi-Weekly') && (
                            <div>
                                <label className="block mb-2 text-sm font-medium">Repeat on</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(recurringData.daysOfWeek).map(day => (
                                        <button type="button" key={day} onClick={() => handleDayToggle(day)} className={`px-3 py-1 text-sm rounded-full ${recurringData.daysOfWeek[day] ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="mt-6 flex justify-end gap-4">
                <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 dark:disabled:bg-blue-400">
                    {isSubmitting ? 'Saving...' : 'Save'}
                </button>
            </div>
        </form>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            {motion ? (
                 <motion.div 
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                >
                    {modalContent}
                </motion.div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">{modalContent}</div>
            )}
        </div>
    );
};

const SettingsPage = ({ setCurrentPage }) => {
    const { user } = useAuth();
    const [profile, setProfile] = useState({ track: 'Pre-Med', customTrack: '', bio: '', applicationYear: new Date().getFullYear() + 1 });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const applicationYears = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

    useEffect(() => {
        if (!user) return;
        const profileDocRef = doc(db, 'profiles', user.uid);
        const unsubscribe = onSnapshot(profileDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setProfile(prev => ({...prev, ...docSnap.data()}));
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        try {
            const profileDocRef = doc(db, 'profiles', user.uid);
            await setDoc(profileDocRef, profile, { merge: true });
            alert("Profile saved successfully!");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full" />
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{user.displayName}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                </div>
                
                <form onSubmit={handleSave} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="track" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Professional Track</label>
                            <select id="track" name="track" value={profile.track} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600">
                                <option>Pre-Med</option>
                                <option>Pre-PA</option>
                                <option>Pre-Dental</option>
                                <option>Other</option>
                            </select>
                        </div>
                        {profile.track === 'Other' && (
                            <div>
                                <label htmlFor="customTrack" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custom Track Name</label>
                                <input type="text" name="customTrack" id="customTrack" value={profile.customTrack || ''} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                        )}
                        <div>
                            <label htmlFor="applicationYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Planned Application Year</label>
                            <select id="applicationYear" name="applicationYear" value={profile.applicationYear} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600">
                                {applicationYears.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Professional Summary / Bio</label>
                        <textarea id="bio" name="bio" rows="4" value={profile.bio || ''} onChange={handleChange} placeholder="Briefly describe your goals and interests..." className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"></textarea>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => setCurrentPage('dashboard')} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                            Back to Dashboard
                        </button>
                        <button type="submit" disabled={isSaving} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const GoalModal = ({ isOpen, onClose, onSuccess, currentGoals, isGuest }) => {
    const { user } = useAuth();
    const [goals, setGoals] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const motion = window.motion;

    useEffect(() => {
        const initialGoals = CATEGORY_NAMES.reduce((acc, cat) => {
            acc[cat] = currentGoals[cat] || '';
            return acc;
        }, {});
        setGoals(initialGoals);
    }, [currentGoals]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setGoals(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const goalsToSave = Object.entries(goals).reduce((acc, [key, value]) => {
            acc[key] = parseInt(value, 10) || 0;
            return acc;
        }, {});

        if (isGuest) {
            console.log("Guest goals would be saved locally:", goalsToSave);
            onSuccess();
            setIsSubmitting(false);
            return;
        }

        try {
            const goalDocRef = doc(db, "goals", user.uid);
            await setDoc(goalDocRef, goalsToSave, { merge: true });
            onSuccess();
        } catch (error) {
            console.error("Error saving goals:", error);
            alert("Failed to save goals. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalContent = (
         <form onSubmit={handleSubmit} className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Set Your Hour Goals</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Set a target number of hours for each category to track your progress.</p>
            <div className="space-y-4">
                {CATEGORY_NAMES.map(cat => (
                     <div key={cat}>
                        <label htmlFor={cat} className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{cat}</label>
                        <input 
                            type="number" 
                            id={cat} 
                            name={cat}
                            value={goals[cat]}
                            onChange={handleChange}
                            min="0"
                            placeholder="e.g., 200" 
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        />
                    </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end gap-4">
                <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 dark:disabled:bg-blue-400">
                    {isSubmitting ? 'Saving...' : 'Save Goals'}
                </button>
            </div>
        </form>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            {motion ? (
                 <motion.div 
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                >
                    {modalContent}
                </motion.div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">{modalContent}</div>
            )}
        </div>
    );
};

// --- Helper function to calculate GPA ---
const calculateGPA = (courses, scienceOnly = false) => {
    const gradePoints = {
        'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
    };
    let totalPoints = 0;
    let totalCredits = 0;

    const coursesToCalculate = scienceOnly ? courses.filter(c => c.isScience) : courses;

    coursesToCalculate.forEach(course => {
        if (gradePoints[course.grade] !== undefined && course.credits > 0) {
            totalPoints += gradePoints[course.grade] * parseFloat(course.credits);
            totalCredits += parseFloat(course.credits);
        }
    });

    if (totalCredits === 0) return 'N/A';
    return (totalPoints / totalCredits).toFixed(2);
};


// --- Courses Page ---
const CoursesPage = ({ isGuest }) => {
    const [view, setView] = useState('log'); // 'log' or 'planner'

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Course Tracker</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {view === 'log' ? 'Log your academic journey and track your GPA.' : 'Plan your future semesters with a drag-and-drop interface.'}
                    </p>
                </div>
                <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-lg flex">
                    <button 
                        onClick={() => setView('log')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md ${view === 'log' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        Course Log
                    </button>
                    <button 
                        onClick={() => setView('planner')}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-md ${view === 'planner' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        Course Planner
                    </button>
                </div>
            </div>
            {view === 'log' ? <CourseLog isGuest={isGuest} /> : <CoursePlanner isGuest={isGuest} />}
        </div>
    );
};


const CourseLog = ({ isGuest }) => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const motion = window.motion;

    useEffect(() => {
        if (isGuest) {
            setCourses(getMockData().courses || []);
            setLoading(false);
            return;
        }
        if (!user || !db) {
            setLoading(false);
            return;
        }

        const q = query(collection(db, "courses"), where("userId", "==", user.uid), orderBy("year", "desc"), orderBy("semester", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const coursesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCourses(coursesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching courses:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, isGuest]);

    const handleAddOrUpdate = () => {
        setIsModalOpen(false);
        setEditingCourse(null);
    };

    const handleEdit = (course) => {
        setEditingCourse(course);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (isGuest) {
            setCourses(courses.filter(c => c.id !== id));
            return;
        }
        if (window.confirm("Are you sure you want to delete this course?")) {
            try {
                await deleteDoc(doc(db, "courses", id));
            } catch (error) {
                console.error("Error deleting course:", error);
            }
        }
    };
    
    const cumulativeGpa = calculateGPA(courses);
    const scienceGpa = calculateGPA(courses, true);

    const groupedCourses = courses.reduce((acc, course) => {
        const key = `${course.year} - ${course.semester}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(course);
        return acc;
    }, {});

    return (
        <div className="space-y-8">
            <div className="flex justify-end">
                 <button onClick={() => { setEditingCourse(null); setIsModalOpen(true); }} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transform hover:scale-105 transition-transform">
                    Add Course
                </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cumulative GPA</h3>
                    <p className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">{cumulativeGpa}</p>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Science GPA (BCPM)</h3>
                    <p className="text-4xl font-extrabold text-green-600 dark:text-green-400 mt-2">{scienceGpa}</p>
                </div>
            </div>

            <div className="space-y-6">
                {loading ? <p>Loading courses...</p> : Object.keys(groupedCourses).length === 0 ? (
                     <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No courses logged</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding your first course.</p>
                    </div>
                ) : (
                    Object.entries(groupedCourses).map(([group, coursesInGroup]) => (
                        <div key={group} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{group}</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Course Name</th>
                                            <th scope="col" className="px-6 py-3">Code</th>
                                            <th scope="col" className="px-6 py-3">Credits</th>
                                            <th scope="col" className="px-6 py-3">Grade</th>
                                            <th scope="col" className="px-6 py-3 text-center">Science</th>
                                            <th scope="col" className="px-6 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {coursesInGroup.map(course => <CourseRow key={course.id} course={course} onEdit={handleEdit} onDelete={handleDelete} />)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {motion && <motion.AnimatePresence>
                {isModalOpen && (
                    <CourseModal 
                        isOpen={isModalOpen}
                        onClose={() => { setIsModalOpen(false); setEditingCourse(null); }}
                        onSuccess={handleAddOrUpdate}
                        course={editingCourse}
                        isGuest={isGuest}
                    />
                )}
            </motion.AnimatePresence>}
            {!motion && isModalOpen && (
                 <CourseModal 
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setEditingCourse(null); }}
                    onSuccess={handleAddOrUpdate}
                    course={editingCourse}
                    isGuest={isGuest}
                />
            )}
        </div>
    );
};

const CoursePlanner = ({ isGuest }) => {
    const { user } = useAuth();
    const [takenCourses, setTakenCourses] = useState([]);
    const [plannedCourses, setPlannedCourses] = useState([]);
    const [plan, setPlan] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddCourseForm, setShowAddCourseForm] = useState(false);

    // Auto-populate taken courses into the plan on initial load
    useEffect(() => {
        if (takenCourses.length > 0) {
            const autoPlan = {};
            takenCourses.forEach(course => {
                const semesterId = `${course.semester}-${course.year}`;
                if (!autoPlan[semesterId]) {
                    autoPlan[semesterId] = [];
                }
                // Avoid adding duplicates if already in a user-saved plan
                const isAlreadyInPlan = Object.values(plan).flat().some(p => p.id === course.id);
                if (!isAlreadyInPlan) {
                   autoPlan[semesterId].push(course);
                }
            });
            // Merge with existing plan, giving user's manual placement priority
            setPlan(prevPlan => {
                const newPlan = {...autoPlan};
                Object.keys(prevPlan).forEach(semId => {
                    if (newPlan[semId]) {
                        // Filter out duplicates, keeping the one from the user's saved plan
                        const userPlannedIds = prevPlan[semId].map(c => c.id);
                        newPlan[semId] = newPlan[semId].filter(c => !userPlannedIds.includes(c.id));
                        newPlan[semId].push(...prevPlan[semId]);
                    } else {
                        newPlan[semId] = prevPlan[semId];
                    }
                });
                return newPlan;
            });
        }
    }, [takenCourses]); // Rerun only when taken courses are loaded

    // Generate upcoming semesters for the planner
    const generateSemesters = () => {
        const semesters = [];
        const currentYear = new Date().getFullYear();
        for (let i = -2; i < 5; i++) { // Show past 2 years as well
            const year = currentYear + i;
            semesters.push({ id: `Fall-${year}`, name: `Fall ${year}` });
            semesters.push({ id: `Spring-${year + 1}`, name: `Spring ${year + 1}` });
            semesters.push({ id: `Summer-${year + 1}`, name: `Summer ${year + 1}` });
        }
        return semesters;
    };
    const upcomingSemesters = generateSemesters();

    useEffect(() => {
        if (isGuest) {
            setTakenCourses(getMockData().courses || []);
            setPlannedCourses(getMockData().plannedCourses || []);
            setPlan(getMockData().coursePlan || {});
            setLoading(false);
            return;
        }
        if (!user || !db) {
            setLoading(false);
            return;
        }

        // Fetch all logged (taken) courses
        const coursesQuery = query(collection(db, "courses"), where("userId", "==", user.uid));
        const unsubscribeTaken = onSnapshot(coursesQuery, (snapshot) => {
            setTakenCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'taken' })));
            setLoading(false);
        });

        // Fetch all planned courses
        const plannedQuery = query(collection(db, "plannedCourses"), where("userId", "==", user.uid));
        const unsubscribePlanned = onSnapshot(plannedQuery, (snapshot) => {
            setPlannedCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'planned' })));
        });

        // Fetch the saved course plan
        const planDocRef = doc(db, 'coursePlans', user.uid);
        const unsubscribePlan = onSnapshot(planDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setPlan(docSnap.data().plan || {});
            }
        });

        return () => {
            unsubscribeTaken();
            unsubscribePlanned();
            unsubscribePlan();
        };
    }, [user, isGuest]);

    const handleDragStart = (e, course) => {
        e.dataTransfer.setData('course', JSON.stringify(course));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, semesterId) => {
        e.preventDefault();
        const course = JSON.parse(e.dataTransfer.getData('course'));
        
        setPlan(prevPlan => {
            const newPlan = { ...prevPlan };
            Object.keys(newPlan).forEach(sem => {
                newPlan[sem] = newPlan[sem].filter(c => c.id !== course.id);
            });
            const semesterCourses = newPlan[semesterId] || [];
            if (!semesterCourses.some(c => c.id === course.id)) {
                newPlan[semesterId] = [...semesterCourses, course];
            }
            return newPlan;
        });
    };
    
    const removeFromPlan = (courseId, semesterId) => {
        setPlan(prevPlan => {
            const newPlan = { ...prevPlan };
            if (newPlan[semesterId]) {
                newPlan[semesterId] = newPlan[semesterId].filter(c => c.id !== courseId);
            }
            return newPlan;
        });
    };

    const handleSavePlan = async () => {
        if (isGuest) {
            alert("Saving is disabled in Guest Mode.");
            return;
        }
        setIsSaving(true);
        try {
            const planDocRef = doc(db, 'coursePlans', user.uid);
            await setDoc(planDocRef, { plan });
            alert("Plan saved successfully!");
        } catch (error) {
            console.error("Error saving plan:", error);
            alert("Failed to save plan.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const allAvailableCourses = [...takenCourses, ...plannedCourses];
    const unassignedCourses = allAvailableCourses.filter(course => 
        !Object.values(plan).flat().some(plannedCourse => plannedCourse.id === course.id)
    );

    if (loading) return <p>Loading planner...</p>;

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Course Bank */}
            <div className="lg:w-1/3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col">
                <h3 className="text-lg font-bold mb-4">Course Bank</h3>
                <div className="space-y-2 flex-grow overflow-y-auto pr-2">
                    {unassignedCourses.map(course => (
                        <div 
                            key={course.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, course)}
                            className={`p-2 rounded-lg cursor-grab active:cursor-grabbing ${course.type === 'taken' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700'}`}
                        >
                            <p className="font-semibold">{course.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{course.code}</p>
                        </div>
                    ))}
                     {unassignedCourses.length === 0 && !showAddCourseForm && <p className="text-sm text-gray-500">All courses have been planned.</p>}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {showAddCourseForm ? (
                        <AddPlannedCourseForm 
                            userId={user?.uid} 
                            isGuest={isGuest}
                            onClose={() => setShowAddCourseForm(false)} 
                        />
                    ) : (
                        <button 
                            onClick={() => setShowAddCourseForm(true)}
                            className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-semibold py-2 px-4 rounded-lg"
                        >
                            + Add Planned Course
                        </button>
                    )}
                </div>
            </div>

            {/* Planner Grid */}
            <div className="lg:w-2/3">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Your Course Plan</h3>
                    <button 
                        onClick={handleSavePlan}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Plan'}
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingSemesters.map(semester => (
                        <div 
                            key={semester.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, semester.id)}
                            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg min-h-[150px] border-2 border-dashed border-gray-300 dark:border-gray-600"
                        >
                            <h4 className="font-bold border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">{semester.name}</h4>
                            <div className="space-y-2">
                                {plan[semester.id] && plan[semester.id].map(course => (
                                    <div key={course.id} className={`p-2 rounded-lg relative ${course.type === 'taken' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-yellow-100 dark:bg-yellow-900/50'}`}>
                                        <p className="font-semibold">{course.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{course.code}</p>
                                        <button 
                                            onClick={() => removeFromPlan(course.id, semester.id)}
                                            className="absolute top-1 right-1 text-gray-400 hover:text-red-500"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const AddPlannedCourseForm = ({ userId, isGuest, onClose }) => {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return;
        if (isGuest) {
            alert("Adding courses is disabled in Guest Mode.");
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'plannedCourses'), {
                name,
                code,
                userId,
                createdAt: serverTimestamp(),
            });
            setName('');
            setCode('');
            onClose();
        } catch (error) {
            console.error("Error adding planned course:", error);
            alert("Failed to add course.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Course Name (e.g., Physics II)"
                required
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            />
            <input 
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Course Code (e.g., PHYS 221)"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
            />
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="w-full py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="w-full py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {isSubmitting ? '...' : 'Add'}
                </button>
            </div>
        </form>
    );
};

const CourseRow = ({ course, onEdit, onDelete }) => {
    return (
        <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{course.name}</td>
            <td className="px-6 py-4">{course.code}</td>
            <td className="px-6 py-4">{course.credits}</td>
            <td className="px-6 py-4 font-bold">{course.grade}</td>
            <td className="px-6 py-4 text-center">
                {course.isScience && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 inline-block" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                )}
            </td>
            <td className="px-6 py-4 flex items-center gap-2">
                <button onClick={() => onEdit(course)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Edit</button>
                <button onClick={() => onDelete(course.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">Delete</button>
            </td>
        </tr>
    );
};

const CourseModal = ({ isOpen, onClose, onSuccess, course, isGuest }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '', code: '', credits: '', semester: 'Fall', year: new Date().getFullYear(), grade: 'A', isScience: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const motion = window.motion;

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
    const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'P', 'NP'];

    useEffect(() => {
        if (course) {
            setFormData({ ...course, isScience: course.isScience || false });
        } else {
            setFormData({ name: '', code: '', credits: '', semester: 'Fall', year: new Date().getFullYear(), grade: 'A', isScience: false });
        }
    }, [course]);
    
    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.credits || formData.credits <= 0) {
            setError('Course name and positive credits are required.');
            return;
        }
        setError('');
        setIsSubmitting(true);

        const dataToSave = {
            ...formData,
            credits: parseFloat(formData.credits),
            year: parseInt(formData.year, 10),
            userId: user.uid,
            isScience: formData.isScience || false,
        };

        try {
            if (course) {
                const docRef = doc(db, 'courses', course.id);
                await updateDoc(docRef, dataToSave);
            } else {
                await addDoc(collection(db, 'courses'), dataToSave);
            }
            onSuccess();
        } catch (err) {
            console.error("Error saving course:", err);
            setError("Failed to save course. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalContent = (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{course ? 'Edit' : 'Add'} Course</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="space-y-4">
                <div>
                    <label className="block mb-2 text-sm font-medium">Course Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g., General Chemistry I" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium">Course Code</label>
                    <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="e.g., CHEM 101" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium">Credits</label>
                        <input type="number" name="credits" value={formData.credits} onChange={handleChange} step="0.1" min="0" required placeholder="e.g., 4" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium">Grade</label>
                        <select name="grade" value={formData.grade} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600">
                            {grades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium">Semester</label>
                        <select name="semester" value={formData.semester} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600">
                            <option>Fall</option>
                            <option>Spring</option>
                            <option>Summer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium">Year</label>
                        <select name="year" value={formData.year} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
                <div className="pt-2">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="isScience"
                            checked={formData.isScience}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">This is a science course (for BCPM GPA)</span>
                    </label>
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-4">
                <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 dark:disabled:bg-blue-400">
                    {isSubmitting ? 'Saving...' : 'Save'}
                </button>
            </div>
        </form>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            {motion ? (
                 <motion.div 
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                >
                    {modalContent}
                </motion.div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">{modalContent}</div>
            )}
        </div>
    );
};

// --- EXPORT PAGE COMPONENT ---
const ExportPage = ({ isGuest }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({});
    const [experiences, setExperiences] = useState([]);
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        if (isGuest) {
            const mock = getMockData();
            setProfile(mock.profile);
            setExperiences(mock.experiences);
            setCourses(mock.courses);
            setLoading(false);
            return;
        }

        if (!user) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Profile
                const profileDocRef = doc(db, 'profiles', user.uid);
                const profileSnap = await getDoc(profileDocRef);
                if (profileSnap.exists()) {
                    setProfile(profileSnap.data());
                }

                // Fetch Experiences
                const expQuery = query(collection(db, "experiences"), where("userId", "==", user.uid), orderBy("date", "desc"));
                const expSnap = await getDocs(expQuery);
                setExperiences(expSnap.docs.map(d => ({...d.data(), id: d.id})));

                // Fetch Courses
                const courseQuery = query(collection(db, "courses"), where("userId", "==", user.uid), orderBy("year", "desc"), orderBy("semester", "desc"));
                const courseSnap = await getDocs(courseQuery);
                setCourses(courseSnap.docs.map(d => ({...d.data(), id: d.id})));

            } catch (error) {
                console.error("Error fetching data for export:", error);
                alert("Could not fetch all data for the report. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, isGuest]);

    const handleExportPDF = () => {
        if (typeof window.jspdf === 'undefined') {
            alert('PDF library is not loaded yet. Please wait a moment and try again.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // --- Document Header ---
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('Pre-Professional Report Card', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Report generated on: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });

        // --- Profile Section ---
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Applicant Profile', 14, 45);
        doc.setLineWidth(0.5);
        doc.line(14, 47, 196, 47);

        const profileName = isGuest ? "Guest User" : user?.displayName || 'N/A';
        const profileEmail = isGuest ? "guest@example.com" : user?.email || 'N/A';
        const profileTrack = profile.track === 'Other' ? profile.customTrack : profile.track;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${profileName}`, 16, 55);
        doc.text(`Email: ${profileEmail}`, 16, 61);
        doc.text(`Track: ${profileTrack || 'N/A'}`, 105, 55);
        doc.text(`Application Year: ${profile.applicationYear || 'N/A'}`, 105, 61);

        // --- Summary Section ---
        const totalHours = experiences.reduce((sum, exp) => sum + (exp.hours || 0), 0);
        const cumulativeGpa = calculateGPA(courses);
        const scienceGpa = calculateGPA(courses, true);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Academic & Experience Summary', 14, 75);
        doc.line(14, 77, 196, 77);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Cumulative GPA: ${cumulativeGpa}`, 16, 85);
        doc.text(`Science (BCPM) GPA: ${scienceGpa}`, 105, 85);
        doc.text(`Total Experience Hours: ${totalHours.toFixed(1)}`, 16, 91);

        // --- Experience Log Table ---
        const expBody = experiences.map(exp => [
            exp.date?.toDate ? exp.date.toDate().toLocaleDateString() : 'N/A',
            exp.category,
            exp.location,
            exp.hours.toFixed(1),
            exp.notes || ''
        ]);
        doc.autoTable({
            head: [['Date', 'Category', 'Location/Org', 'Hours', 'Notes']],
            body: expBody,
            startY: 100,
            headStyles: { fillColor: [22, 160, 133] },
            didDrawPage: (data) => {
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Experience Log', 14, data.cursor.y - 10);
            }
        });
        
        // --- Course Log Table ---
        const courseBody = courses.map(c => [
            `${c.semester} ${c.year}`,
            c.name,
            c.code,
            c.credits,
            c.grade,
            c.isScience ? 'Yes' : 'No'
        ]);
        doc.autoTable({
            head: [['Term', 'Course Name', 'Code', 'Credits', 'Grade', 'Science']],
            body: courseBody,
            startY: doc.autoTable.previous.finalY + 20,
            headStyles: { fillColor: [41, 128, 185] },
            didDrawPage: (data) => {
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Academic History', 14, data.cursor.y - 10);
            }
        });

        doc.save(`PreProFolio_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const downloadCsv = (data, filename) => {
        if (typeof window.Papa === 'undefined') {
            alert('CSV library is not loaded yet. Please wait a moment and try again.');
            return;
        }
        const csv = window.Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportExperiencesCSV = () => {
        const data = experiences.map(exp => ({
            Date: exp.date?.toDate ? exp.date.toDate().toLocaleDateString() : 'N/A',
            Category: exp.category,
            Hours: exp.hours,
            Location: exp.location,
            Notes: exp.notes,
        }));
        downloadCsv(data, `PreProFolio_Experiences_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportCoursesCSV = () => {
        const data = courses.map(c => ({
            Year: c.year,
            Semester: c.semester,
            'Course Name': c.name,
            'Course Code': c.code,
            Credits: c.credits,
            Grade: c.grade,
            'Is Science (BCPM)': c.isScience ? 'Yes' : 'No',
        }));
        downloadCsv(data, `PreProFolio_Courses_${new Date().toISOString().split('T')[0]}.csv`);
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Export Your Report</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Generate a comprehensive report of your academic and experiential progress.</p>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* PDF Export */}
                    <div className="flex flex-col items-center text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <h3 className="text-xl font-bold mb-2">PDF Report Card</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">Generate a single, printable PDF document summarizing your entire profile. Ideal for sharing with advisors or including in applications.</p>
                        <button 
                            onClick={handleExportPDF}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow-md flex items-center justify-center gap-2"
                        >
                            Export as PDF
                        </button>
                    </div>
                    {/* CSV Export */}
                    <div className="flex flex-col items-center text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                        <h3 className="text-xl font-bold mb-2">CSV Data Export</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">Download your data in CSV format for use in spreadsheets like Excel or Google Sheets. Perfect for custom analysis and record-keeping.</p>
                        <div className="w-full space-y-3">
                            <button 
                                onClick={handleExportExperiencesCSV}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md flex items-center justify-center gap-2"
                            >
                                Export Experiences (CSV)
                            </button>
                             <button 
                                onClick={handleExportCoursesCSV}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md flex items-center justify-center gap-2"
                            >
                                Export Courses (CSV)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
