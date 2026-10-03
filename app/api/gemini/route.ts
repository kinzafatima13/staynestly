import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""; 

export async function POST(req: Request) {
  let message = "";
  try {
    const body = await req.json();
    message = body.message || "";

    if (!API_KEY) {
      throw new Error("Gemini API key is not configured");
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: [], 
      generationConfig: { maxOutputTokens: 200 },
    });

    const context = "You are StayNestly AI. Keep answers brief.";
    const result = await chat.sendMessage(context + "\nUser: " + message);
    const response = result.response.text();

    return NextResponse.json({ text: response });

  } catch (error: any) {
    console.error("--- GOOGLE API ERROR ---");
    console.error(error.message); // READ THIS IN YOUR TERMINAL
    console.error("------------------------");

    // Fallback Response so the site doesn't crash
    let fakeResponse = "I can currently help you navigate the Signature Stays section.";
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
        fakeResponse = "Hello! I am StayNestly AI. (I am in Demo Mode because the AI connection failed)";
    } else if (lowerMsg.includes("paris")) {
        fakeResponse = "Paris is great! We have listings starting at $220.";
    }

    return NextResponse.json({ text: fakeResponse });
  }
}