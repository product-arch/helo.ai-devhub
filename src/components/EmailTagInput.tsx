import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

interface EmailTagInputProps {
  emails: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
}

export function EmailTagInput({ emails, onChange, placeholder = "developer@example.com" }: EmailTagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const addEmail = () => {
    const trimmed = inputValue.trim();
    if (trimmed && isValidEmail(trimmed) && !emails.includes(trimmed)) {
      onChange([...emails, trimmed]);
      setInputValue("");
    }
  };

  const removeEmail = (email: string) => {
    onChange(emails.filter((e) => e !== email));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          type="email"
        />
        <Button type="button" variant="outline" size="icon" onClick={addEmail} disabled={!inputValue.trim() || !isValidEmail(inputValue.trim())}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {emails.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {emails.map((email) => (
            <span key={email} className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {email}
              <button type="button" onClick={() => removeEmail(email)} className="hover:text-foreground transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
