"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Send } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

type UserPreferences = {
  [key: string]: string;
};

type PlannerMode = "default" | "inspire" | "hidden-gems" | "smart";

const INITIAL_ASSISTANT_MESSAGE: Record<PlannerMode, Message> = {
  default: {
    role: "assistant",
    content: "Hi! Where are you travelling from?",
    ui: "location",
  },
  inspire: {
    role: "assistant",
    content: "Let's find a destination you'll love. Where are you travelling from?",
    ui: "location",
  },
  "hidden-gems": {
    role: "assistant",
    content: "Amazing choice. Where are you travelling from?",
    ui: "location",
  },
  smart: {
    role: "assistant",
    content:
      "Tell me your trip idea in your own words, and I'll extract the details for you.",
    ui: "location",
  },
};

const ChatBot = () => {
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") || "default") as PlannerMode;
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [finalTripData, setFinalTripData] = useState<any>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [collectedPreferences, setCollectedPreferences] = useState<UserPreferences>(
    {}
  );
  const [saveStatus, setSaveStatus] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoPromptSentRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
    setMessages([
      INITIAL_ASSISTANT_MESSAGE[mode] || INITIAL_ASSISTANT_MESSAGE.default,
    ]);
    setFinalTripData(null);
    setPreferences(null);
    setCollectedPreferences({});
    setSaveStatus("");
    setUserInput("");
    autoPromptSentRef.current = null;
  }, [mode]);

  useEffect(() => {
    const prompt = searchParams.get("prompt");

    if (prompt?.trim()) {
      setUserInput(prompt);
      textareaRef.current?.focus();
    }
  }, [searchParams]);

  const onSend = async (customInput?: string) => {
    const inputToUse = customInput || userInput;
    if (!inputToUse?.trim() || isLoading) return;

    setIsLoading(true);
    if (!customInput) setUserInput("");

    const newMsg: Message = { role: "user", content: inputToUse };
    const currentMessages = [...messages, newMsg];
    setMessages(currentMessages);

    const lastAssistantMsg = messages.filter((m) => m.role === "assistant").pop();
    const isFinalRequest = lastAssistantMsg?.ui === "final";

    try {
      const requestPayload = {
        messages: currentMessages,
        isfinal: isFinalRequest,
        mode,
        extractedPreferences: collectedPreferences,
      };

      const result = await axios.post("/api/aimodel", requestPayload);

      if (isFinalRequest) {
        if (
          result?.data?.trip_plan &&
          Array.isArray(result?.data?.itinerary) &&
          result.data.itinerary.length > 0
        ) {
          const extractedPreferences =
            mode === "smart"
              ? {
                  ...collectedPreferences,
                }
              : extractUserPreferences(currentMessages);
          setPreferences(extractedPreferences);
          setFinalTripData(result.data);
          setSaveStatus("Saving your trip...");

          try {
            await axios.post("/api/trips", {
              tripData: result.data,
              preferences: extractedPreferences,
            });
            setSaveStatus("Trip saved successfully. You can view it later in My Trips.");
          } catch (saveError: unknown) {
            console.error("Error saving trip:", saveError);
            setSaveStatus("Trip was generated, but saving it failed.");
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "I couldn't generate the trip itinerary. Please try again.",
              ui: "final",
            },
          ]);
        }
      } else {
        if (result?.data?.extracted && typeof result.data.extracted === "object") {
          const normalizedExtracted = Object.fromEntries(
            Object.entries(result.data.extracted).filter(([, value]) =>
              Boolean(String(value || "").trim())
            )
          ) as UserPreferences;

          setCollectedPreferences((prev) => ({
            ...prev,
            ...normalizedExtracted,
          }));
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result?.data?.resp || "Sorry, I did not understand that.",
            ui: result?.data?.ui,
          },
        ]);

        if (mode === "smart" && result?.data?.readyForFinal) {
          const finalResult = await axios.post("/api/aimodel", {
            messages: currentMessages,
            isfinal: true,
            mode,
            extractedPreferences: {
              ...collectedPreferences,
              ...result.data.extracted,
            },
          });

          if (
            finalResult?.data?.trip_plan &&
            Array.isArray(finalResult?.data?.itinerary) &&
            finalResult.data.itinerary.length > 0
          ) {
            const smartPreferences = {
              ...collectedPreferences,
              ...result.data.extracted,
            };

            setPreferences(smartPreferences);
            setCollectedPreferences(smartPreferences);
            setFinalTripData(finalResult.data);
            setSaveStatus("Saving your trip...");

            try {
              await axios.post("/api/trips", {
                tripData: finalResult.data,
                preferences: smartPreferences,
              });
              setSaveStatus("Trip saved successfully. You can view it later in My Trips.");
            } catch (saveError: unknown) {
              console.error("Error saving trip:", saveError);
              setSaveStatus("Trip was generated, but saving it failed.");
            }
          }
        }
      }
    } catch (error: unknown) {
      console.error("Error in onSend:", error);

      const errorMessage = axios.isAxiosError(error)
        ? error?.response?.data?.error ||
          error?.response?.data?.resp ||
          error?.message ||
          "Sorry, I encountered an error. Please try again."
        : "Sorry, I encountered an error. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMessage,
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
              {isLoading ? "Generating Trip Plan..." : "Generate My Trip Plan"}
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const extractUserPreferences = (items: Message[]) => {
    const extracted: UserPreferences = {};

    for (let i = 0; i < items.length; i++) {
      const msg = items[i];

      if (msg.role === "user") {
        const prevMsg = items[i - 1];
        if (prevMsg && prevMsg.role === "assistant" && prevMsg.ui) {
          switch (prevMsg.ui) {
            case "location":
              extracted.startingLocation = msg.content;
              break;
            case "destination":
              extracted.destination = msg.content;
              break;
            case "groupSize":
              extracted.groupSize = msg.content;
              break;
            case "budget":
              extracted.budget = msg.content;
              break;
            case "duration":
              extracted.duration = msg.content;
              break;
            case "interests":
              extracted.interests = msg.content;
              break;
          }
        }
      }
    }

    return extracted;
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

  useEffect(() => {
    const prompt = searchParams.get("prompt")?.trim();

    if (!prompt || isLoading || finalTripData) {
      return;
    }

    if (!messages.length || messages[0]?.role !== "assistant") {
      return;
    }

    if (autoPromptSentRef.current === prompt) {
      return;
    }

    autoPromptSentRef.current = prompt;
    onSend(prompt);
  }, [searchParams, messages, isLoading, finalTripData]);

  return (
    <div className={finalTripData ? "" : "h-[87vh] flex flex-col"}>
      {finalTripData ? (
        <div className="space-y-3">
          {saveStatus ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              {saveStatus}
            </div>
          ) : null}
          <TripDisplay tripData={finalTripData} preferences={preferences} />
        </div>
      ) : (
        <>
          {messages.length === 0 && <Empty onSelectOption={(v: string) => onSend(v)} />}

          <section className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg: Message, index) =>
              msg.role === "user" ? (
                <div className="flex justify-end" key={index}>
                  <div className="max-w-lg bg-primary text-white px-4 py-2 rounded-lg">{msg.content}</div>
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
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
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
};

export default ChatBot;
