"use client"
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Empty } from "./Empty";
import { Group_Sizze } from "./Group_Sizze";
import { Budget } from "./Budget";
import { DynamicDurationComponent } from "./Duration";
import TripDisplay from "./Tripdetail";

type Message = {
  role: "user" | "assistant";
  content: string;
  ui?: string;
};

const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [finalTripData, setFinalTripData] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const onSend = async (customInput?: string) => {
    const inputToUse = customInput || userInput;
    if (!inputToUse?.trim() || isLoading) return;

    setIsLoading(true);
    if(!customInput) setUserInput("");

    const newMsg: Message = { role: "user", content: inputToUse };
    const currentMessages = [...messages, newMsg];
    setMessages(currentMessages);

    const lastAssistantMsg = messages.filter(m => m.role === 'assistant').pop();
    const isFinalRequest = lastAssistantMsg?.ui === 'final';

    try {
      const requestPayload = {
        messages: currentMessages,
        isfinal: isFinalRequest,
      };

      const result = await axios.post("/api/aimodel", requestPayload);

      if (isFinalRequest) {
        setFinalTripData(result.data);
        setPreferences(extractUserPreferences(currentMessages));
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: result?.data?.resp || "Sorry, I didn’t understand that.",
            ui: result?.data?.ui,
          },
        ]);
      }
    } catch (error: any) {
      console.error("❌ Error in onSend:", error);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const generateFinalTrip = () => {
    onSend("Please generate the trip plan now.");
  };

  const renderGenerativeUI = (ui: string) => {
    switch (ui) {
      case "budget":
        return <Budget onSelected={(v: string) => onSend(v)} />;
      case "groupSize":
        return <Group_Sizze onSelected={(v: string) => onSend(v)} />;
      case "duration":
        return <DynamicDurationComponent onSelected={(v: string) => onSend(v)} />;
      case "final":
        return (
          <div className="mt-4">
            <Button onClick={generateFinalTrip} className="w-full" disabled={isLoading}>
              {isLoading ? "Generating Trip Plan..." : "✨ Generate My Trip Plan"}
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const extractUserPreferences = (messages: Message[]) => {
    const preferences: { [key: string]: string } = {};
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.role === "user") {
        const prevMsg = messages[i - 1];
        if (prevMsg && prevMsg.role === "assistant" && prevMsg.ui) {
          switch (prevMsg.ui) {
            case "location": preferences.startingLocation = msg.content; break;
            case "destination": preferences.destination = msg.content; break;
            case "groupSize": preferences.groupSize = msg.content; break;
            case "budget": preferences.budget = msg.content; break;
            case "duration": preferences.duration = msg.content; break;
            case "interests": preferences.interests = msg.content; break;
          }
        }
      }
    }
    return preferences;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(event.target.value);
  };
 
  // **👇 KEY CHANGE STARTS HERE **
  // We now have a single return statement.
  // The root div's class is conditional, providing the dynamic height.
  return (
    <div className={finalTripData ? "" : "h-[87vh] flex flex-col"}>
      {finalTripData ? (
        // If finalTripData exists, render the trip details. The container has no fixed height.
        <TripDisplay tripData={finalTripData} preferences={preferences} />
      ) : (
        // Otherwise, render the chat interface within the fixed-height container.
        <>
          {messages.length === 0 && (
            <Empty onSelectOption={(v: string) => onSend(v)} />
          )}

          <section className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg: Message, index) =>
              msg.role === "user" ? (
                <div className="flex justify-end" key={index}>
                  <div className="max-w-lg bg-primary text-white px-4 py-2 rounded-lg">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="flex justify-start" key={index}>
                  <div className="max-w-lg bg-gray-100 text-black px-4 py-2 rounded-lg">
                    {msg.content}
                    {renderGenerativeUI(msg.ui ?? "")}
                  </div>
                </div>
              )
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-lg bg-gray-100 text-black px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </section>

          <section>
            <div className="border rounded-2xl p-4 relative">
              <Textarea
                ref={textareaRef}
                className="w-full h-28 bg-transparent border-none resize-none focus-visible:ring-0"
                placeholder="Start planning your trip..."
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                value={userInput}
                disabled={isLoading}
              />
              <Button
                size={"icon"}
                aria-label="Send trip request"
                className="absolute bottom-6 right-6"
                onClick={() => onSend()}
                disabled={!userInput?.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
  // **👆 KEY CHANGE ENDS HERE **
};

export default ChatBot;