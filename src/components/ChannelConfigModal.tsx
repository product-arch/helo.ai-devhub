import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/contexts/AppContext";

interface ChannelField {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
}

const channelFields: Record<string, ChannelField[]> = {
  sms: [
    { key: "senderId", label: "Sender ID", placeholder: "e.g. HELOAI", required: true },
    { key: "callbackUrl", label: "Callback URL", placeholder: "https://your-api.com/sms/callback", required: false },
  ],
  rcs: [
    { key: "agentId", label: "RCS Agent ID", placeholder: "e.g. agent-abc123", required: true },
    { key: "verificationToken", label: "Verification Token", placeholder: "Your verification token", required: true },
  ],
  whatsapp: [
    { key: "wabaId", label: "WABA ID", placeholder: "e.g. 123456789012345", required: true },
    { key: "wabaPhone", label: "WABA Phone Number", placeholder: "e.g. +1234567890", required: true },
    { key: "businessAccountId", label: "Business Account ID", placeholder: "e.g. 987654321098765", required: true },
  ],
  webhooks: [
    { key: "endpointUrl", label: "Endpoint URL", placeholder: "https://your-api.com/webhooks", required: true },
    { key: "authHeader", label: "Authorization Header", placeholder: "Bearer your-token", required: false },
  ],
};

interface ChannelConfigModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (productId: string) => void;
}

export function ChannelConfigModal({ product, open, onOpenChange, onSave }: ChannelConfigModalProps) {
  const fields = channelFields[product.id] || [];
  const [values, setValues] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const requiredFilled = fields.filter((f) => f.required).every((f) => values[f.key]?.trim());

  const handleSave = () => {
    onSave(product.id);
    toast({ title: "Configuration saved", description: `${product.name} has been configured successfully.` });
    setValues({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>{product.name}</DialogTitle>
            <StatusBadge status={product.status} />
          </div>
          <DialogDescription>Configure the required assets for {product.name}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>
                {field.label} {field.required && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id={field.key}
                placeholder={field.placeholder}
                value={values[field.key] || ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!requiredFilled}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
