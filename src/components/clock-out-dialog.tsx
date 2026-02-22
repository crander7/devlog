import { Clock, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ClockOutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClockOut: (description: string, tags: string[]) => Promise<void>;
    clockedInSince?: string;
}

export function ClockOutDialog({
    open,
    onOpenChange,
    onClockOut,
    clockedInSince,
}: ClockOutDialogProps) {
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const addTag = () => setTags((prev) => [...prev, '']);

    const updateTag = (index: number, value: string) =>
        setTags((prev) => prev.map((t, i) => (i === index ? value : t)));

    const removeTag = (index: number) =>
        setTags((prev) => prev.filter((_, i) => i !== index));

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await onClockOut(
                description,
                tags.filter((t) => t.trim()),
            );
            setDescription('');
            setTags([]);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Clock Out
                    </DialogTitle>
                    <DialogDescription>
                        {clockedInSince
                            ? `You've been clocked in since ${clockedInSince}.`
                            : 'Record what you were working on.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label
                            htmlFor="clockout-desc"
                            className="text-sm font-medium"
                        >
                            What were you working on?
                        </label>
                        <Textarea
                            id="clockout-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your work session..."
                            rows={3}
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label
                                htmlFor="clockout-tags"
                                className="text-sm font-medium"
                            >
                                Tags
                            </label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addTag}
                            >
                                Add Tag
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {tags.map((tag, index) => (
                                <div
                                    key={`clockout-tag-${index.toString()}`}
                                    className="flex gap-2"
                                >
                                    <Input
                                        value={tag}
                                        onChange={(e) =>
                                            updateTag(index, e.target.value)
                                        }
                                        placeholder="Enter tag"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeTag(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!description.trim() || submitting}
                    >
                        Clock Out
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
