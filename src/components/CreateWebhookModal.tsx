import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, XCircle, FlaskConical, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateWebhookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: string;
}

export function CreateWebhookModal({ open, onOpenChange, appId }: CreateWebhookModalProps) {
  const { apps, createWebhookEndpoint } = useApp();
  const app = apps.find((a) => a.id === appId);
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [product, setProduct] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "failed">("idle");

  if (!app) return null;

  const enabledProducts = app.products.filter((p) => p.status !== "disabled" && p.name.toLowerCase() !== "webhooks");

  const handleTest = async () => {
    if (!url) return;
    setIsTesting(true);
    setTestStatus("idle");
    try {
      const challenge = Math.random().toString(36).substring(2, 10);
      const verifyUrl = new URL(url);
      verifyUrl.searchParams.set("hub.mode", "subscribe");
      verifyUrl.searchParams.set("hub.verify_token", verificationToken || "");
      verifyUrl.searchParams.set("hub.challenge", challenge);
      const res = await fetch(verifyUrl.toString(), { mode: "cors" });
      const body = await res.text();
      setTestStatus(res.ok && body.trim() === challenge ? "success" : "failed");
    } catch (error) {
      setTestStatus("failed");
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("Webhook test error:", error);
      toast({ title: "Test failed", description: `Sandbox blocks external requests. Use "Copy Test URL" and test from your terminal. (${msg})`, variant: "destructive" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyTestUrl = () => {
    if (!url) return;
    const challenge = Math.random().toString(36).substring(2, 10);
    const verifyUrl = new URL(url);
    verifyUrl.searchParams.set("hub.mode", "subscribe");
    verifyUrl.searchParams.set("hub.verify_token", verificationToken || "");
    verifyUrl.searchParams.set("hub.challenge", challenge);
    const curl = `curl '${verifyUrl.toString()}'`;
    navigator.clipboard.writeText(curl);
    toast({ title: "Test URL copied", description: "Paste in your terminal to verify the endpoint" });
  };

  const handleCreate = () => {
    if (!name.trim() || !url.trim() || !product) return;
    createWebhookEndpoint(appId, {
      name: name.trim(),
      url: url.trim(),
      product,
      status: "active",
      retryCount: 5,
      retryInterval: 30,
      subscribedEvents: [],
      createdBy: app.email,
    });
    toast({ title: "Webhook created", description: `${name} has been created.` });
    handleClose();
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setName("");
      setUrl("");
      setProduct("");
      setVerificationToken("");
      setIsTesting(false);
      setTestStatus("idle");
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Webhook Endpoint</DialogTitle>
          <DialogDescription>Configure a new endpoint to receive event notifications</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Primary Webhook" />
          </div>
          <div className="space-y-2">
            <Label>Product Scope <span className="text-destructive">*</span></Label>
            <Select value={product} onValueChange={setProduct}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {enabledProducts.map((p) => (
                  <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Endpoint URL <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => { setUrl(e.target.value); setTestStatus("idle"); }}
                placeholder="https://api.example.com/webhooks"
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={!url || isTesting}
                className={
                  testStatus === "success" ? "border-success text-success" :
                  testStatus === "failed" ? "border-destructive text-destructive" : ""
                }
              >
                {isTesting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Testing</> :
                 testStatus === "success" ? <><CheckCircle2 className="h-4 w-4 mr-1" /> Verified</> :
                 testStatus === "failed" ? <><XCircle className="h-4 w-4 mr-1" /> Failed</> :
                 <><FlaskConical className="h-4 w-4 mr-1" /> Test</>}
              </Button>
              <Button variant="outline" onClick={handleCopyTestUrl} disabled={!url} title="Copy verification URL as cURL">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Verification Token</Label>
            <Input
              value={verificationToken}
              onChange={(e) => setVerificationToken(e.target.value)}
              placeholder="e.g. my-secret-token"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">Optional token sent with verification requests to validate ownership</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim() || !url.trim() || !product}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
