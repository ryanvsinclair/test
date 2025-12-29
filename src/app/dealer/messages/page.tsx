"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// Mock data removed - connect to real database
import { Lead } from "@/types/dealer";
import { ClientIntelligenceSidebar } from "@/components/dealer/ClientIntelligenceSidebar";
import { BulkMessageDialog } from "@/components/dealer/BulkMessageDialog";

import {
  Search,
  Send,
  WifiOff,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Car,
  Users,
  CheckCheck,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { safeDistanceToNow } from "@/lib/date-utils";

// Messaging infra
import { useMessagingStore } from "@/lib/messaging/store";
import { useWebSocket } from "@/lib/messaging/useWebSocket";
import { useMessagePolling } from "@/lib/messaging/useMessagePolling";
import { useNetworkStatus } from "@/lib/messaging/useNetworkStatus";

export default function MessagesPage() {
  const { user } = useAuth();
  // TODO: Replace with real database query
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showBulkMessageDialog, setShowBulkMessageDialog] = useState(false);
  
  // Role guard: Only dealers
  useEffect(() => {
    if (user && user.role !== 'dealer') {
      // Non-dealers should use /buyer/messages instead
      window.location.href = '/buyer/messages';
    }
  }, [user]);
  
  /**
   * ✅ SAFE: Presentation-only typing indicator
   * No WebSocket coupling, purely for demo visual
   */
  const [showTyping, setShowTyping] = useState(false);

  const { isOnline } = useNetworkStatus();
  const conversationId = selectedLead?.id ?? "";

  /**
   * 🔒 CRITICAL FIX:
   * Use a STABLE Zustand selector.
   * Do NOT return a new array every render.
   */
  const messages =
    useMessagingStore(
      (state) => state.messages.get(conversationId),
      Object.is,
    ) ?? [];

  /**
   * 🔒 Stable WebSocket handler (no render loops)
   */
  const handleMessageUpdate = useCallback((update: any) => {
    useMessagingStore.getState().handleMessageUpdate(update);
  }, []);

  /**
   * WebSocket (safe)
   */
  const { connectionState } = useWebSocket({
    conversationId,
    enabled: !!conversationId && isOnline,
    onMessage: handleMessageUpdate,
  });

  /**
   * Polling fallback (safe)
   */
  useMessagePolling({
    conversationId,
    enabled: !!conversationId && isOnline,
    wsConnected: connectionState.status === "connected",
  });

  /**
   * ✅ SAFE AUTO-SCROLL
   * Plain div, no Radix, no ref churn
   */
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  /**
   * Send message (optimistic)
   */
  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId) return;

    const content = messageText.trim();
    setMessageText("");
    
    /**
     * ✅ SAFE: Demo typing indicator toggle
     * Simulates buyer response (presentation only)
     */
    setShowTyping(true);
    setTimeout(() => setShowTyping(false), 2000);

    await useMessagingStore
      .getState()
      .sendMessageOptimistic(conversationId, content, "dealer-001", "dealer");
  };
  

  
  /**
   * ✅ SAFE: Static contextual data
   * Derived from selected lead, deterministic
   * Uses intentSignals array (guaranteed field on Lead type)
   */
  const conversationContext = selectedLead ? {
    intent: selectedLead.intentSignals?.includes("ready-this-week") ? "High Intent" : "Exploring",
    inquiryType: selectedLead.intentSignals?.includes("financing-needed") 
      ? "Financing" 
      : selectedLead.intentSignals?.includes("trade-in")
      ? "Trade-In"
      : "General"
  } : null;

  return (
    <div className="dealer-messages-layout flex h-screen">
      {/* LEFT SIDEBAR - Conversation List */}
      <div className="w-80 border-r border-neutral-200 dark:border-neutral-800 flex flex-col min-h-0 bg-card/50 backdrop-blur-sm">
        <div className="p-4 pb-3 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">Messages</h1>
            {!isOnline && <WifiOff className="w-4 h-4 text-red-500" />}
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-600" />
            <Input 
              className="pl-9 text-sm border-neutral-200 dark:border-neutral-800" 
              placeholder="Search conversations..." 
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkMessageDialog(true)}
            className="w-full text-xs h-8"
          >
            <Users className="w-3 h-3 mr-2" />
            Notify Interested Buyers
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* TODO: Replace with real database query */}
          {[].map((lead: Lead) => (
            <button
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={`w-full px-4 py-3 text-left border-b border-neutral-100 dark:border-neutral-800/50 transition-colors ${
                selectedLead?.id === lead.id
                  ? "bg-blue-50 dark:bg-blue-950/20 border-l-2 border-l-blue-600"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{lead.buyerName}</p>
                  {/* Buyer verification badges intentionally hidden until feature launch */}
                  {/* {lead.verified && (
                    <CheckCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  )} */}
                </div>
                {lead.unreadCount > 0 && (
                  <Badge className="bg-blue-600 text-white text-xs h-5 min-w-5 flex items-center justify-center">
                    {lead.unreadCount}
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-2">
                {lead.lastMessage}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500 dark:text-neutral-500">
                  {safeDistanceToNow(lead.lastMessageTime, { addSuffix: true })}
                </span>
                
                {lead.intentSignals && lead.intentSignals.length > 0 && (
                  <div className="flex gap-1">
                    {lead.intentSignals.includes('ready-this-week') && (
                      <Zap className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                    )}
                    {lead.intentSignals.includes('financing-needed') && (
                      <DollarSign className="w-3 h-3 text-green-600 dark:text-green-400" />
                    )}
                    {lead.intentSignals.includes('trade-in') && (
                      <Car className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                )}
              </div>
              
              {lead.linkedListing && (
                <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  Re: {lead.linkedListing.year} {lead.linkedListing.make} {lead.linkedListing.model}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CENTER PANEL - Chat */}
      <div className="flex-1 flex flex-col min-h-0 bg-card/30 backdrop-blur-sm">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-card/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-medium text-neutral-900 dark:text-neutral-50">{selectedLead?.buyerName}</h2>
              {connectionState.status === "reconnecting" && (
                <Badge variant="outline" className="text-xs">Reconnecting…</Badge>
              )}
            </div>
          </div>
          
          {/* Contextual Intelligence Chips */}
          {conversationContext && (
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 text-xs"
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                {conversationContext.intent}
              </Badge>
              <Badge 
                variant="outline" 
                className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 text-xs"
              >
                <DollarSign className="w-3 h-3 mr-1" />
                {conversationContext.inquiryType} Inquiry
              </Badge>
              {selectedLead?.linkedListing && (
                <Badge 
                  variant="outline" 
                  className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs"
                >
                  <Car className="w-3 h-3 mr-1" />
                  {selectedLead.linkedListing.year} {selectedLead.linkedListing.make}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* MESSAGES */}
        <div className="flex-1 min-h-0 px-6 py-6 overflow-y-auto bg-neutral-50 dark:bg-neutral-900/20">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender_type === "dealer" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="max-w-[65%]">
                  <div
                    className={`px-4 py-2.5 rounded-2xl ${
                      msg.sender_type === "dealer"
                        ? "bg-blue-600 text-white"
                        : "bg-card/90 dark:bg-card/90 backdrop-blur-sm text-neutral-900 dark:text-neutral-50 border border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    {msg.content}
                  </div>

                  <div className="flex items-center gap-1 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {msg.timestamp
                      ? safeDistanceToNow(msg.timestamp, {
                          addSuffix: true,
                        })
                      : "Sending…"}
                    {msg.delivery_status === "failed" && (
                      <AlertCircle className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {showTyping && (
              <div className="flex justify-start">
                <div className="max-w-[65%]">
                  <div className="px-4 py-3 rounded-2xl bg-card/90 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse"></span>
                      <span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {selectedLead?.buyerName} is typing…
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-card/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex gap-2 items-end">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message…"
              disabled={!conversationId}
              className="flex-1 border-neutral-200 dark:border-neutral-800"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || !conversationId}
              size="icon"
              className="h-10 w-10"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR - Client Intelligence */}
      {selectedLead && (
        <ClientIntelligenceSidebar 
          userId={selectedLead.buyerId} 
          conversationId={selectedLead.id} 
        />
      )}

      {/* Bulk Message Dialog */}
      {user && selectedLead?.linkedListing && (
        <BulkMessageDialog
          open={showBulkMessageDialog}
          onOpenChange={setShowBulkMessageDialog}
          dealerId={user.id}
          dealerName={user.name}
          context={{
            type: 'listing',
            listingId: selectedLead.linkedListing.id,
          }}
        />
      )}
    </div>
  );
}
