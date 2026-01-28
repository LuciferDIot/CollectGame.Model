'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Check, Maximize2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface JsonEditorDialogProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

export function JsonEditorDialog({ title, value, onChange, description }: JsonEditorDialogProps) {
  const [internalValue, setInternalValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value, isOpen]);

  const handleSave = () => {
    try {
      if (internalValue.trim()) {
        JSON.parse(internalValue);
      }
      onChange(internalValue);
      setIsOpen(false);
      setError(null);
    } catch (e) {
      setError('Invalid JSON format');
    }
  };

  const formatJson = () => {
    try {
        const parsed = JSON.parse(internalValue);
        setInternalValue(JSON.stringify(parsed, null, 2));
        setError(null);
    } catch (e) {
        setError('Cannot format: Invalid JSON');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8 ml-2 bg-slate-800 border-slate-700 hover:bg-slate-700">
          <Maximize2 className="h-4 w-4 text-slate-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-slate-100 flex items-center gap-2">
            {title}
            {error && <span className="text-xs text-red-400 font-normal bg-red-950/30 px-2 py-0.5 rounded border border-red-900/50">{error}</span>}
          </DialogTitle>
          {description && <DialogDescription className="text-slate-400">{description}</DialogDescription>}
        </DialogHeader>
        
        <div className="flex-1 relative min-h-0 border border-slate-800 rounded-md bg-slate-900/50">
            <textarea
                value={internalValue}
                onChange={(e) => {
                    setInternalValue(e.target.value);
                    setError(null);
                }}
                className="absolute inset-0 w-full h-full p-4 bg-transparent text-slate-300 font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 rounded-md"
                spellCheck={false}
                placeholder="Paste JSON here..."
            />
        </div>

        <div className="flex justify-between pt-4">
            <Button variant="ghost" size="sm" onClick={formatJson} className="text-slate-400 hover:text-slate-200">
                Format
            </Button>
            <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-slate-400">Cancel</Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white">
                    <Check className="mr-2 h-4 w-4" />
                    Apply
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
