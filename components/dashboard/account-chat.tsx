"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTeamContext } from "@/components/dashboard/team-context";
import type { ChatMessage, Intelligence } from "@/lib/types";

interface AccountChatProps {
  clientId: string;
  intelligence: Intelligence[];
}

export function AccountChat({ clientId, intelligence }: AccountChatProps) {
  const { getPrompt } = useTeamContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/clients/${clientId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, intelligence, systemPrompt: getPrompt("account_qa") }),
      });

      const json = await res.json();

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: json.data?.answer ?? json.error ?? "Sorry, something went wrong.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to reach the AI. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Ask AI about this account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Message list */}
        <div
          ref={scrollRef}
          className="h-80 overflow-y-auto space-y-3 rounded-md border p-3"
        >
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ask a question about this account — the AI will answer based on
              your intelligence data.
            </p>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. What are their biggest concerns?"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
