import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, serverTimestamp, setDoc, getDoc, onSnapshot, orderBy, writeBatch } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Analytics } from "@vercel/analytics/react";

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
const getMockData = () => ([
    { id: 'mock1', category: 'Patient Care Experience', date: { toDate: () => new Date('2024-05-15') }, hours: 40, location: 'Community Hospital ER', notes: 'Assisted with patient vitals and transport.' },
    { id: 'mock2', category: 'Volunteer Work', date: { toDate: () => new Date('2024-06-20') }, hours: 25, location: 'Local Soup Kitchen', notes: 'Served meals and helped with cleanup.' },
    { id: 'mock3', category: 'Shadowing', date: { toDate: () => new Date('2024-07-05') }, hours: 16, location: 'Dr. Smith\'s Clinic', notes: 'Observed patient consultations and procedures.' },
    { id: 'mock4', category: 'Research', date: { toDate: () => new Date('2024-07-22') }, hours: 60, location: 'University Biology Lab', notes: 'Conducted experiments on cell cultures.' },
    { id: 'mock5', category: 'Healthcare Experience', date: { toDate: () => new Date('2024-04-10') }, hours: 35, location: 'Pharmacy Technician', notes: 'Filled prescriptions and managed inventory.' },
]);

const mockGoals = {
    'Patient Care Experience': 200,
    'Healthcare Experience': 100,
    'Research': 150,
    'Shadowing': 50,
    'Volunteer Work': 100,
    'Other': 0
};

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
    const backgroundClass = !user && !loading ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800';

    return (
        <div className={`min-h-screen font-sans ${backgroundClass} text-gray-800 dark:text-gray-200 transition-colors duration-300`}>
            <AppContent darkMode={darkMode} toggleDarkMode={toggleDarkMode} currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <Analytics />
        </div>
    );
}


// --- App Content (Handles Routing) ---
const AppContent = ({ darkMode, toggleDarkMode, currentPage, setCurrentPage }) => {
    const { user, loading } = useAuth();
    const [isGuest, setIsGuest] = useState(false);

    const handleSignOut = async () => {
        if (isGuest) {
            setIsGuest(false);
        } else if (auth) {
            try {
                await signOut(auth);
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
                return <Dashboard isGuest={isGuest} />;
            case 'courses':
                return <CoursesPage isGuest={isGuest} />;
            case 'settings':
                return <SettingsPage setCurrentPage={setCurrentPage} />;
            default:
                return <Dashboard isGuest={isGuest} />;
        }
    }

    return (
        <>
            {user || isGuest ? <Header darkMode={darkMode} setDarkMode={toggleDarkMode} onSignOut={handleSignOut} showSignOut={!!user || isGuest} setCurrentPage={setCurrentPage} /> : null}
            <main>
                {user || isGuest ? (
                    <div className="p-4 sm:p-6 lg:p-8">
                        {renderPage()}
                    </div>
                ) : <LoginScreen onGuestLogin={() => setIsGuest(true)} />}
            </main>
        </>
    );
};

// --- UI Components ---

const Header = ({ darkMode, setDarkMode, onSignOut, showSignOut, setCurrentPage }) => {
    return (
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <button onClick={() => setCurrentPage('dashboard')} className="flex items-center space-x-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">PreProFolio</h1>
                    </button>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setCurrentPage('courses')} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </button>
                        <button onClick={() => setCurrentPage('settings')} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                        <button onClick={setDarkMode} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none">
                            {darkMode ? 
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : 
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                            }
                        </button>
                        {showSignOut && (
                            <button onClick={onSignOut} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors duration-200">
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
                           <button onClick={handleSignIn} className="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                                <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.836 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
                                Sign In with Google
                            </button>
                            <button onClick={onGuestLogin} className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">Try the Demo <span aria-hidden="true">→</span></button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 py-24 sm:py-32">
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
            <p className="text-lg font-semibold">Loading your dashboard...</p>
        </div>
    </div>
);


// --- Dashboard Components ---
const Dashboard = ({ isGuest }) => {
    const { user } = useAuth();
    const [experiences, setExperiences] = useState([]);
    const [goals, setGoals] = useState({});
    const [loading, setLoading] = useState(true);
    const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [editingExperience, setEditingExperience] = useState(null);
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    
    useEffect(() => {
        if (isGuest) {
            setExperiences(getMockData());
            setGoals(mockGoals);
            setLoading(false);
            return;
        }
        if (!user || !db) {
            setLoading(false);
            return;
        };

        setLoading(true);

        const expQuery = query(collection(db, "experiences"), where("userId", "==", user.uid), orderBy("date", "desc"));
        const unsubscribeExperiences = onSnapshot(expQuery, (querySnapshot) => {
            const experiencesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExperiences(experiencesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching experiences in real-time:", error);
            alert("Could not fetch experiences. Check the developer console for errors (F12). It's likely a missing Firestore index.");
            setLoading(false);
        });

        const goalDocRef = doc(db, "goals", user.uid);
        const unsubscribeGoals = onSnapshot(goalDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setGoals(docSnap.data());
            } else {
                setGoals({});
            }
        }, (error) => {
            console.error("Error fetching goals in real-time:", error);
        });

        return () => {
            unsubscribeExperiences();
            unsubscribeGoals();
        };
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

        if (window.confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, "experiences", id));
            } catch (error) {
                console.error("Error deleting experience:", error);
            }
        }
    };

    const handleGoalsSaved = () => {
        setIsGoalModalOpen(false);
    }
    
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

    const displayName = isGuest ? "Guest" : user?.displayName;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Your Dashboard</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back, {displayName}!</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button onClick={() => setIsGoalModalOpen(true)} className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2">
                        Set Goals
                    </button>
                    <button onClick={() => { setEditingExperience(null); setIsExperienceModalOpen(true); }} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2">
                        Log Experience
                    </button>
                </div>
            </div>
            
            <AnalyticsSummary experiences={experiences} goals={goals} />
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

            {isExperienceModalOpen && (
                <ExperienceModal 
                    isOpen={isExperienceModalOpen}
                    onClose={() => { setIsExperienceModalOpen(false); setEditingExperience(null); }}
                    onSuccess={handleAddOrUpdate}
                    experience={editingExperience}
                    isGuest={isGuest}
                />
            )}
            {isGoalModalOpen && (
                <GoalModal
                    isOpen={isGoalModalOpen}
                    onClose={() => setIsGoalModalOpen(false)}
                    onSuccess={handleGoalsSaved}
                    currentGoals={goals}
                    isGuest={isGuest}
                />
            )}
        </div>
    );
};

const AnalyticsSummary = ({ experiences, goals }) => {
    const summary = CATEGORIES.map(cat => {
        const current = experiences.filter(e => e.category === cat.name).reduce((acc, curr) => acc + (curr.hours || 0), 0);
        const goal = goals[cat.name] || 0;
        const progress = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
        return { name: cat.name, current, goal, progress, color: cat.color };
    });

    const totalHours = experiences.reduce((acc, curr) => acc + (curr.hours || 0), 0);
    const totalGoal = Object.values(goals).reduce((acc, curr) => acc + (parseInt(curr, 10) || 0), 0);
    const totalProgress = totalGoal > 0 ? Math.min((totalHours / totalGoal) * 100, 100) : 0;

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-4">
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white">Overall Progress</h3>
                 <div className="space-y-1">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-lg text-gray-800 dark:text-gray-200">Total Hours</span>
                        <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{totalHours.toFixed(1)} / {totalGoal}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${totalProgress}%` }}></div>
                    </div>
                </div>
                <div className="pt-4 space-y-3">
                    {summary.filter(s => s.goal > 0).map((item) => (
                        <div key={item.name}>
                            <div className="flex justify-between text-sm font-medium mb-1">
                                <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                                <span className="text-gray-500 dark:text-gray-400">{item.current.toFixed(1)} / {item.goal} hrs</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div className="h-2.5 rounded-full" style={{ width: `${item.progress}%`, backgroundColor: item.color }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Monthly Progress</h3>
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
                ) : <p className="text-center text-gray-500 dark:text-gray-400 pt-16">Log hours to see your progress.</p>}
            </div>
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
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Experience Log</h3>
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{experience ? 'Edit' : 'Log'} Experience</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                    <div className="space-y-4">
                        {/* Standard Fields */}
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
                        
                        {/* Recurring Entry Toggle */}
                        {!experience && (
                            <div className="flex items-center pt-2">
                                <input id="isRecurring" type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">This is a recurring entry</label>
                            </div>
                        )}

                        {/* Recurring Fields */}
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
            </div>
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
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Set Your Hour Goals</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
            </div>
        </div>
    );
};
