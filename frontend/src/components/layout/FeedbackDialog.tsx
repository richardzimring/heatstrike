import { useState } from 'react';
import { MessageSquarePlus, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { postFeedback } from '@/lib/api/generated';

type Status = 'idle' | 'submitting' | 'success' | 'error';
type FeedbackType = 'bug' | 'feature_request';

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const resetForm = () => {
    setFeedbackType('bug');
    setDescription('');
    setEmail('');
    setStatus('idle');
    setErrorMessage('');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      // Reset after close animation completes
      setTimeout(resetForm, 200);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      const { error } = await postFeedback({
        body: {
          type: feedbackType,
          description: description.trim(),
          ...(email.trim() && { email: email.trim() }),
          userAgent: navigator.userAgent,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to submit feedback');
      }

      setStatus('success');
      setTimeout(() => {
        setOpen(false);
        setTimeout(resetForm, 200);
      }, 1500);
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to submit feedback',
      );
    }
  };

  const isBugReport = feedbackType === 'bug';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Send feedback">
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Report a bug or request a new feature.
          </DialogDescription>
        </DialogHeader>

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="text-sm font-medium">
              {isBugReport ? 'Bug report' : 'Feature request'} submitted!
            </p>
            <p className="text-xs text-muted-foreground">
              Thanks for helping us improve.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label>Type</Label>
              <div className="flex rounded-md border border-input bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setFeedbackType('bug')}
                  className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    feedbackType === 'bug'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  disabled={status === 'submitting'}
                >
                  Bug Report
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackType('feature_request')}
                  className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    feedbackType === 'feature_request'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  disabled={status === 'submitting'}
                >
                  Feature Request
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="feedback-description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="feedback-description"
                placeholder={
                  isBugReport
                    ? 'What happened? What did you expect to happen?'
                    : 'Describe the feature you would like to see.'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                maxLength={2000}
                className="min-h-[100px]"
                disabled={status === 'submitting'}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/2000
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="feedback-email">Email (optional)</Label>
              <Input
                id="feedback-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'submitting'}
              />
              <p className="text-xs text-muted-foreground">
                Provide your email if you'd like a follow-up.
              </p>
            </div>

            {status === 'error' && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}

            <DialogFooter>
              <Button
                type="submit"
                disabled={!description.trim() || status === 'submitting'}
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
