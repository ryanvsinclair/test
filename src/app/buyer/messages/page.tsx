'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { messageService } from '@/lib/api/messages';
import { Conversation, Message } from '@/types';
import { MessageSquare, Send, Search, MoreVertical, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

/**
 * Buyer Messages Page
 * 
 * Handles:
 * - Buyer messaging dealers
 * - Buyer messaging other buyers
 * - Listing owners (buyer role) viewing their incoming messages
 */
export default function MessagesPage() {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDisengageDialog, setShowDisengageDialog] = useState(false);
  const [disengageReason, setDisengageReason] = useState<string>('');

  // Role guard: Only buyers (not dealers)
  useEffect(() => {
    if (user && user.role === 'dealer') {
      // Dealers should use /dealer/messages instead
      window.location.href = '/dealer/messages';
    }
  }, [user]);

  useEffect(() => {
    if (user?.id && user?.role !== 'dealer') {
      // Works for all buyers (including listing owners)
      console.log('[MESSAGES] Loading conversations for user:', user.id);
      const userConversations = messageService.getConversationsForBuyer(user.id);
      console.log('[MESSAGES] Loaded conversations:', userConversations.length, userConversations);
      setConversations(userConversations);
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      console.log('[MESSAGES] Loading messages for conversation:', selectedConversation.id);
      const conversationMessages = messageService.getMessages(selectedConversation.id);
      console.log('[MESSAGES] Loaded messages:', conversationMessages.length, conversationMessages);
      setMessages(conversationMessages);
      
      if (user?.id) {
        messageService.markAsRead(selectedConversation.id, user.id);
      }
    }
  }, [selectedConversation, user]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedConversation || !isAuthenticated || !user) return;

    messageService.sendMessage(
      selectedConversation.id,
      user.id,
      user.name,
      message.trim()
    );

    const updatedMessages = messageService.getMessages(selectedConversation.id);
    setMessages(updatedMessages);

    const updatedConversations = messageService.getConversationsForBuyer(user.id);
    setConversations(updatedConversations);

    setMessage('');
  };

  const handleDisengage = () => {
    if (!selectedConversation || !isAuthenticated || !user) return;

    // Close conversation with reason
    messageService.closeConversation(
      selectedConversation.id,
      user.id,
      disengageReason || null
    );

    // Update local state
    const updatedConversations = messageService.getConversationsForBuyer(user.id);
    setConversations(updatedConversations.filter(c => c.id !== selectedConversation.id));
    
    // Clear selection
    setSelectedConversation(null);
    setShowDisengageDialog(false);
    setDisengageReason('');
  };

  const handleOpenDisengage = () => {
    setDisengageReason('');
    setShowDisengageDialog(true);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.dealerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.vehicleTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const vehicle = selectedConversation
    ? null  // TODO: Connect to real database
    : null;

  if (conversations.length === 0) {
    return (
      <div className="buyer-messages-empty pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-light mb-2">No messages yet</h3>
          <p className="text-muted-foreground mb-6">
            Start a conversation by messaging a seller from any listing
          </p>
          <Link href="/browse">
            <Button>Browse Vehicles</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="buyer-messages-layout">
      {/* Conversations List */}
      <div className="w-80 border-r border-border bg-muted/20 flex flex-col h-full">
        <div className="p-6 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-semibold text-foreground mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-10 rounded-lg"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => {
            const convVehicle = null;  // TODO: Connect to real database

            return (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={cn(
                  'w-full p-4 border-b border-border hover:bg-muted/50 transition-colors text-left',
                  selectedConversation?.id === conversation.id && 'bg-muted/50 conversation-active'
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className={cn(
                    "w-10 h-10 transition-all",
                    selectedConversation?.id === conversation.id && "ring-2 ring-[hsl(var(--accent-soft))]"
                  )}>
                    <AvatarImage src={convVehicle?.images[0]} />
                    <AvatarFallback>
                      {convVehicle?.make.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm text-foreground truncate">
                        {conversation.dealerName}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-accent text-white">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-1">
                      {conversation.vehicleTitle}
                    </p>
                    {conversation.lastMessagePreview && (
                      <p className="text-xs text-muted-foreground truncate">
                        {conversation.lastMessagePreview}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Conversation */}
      <div className="flex-1 flex flex-col h-full">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-border bg-background flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={vehicle?.images[0]} />
                    <AvatarFallback>{vehicle?.make.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {selectedConversation.dealerName}
                    </h3>
                    <Link
                      href={`/listings/${selectedConversation.vehicleId}`}
                      className="text-sm text-muted-foreground hover:text-accent transition-colors"
                    >
                      {selectedConversation.vehicleTitle}
                    </Link>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={handleOpenDisengage}
                      className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Stop contact
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-neutral-50 dark:bg-neutral-900/20">
              {messages.map((msg) => {
                const isFromBuyer = msg.senderName === 'You';
                
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      isFromBuyer ? 'justify-start' : 'justify-end'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-md rounded-2xl px-4 py-3',
                        isFromBuyer
                          ? 'bg-muted rounded-bl-sm'
                          : 'bg-accent text-white rounded-br-sm'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={cn(
                        'text-xs mt-1',
                        isFromBuyer ? 'text-muted-foreground' : 'text-white/70'
                      )}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-border bg-background flex-shrink-0">
              <div className="flex gap-3">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl icy-focus transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  size="lg" 
                  className="rounded-xl icy-glow-hover"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-light mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Disengage Dialog */}
      <Dialog open={showDisengageDialog} onOpenChange={setShowDisengageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">
              Stop contact with this seller?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This will prevent them from messaging you again on Carly.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <RadioGroup value={disengageReason} onValueChange={setDisengageReason}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="found_another" id="found_another" />
                  <Label htmlFor="found_another" className="cursor-pointer font-normal">
                    Found another vehicle
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="not_interested" id="not_interested" />
                  <Label htmlFor="not_interested" className="cursor-pointer font-normal">
                    No longer interested
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="pricing" id="pricing" />
                  <Label htmlFor="pricing" className="cursor-pointer font-normal">
                    Pricing didn't work
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="too_much_followup" id="too_much_followup" />
                  <Label htmlFor="too_much_followup" className="cursor-pointer font-normal">
                    Too much follow-up
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="poor_experience" id="poor_experience" />
                  <Label htmlFor="poor_experience" className="cursor-pointer font-normal">
                    Poor experience
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="cursor-pointer font-normal">
                    Other
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter className="flex-row space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowDisengageDialog(false);
                setDisengageReason('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDisengage}
              className="flex-1"
            >
              Stop contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
