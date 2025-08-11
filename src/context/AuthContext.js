import React, { useState, useEffect, createContext, useContext } from 'react';
import { auth, onAuthStateChanged, db, doc, getDoc } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // User is signed in, now fetch their role from Firestore.
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    // User has a document, add their role to the user object.
                    setUser({ ...currentUser, role: userDocSnap.data().role });
                } else {
                    // User is authenticated but has no document/role yet.
                    // Default them to a 'user' role.
                    setUser({ ...currentUser, role: 'user' });
                }
            } else {
                // User is signed out.
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = { user, loading };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
