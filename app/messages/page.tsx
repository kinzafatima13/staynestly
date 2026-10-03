// app/messages/[id]/page.tsx (UPDATED for Email API Integration)

"use client";
import React, { useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation'; // 👈 IMPORTED: useSearchParams
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // 👈 IMPORTED: To get the sender's email

function MessageContent() {
    const { user } = useAuth(); // Get current user (the sender)
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams(); // 👈 Hook to read query parameters
    
    const conversationId = params.id as string; 
    const hostEmail = searchParams.get('hostEmail') || 'error@email.com'; // 👈 READ HOST EMAIL
    
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    const sendMessage = async () => {
        if (message.trim() === '' || !user?.email) {
            alert("Message is empty or sender email is not available (Are you logged in?).");
            return;
        }

        setStatus('sending');
        
        try {
            const response = await fetch('/api/contact-host', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hostEmail: hostEmail,
                    senderEmail: user.email, // Use the logged-in user's email
                    messageContent: message,
                    postRefId: conversationId,
                }),
            });

            if (response.ok) {
                setStatus('success');
                setMessage('');
                setTimeout(() => setStatus('idle'), 5000); // Reset status after 5s
            } else {
                // If the API returns an error status (4xx or 5xx)
                const errorData = await response.json();
                console.error("API Error:", errorData.error);
                setStatus('error');
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            setStatus('error');
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 py-10">
            {/* ... (rest of the component structure remains the same) ... */}
            <div className="max-w-4xl mx-auto px-4">
                
                <button 
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition mb-6"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to ShareStay Feed
                </button>

                <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-gray-100">
                    <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
                        Contact Partner for Post
                    </h1>
                    
                    <p className="text-sm text-gray-600 mb-8">
                        Your message will be sent directly to the host at: <span className="font-semibold text-blue-600">{hostEmail}</span>
                    </p>

                    <div className="h-96 bg-white p-4 rounded-xl border-2 border-gray-200 flex flex-col justify-end">
                        <div className="flex-grow text-center text-slate-500 flex items-center justify-center border-b border-gray-100 mb-4 pb-4">
                            Your message will be delivered via email. There is no real-time chat log here.
                        </div>
                        
                        {/* Status Messages */}
                        {status === 'success' && (
                            <div className="text-green-600 bg-green-100 p-3 rounded mb-2">
                                ✅ Message Sent Successfully! The host will reply to **{user?.email}**.
                            </div>
                        )}
                         {status === 'error' && (
                            <div className="text-red-600 bg-red-100 p-3 rounded mb-2">
                                ❌ Failed to send message. Please try again.
                            </div>
                        )}
                        
                        {/* Input Area */}
                        <div className="flex gap-2">
                            <textarea
                                placeholder={`Type your initial message to the host (${hostEmail}). Include your details!`}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                                className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                                disabled={status === 'sending'}
                            />
                            <button 
                                onClick={sendMessage} 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center h-full w-24 disabled:bg-gray-400"
                                disabled={status === 'sending'}
                            >
                                {status === 'sending' ? (
                                    <Loader2 className="w-5 h-5 animate-spin"/>
                                ) : (
                                    <Send className="w-5 h-5"/>
                                )}
                            </button>
                        </div>
                    </div>
                    
                </div>
            </div>
        </main>
    );
}

export default function MessagePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        }>
            <MessageContent />
        </Suspense>
    );
}