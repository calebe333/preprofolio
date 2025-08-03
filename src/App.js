import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, serverTimestamp, setDoc, getDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    const backgroundClass = !user && !loading ? 'bg-gradient-to-br from-gray-50 to-blue-100 dark:from-gray-900 dark:to-blue-900' : 'bg-gray-50 dark:bg-gray-900';

    return (
        <div className={`min-h-screen font-sans ${backgroundClass} text-gray-800 dark:text-gray-200 transition-colors duration-300`}>
            <AppContent darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        </div>
    );
}


// --- App Content (Handles Routing) ---
const AppContent = ({ darkMode, toggleDarkMode }) => {
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

    return (
        <>
            {user || isGuest ? <Header darkMode={darkMode} setDarkMode={toggleDarkMode} onSignOut={handleSignOut} showSignOut={!!user || isGuest} /> : null}
            <main className="p-4 sm:p-6 lg:p-8">
                {user || isGuest ? <Dashboard isGuest={isGuest} /> : <LoginScreen onGuestLogin={() => setIsGuest(true)} />}
            </main>
        </>
    );
};

// --- UI Components ---

const Header = ({ darkMode, setDarkMode, onSignOut, showSignOut }) => {
    return (
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">PreProFolio</h1>
                    </div>
                    <div className="flex items-center space-x-4">
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

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-2xl">
                <div className="flex flex-col items-center space-y-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PreProFolio</h1>
                </div>
                <p className="text-gray-600 dark:text-gray-300">Your digital logbook for the journey to professional school. Track hours, set goals, and stay organized.</p>
                <div className="space-y-4 pt-4">
                    <button onClick={handleSignIn} className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 duration-300">
                        <svg className="w-6 h-6 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.836 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
                        Sign In with Google
                    </button>
                    <button onClick={onGuestLogin} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 duration-300">
                        Continue as Guest
                    </button>
                </div>
            </div>
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [editingExperience, setEditingExperience] = useState(null);
    const [filter, setFilter] = useState({ category: 'All' });
    
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

        // Real-time listener for experiences with explicit ordering
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

        // Real-time listener for goals
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

        // Cleanup function to unsubscribe from listeners when component unmounts
        return () => {
            unsubscribeExperiences();
            unsubscribeGoals();
        };
    }, [user, isGuest]);

    const handleAddOrUpdate = () => {
        setIsModalOpen(false);
        setEditingExperience(null);
    };
    
    const handleEdit = (exp) => {
        setEditingExperience(exp);
        setIsModalOpen(true);
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
        return filter.category === 'All' || exp.category === filter.category;
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg>
                        Set Goals
                    </button>
                    <button onClick={() => { setEditingExperience(null); setIsModalOpen(true); }} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        Log New Experience
                    </button>
                </div>
            </div>
            
            <AnalyticsSummary experiences={experiences} goals={goals} />
            <ExperienceLog 
                experiences={filteredExperiences} 
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                filter={filter}
                setFilter={setFilter}
            />

            {isModalOpen && (
                <ExperienceModal 
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setEditingExperience(null); }}
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
    const categories = [
        { name: 'Patient Care Experience', color: '#3B82F6' },
        { name: 'Healthcare Experience', color: '#10B981' },
        { name: 'Research', color: '#F59E0B' },
        { name: 'Shadowing', color: '#8B5CF6' },
        { name: 'Volunteer Work', color: '#EF4444' },
        { name: 'Other', color: '#6B7280' },
    ];

    const summary = categories.map(cat => {
        const current = experiences.filter(e => e.category === cat.name).reduce((acc, curr) => acc + (curr.hours || 0), 0);
        const goal = goals[cat.name] || 0;
        const progress = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
        return { name: cat.name, current, goal, progress, color: cat.color };
    });

    const totalHours = experiences.reduce((acc, curr) => acc + (curr.hours || 0), 0);
    const totalGoal = Object.values(goals).reduce((acc, curr) => acc + (parseInt(curr, 10) || 0), 0);
    const totalProgress = totalGoal > 0 ? Math.min((totalHours / totalGoal) * 100, 100) : 0;

    const barData = experiences.reduce((acc, exp) => {
        if (!exp.date || !exp.date.toDate) return acc;
        const month = exp.date.toDate().toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!acc[month]) {
            acc[month] = 0;
        }
        acc[month] += exp.hours;
        return acc;
    }, {});

    const sortedBarData = Object.entries(barData)
        .map(([name, hours]) => ({ name, hours }))
        .sort((a, b) => new Date(a.name) - new Date(b.name));


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
                            <Bar dataKey="hours" fill="#3B82F6" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <p className="text-center text-gray-500 dark:text-gray-400 pt-16">Log hours to see your progress.</p>}
            </div>
        </div>
    );
};

const ExperienceLog = ({ experiences, loading, onEdit, onDelete, filter, setFilter }) => {
    const categories = ['All', 'Patient Care Experience', 'Healthcare Experience', 'Research', 'Shadowing', 'Volunteer Work', 'Other'];

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Experience Log</h3>
                <div className="flex items-center gap-2">
                    <label htmlFor="category-filter" className="text-sm font-medium">Filter by:</label>
                    <select
                        id="category-filter"
                        value={filter.category}
                        onChange={(e) => setFilter({...filter, category: e.target.value})}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
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
                        ) : experiences.length === 0 ? (
                            <tr><td colSpan="6" className="text-center p-8">No experiences logged yet. Click "Log New Experience" to get started!</td></tr>
                        ) : (
                            experiences.map(exp => <ExperienceRow key={exp.id} exp={exp} onEdit={onEdit} onDelete={onDelete} />)
                        )}
                    </tbody>
                </table>
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.hours || formData.hours <= 0) {
            setError('Hours must be a positive number.');
            return;
        }
        setError('');
        setIsSubmitting(true);

        const dataToSave = {
            ...formData,
            hours: parseFloat(formData.hours),
        };

        if (isGuest) {
            onSuccess(dataToSave);
            setIsSubmitting(false);
            return;
        }
        
        const finalData = {
             ...dataToSave,
             date: new Date(dataToSave.date),
             userId: user.uid,
        }

        try {
            if (experience) {
                const docRef = doc(db, 'experiences', experience.id);
                await updateDoc(docRef, { ...finalData, updatedAt: serverTimestamp() });
            } else {
                await addDoc(collection(db, 'experiences'), { ...finalData, createdAt: serverTimestamp() });
            }
            onSuccess();
        } catch (err) {
            console.error("Error saving experience:", err);
            setError("Failed to save experience. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const categories = ['Patient Care Experience', 'Healthcare Experience', 'Research', 'Shadowing', 'Volunteer Work', 'Other'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{experience ? 'Edit' : 'Log New'} Experience</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="category" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Category</label>
                            <select id="category" name="category" value={formData.category} onChange={handleChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="date" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Date</label>
                                <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label htmlFor="hours" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Total Hours</label>
                                <input type="number" id="hours" name="hours" value={formData.hours} onChange={handleChange} step="0.1" min="0" required placeholder="e.g., 8.5" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="location" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Location / Organization</label>
                            <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} required placeholder="e.g., City General Hospital" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="notes" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Notes / Reflections</label>
                            <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="4" placeholder="Describe your responsibilities and what you learned..." className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} className="py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 dark:disabled:bg-blue-400">
                            {isSubmitting ? 'Saving...' : 'Save Experience'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const GoalModal = ({ isOpen, onClose, onSuccess, currentGoals, isGuest }) => {
    const { user } = useAuth();
    const categories = ['Patient Care Experience', 'Healthcare Experience', 'Research', 'Shadowing', 'Volunteer Work', 'Other'];
    const [goals, setGoals] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const initialGoals = categories.reduce((acc, cat) => {
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
            // In a real app, you might update a local state for the guest user
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
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Set a target number of hours for each category to track your progress.</p>

                    <div className="space-y-4">
                        {categories.map(cat => (
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
