"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  Users,
  UserX,
  Send,
  Loader2,
} from 'lucide-react';
import { BulkMessageContext, BulkMessagePreview } from '@/types/bulk-messaging';
import { bulkMessageService } from '@/lib/api/bulk-messaging';

interface BulkMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealerId: string;
  dealerName: string;
  context: BulkMessageContext;
}

export function BulkMessageDialog({
  open,
  onOpenChange,
  dealerId,
  dealerName,
  context,
}: BulkMessageDialogProps) {
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<BulkMessagePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<'compose' | 'preview'>('compose');

  const handlePreview = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      const previewData = await bulkMessageService.previewBulkMessage(
        dealerId,
        context,
        message
      );
      setPreview(previewData);
      setStep('preview');
    } catch (error) {
      console.error('Failed to preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !preview) return;

    setSending(true);
    try {
      await bulkMessageService.sendBulkMessage(
        dealerId,
        dealerName,
        context,
        message
      );
      
      // Success - close dialog
      setMessage('');
      setPreview(null);
      setStep('compose');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to send:', error);
      alert(error.message || 'Failed to send bulk message');
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    setStep('compose');
  };

  const handleClose = () => {
    setMessage('');
    setPreview(null);
    setStep('compose');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        {step === 'compose' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-medium">
                Notify Interested Buyers
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Send a message to all buyers with active conversations about this {context.type}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Context Info */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1 text-xs text-blue-900 dark:text-blue-100">
                    <p className="font-medium mb-1">Only buyers with existing conversations will receive this message.</p>
                    <p className="text-blue-700 dark:text-blue-300">Buyers who have stopped contact or muted this conversation are automatically excluded.</p>
                  </div>
                </div>
              </div>

              {/* Message Composer */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  Message
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message... Use {{firstName}} or {{name}} to personalize."
                  className="min-h-32 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Available tokens: <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">{'{{firstName}}'}</code>, <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">{'{{name}}'}</code>
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handlePreview}
                disabled={!message.trim() || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Preview Recipients'
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'preview' && preview && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-medium">
                Review and Send
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Confirm recipient count and message content before sending.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Recipient Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-900 dark:text-green-100">Eligible</span>
                  </div>
                  <p className="text-2xl font-medium text-green-900 dark:text-green-100">
                    {preview.eligibleCount}
                  </p>
                </div>

                <div className="p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <UserX className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    <span className="text-xs font-medium text-neutral-900 dark:text-neutral-50">Excluded</span>
                  </div>
                  <p className="text-2xl font-medium text-neutral-900 dark:text-neutral-50">
                    {preview.excludedCount}
                  </p>
                </div>
              </div>

              {/* Message Preview */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  Message Preview
                </label>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                  <p className="text-sm text-neutral-900 dark:text-neutral-50 whitespace-pre-wrap">
                    {preview.message}
                  </p>
                </div>
                {preview.personalizationTokens.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Using personalization: {preview.personalizationTokens.map(t => `{{${t}}}`).join(', ')}
                  </p>
                )}
              </div>

              {/* Excluded Recipients Details */}
              {preview.excludedCount > 0 && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                  <p className="text-xs font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                    Why were {preview.excludedCount} buyer(s) excluded?
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {preview.recipients.filter(r => !r.eligible).slice(0, 3).map((r, i) => (
                      <li key={i}>
                        • {r.userName}: {r.exclusionReason?.replace('_', ' ')}
                      </li>
                    ))}
                    {preview.excludedCount > 3 && (
                      <li className="text-neutral-500 dark:text-neutral-400">
                        + {preview.excludedCount - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {preview.eligibleCount === 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1 text-xs text-red-900 dark:text-red-100">
                      <p className="font-medium">No eligible recipients</p>
                      <p className="text-red-700 dark:text-red-300 mt-1">All buyers have either stopped contact, muted this conversation, or are outside the selected context.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-row space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={sending}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSend}
                disabled={preview.eligibleCount === 0 || sending}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to {preview.eligibleCount} buyer{preview.eligibleCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
