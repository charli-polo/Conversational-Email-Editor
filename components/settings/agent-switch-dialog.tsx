'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AgentSwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newAgentLabel: string;
  onConfirm: () => void;
}

export function AgentSwitchDialog({
  open,
  onOpenChange,
  newAgentLabel,
  onConfirm,
}: AgentSwitchDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Switch agent?</AlertDialogTitle>
          <AlertDialogDescription>
            Switching to &ldquo;{newAgentLabel}&rdquo; will end the current
            conversation. The current conversation will be archived and a new
            empty thread will start with the new agent. Continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Switch agent
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
