'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Vehicle } from '@/types';
import { Send, CheckCircle } from 'lucide-react';

interface MessagePopupProps {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  onSend: (message: string) => void;
}

export function MessagePopup({ open, onClose, vehicle, onSend }: MessagePopupProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    setSending(true);
    
    // Call the parent handler
    onSend(message.trim());
    
    setSending(false);
    setSent(true);

    // Close after showing confirmation
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  const handleClose = () => {
    setMessage('');
    setSending(false);
    setSent(false);
    onClose();
  };

  if (sent) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-2xl font-light mb-2">Message Sent</h3>
            <p className="text-muted-foreground">
              {vehicle.sellerName} will respond soon
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">Message Seller</DialogTitle>
        </DialogHeader>

        {/* Vehicle Context */}
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <img
            src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80'}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-16 h-16 object-cover rounded-lg"
          />
          <div className="flex-1">
            <p className="font-semibold">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
            <p className="text-sm text-muted-foreground">
              ${vehicle.price.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-accent">
              {vehicle.sellerName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium">{vehicle.sellerName}</p>
            <p className="text-xs text-muted-foreground">
              {vehicle.sellerType === 'dealer' ? 'Dealer' : 'Seller'}
            </p>
          </div>
        </div>

        {/* Message Input */}
        <div className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about availability, pricing, or schedule a viewing..."
            className="min-h-[120px] resize-none"
            disabled={sending}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSend();
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Press {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + Enter to send
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 rounded-lg"
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            className="flex-1 rounded-lg primary-glow"
            disabled={!message.trim() || sending}
          >
            {sending ? (
              'Sending...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
