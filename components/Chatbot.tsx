// components/Chatbot.tsx

import React from 'react';
import { X, MessageSquare, Send } from 'lucide-react';

interface ChatbotProps {
    onClose: () => void;
}

export default function Chatbot({ onClose }: ChatbotProps) {
    // Note: Actual AI logic (API calls, message history) would go here.

    return (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-blue-200 flex flex-col h-[500px] overflow-hidden">
                
                {/* Header */}
                <div className="bg-blue-600 text-white p-4 flex justify-between items-center rounded-t-2xl">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <MessageSquare className="w-5 h-5"/> AI Stay Assistant
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-blue-700 transition">
                        <X className="w-5 h-5"/>
                    </button>
                </div>
                
                {/* Chat Body (Message History) */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    <div className="text-center text-sm text-gray-500 pt-2">
                        Hi! I'm your StayNestly AI Assistant. How can I help you find your perfect stay today?
                    </div>
                    {/* Placeholder for message bubbles */}
                </div>
                
                {/* Input Area */}
                <div className="border-t p-3 flex items-center bg-white">
                    <input 
                        type="text" 
                        placeholder="Ask a question..." 
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 mr-2"
                    />
                    <button className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition">
                        <Send className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
}