import React, 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from '../firebase';
import LoadingScreen from '../components/LoadingScreen';

// --- Chat Message Component ---
// Renders a single message bubble
const ChatMessage = ({ message, isCurrentUser }) => {
    const { text, displayName, photoURL, createdAt } = message;
    const messageDate = createdAt?.toDate ? createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    
    // Align messages from the current user to the right
    const alignmentClass = isCurrentUser ? 'items-end' : 'items-start';
    const bubbleClass = isCurrentUser 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200';

    return (
        <div className={`flex flex-col ${alignmentClass} mb-4`}>
            <div className="flex items-center gap-3">
                {!isCurrentUser && <img src={photoURL || 'https://placehold.co/40x40/E2E8F0/4A5568?text=U'} alt={displayName} className="w-8 h-8 rounded-full" />}
                <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${bubbleClass}`}>
                    <p className="text-sm">{text}</p>
                </div>
                {isCurrentUser && <img src={photoURL || 'https://placehold.co/40x40/93C5FD/1E40AF?text=Me'} alt={displayName} className="w-8 h-8 rounded-full" />}
            </div>
            <p className={`text-xs text-gray-400 mt-1 ${isCurrentUser ? 'mr-12' : 'ml-12'}`}>
                {!isCurrentUser && `${displayName} at `}{messageDate}
            </p>
        </div>
    );
};

// --- Main Community Page Component ---
export default function CommunityPage({ isGuest }) {
    const { user } = useAuth();
    const [messages, setMessages] = React.useState([]);
    const [newMessage, setNewMessage] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const chatEndRef = React.useRef(null);

    // Scroll to the bottom of the chat on new messages
    React.useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch chat messages from Firestore in real-time
    React.useEffect(() => {
        if (isGuest) {
            // Show mock data for guests
            setMessages([
                { id: 1, text: "Welcome to the community chat!", displayName: "Admin", photoURL: null, createdAt: { toDate: () => new Date() } },
                { id: 2, text: "Has anyone applied to Johns Hopkins? Wondering about their secondary application.", displayName: "Alex", photoURL: null, createdAt: { toDate: () => new Date() } }
            ]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'communityChat'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isGuest]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || isGuest || !user) return;

        const { uid, displayName, photoURL } = user;
        await addDoc(collection(db, 'communityChat'), {
            text: newMessage,
            createdAt: serverTimestamp(),
            uid,
            displayName,
            photoURL
        });

        setNewMessage('');
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Community Forum</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Ask questions, share advice, and connect with other students.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex flex-col h-[70vh]">
                {/* Chat Messages Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {messages.map(msg => (
                        <ChatMessage key={msg.id} message={msg} isCurrentUser={user?.uid === msg.uid} />
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Message Input Area */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    {isGuest ? (
                        <p className="text-center text-sm text-gray-500">Sign in to join the conversation.</p>
                    ) : (
                        <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 bg-gray-100 dark:bg-gray-700 border-transparent focus:border-blue-500 focus:ring-blue-500 rounded-full py-2 px-4"
                            />
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-colors disabled:opacity-50" disabled={!newMessage.trim()}>
                                Send
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
