import { useState, useMemo } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, FileText, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: string;
  credentialName: string;
  credentialId: string;
  actor: string;
  ip?: string;
  failureReason?: string;
  grantType?: string;
  scopes?: string[];
}

interface AuditLogDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentialFilter?: string; // filter to specific credential ID
  credentialName?: string;
}

const eventTypeConfig: Record<string, { label: string; className: string }> = {
  "credential.created": { label: "Created", className: "bg-primary/10 text-primary border-primary/20" },
  "credential.rotated": { label: "Rotated", className: "bg-warning/10 text-warning border-warning/20" },
  "credential.suspended": { label: "Suspended", className: "bg-warning/10 text-warning border-warning/20" },
  "credential.reactivated": { label: "Reactivated", className: "bg-success/10 text-success border-success/20" },
  "credential.revoked": { label: "Revoked", className: "bg-destructive/10 text-destructive border-destructive/20" },
  "credential.deleted": { label: "Deleted", className: "bg-muted text-muted-foreground border-border" },
  "token.issued": { label: "Token Issued", className: "bg-success/10 text-success border-success/20" },
  "token.refreshed": { label: "Token Refreshed", className: "bg-success/10 text-success border-success/20" },
  "auth.failed": { label: "Auth Failed", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

// Generate mock audit entries
const generateMockAuditEntries = (): AuditEntry[] => {
  const entries: AuditEntry[] = [];
  const eventTypes = Object.keys(eventTypeConfig);
  const actors = ["admin@acme.com", "dev@acme.com", "system"];
  const credentials = [
    { name: "Primary API Key", id: "cred_abc123" },
    { name: "OAuth Integration", id: "cred_def456" },
    { name: "Legacy Batch Key", id: "cred_ghi789" },
  ];
  const ips = ["203.0.113.10", "198.51.100.22", "10.0.0.1"];

  for (let i = 0; i < 45; i++) {
    const cred = credentials[Math.floor(Math.random() * credentials.length)];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    entries.push({
      id: `audit_${i}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 90).toISOString(),
      eventType,
      credentialName: cred.name,
      credentialId: cred.id,
      actor: actors[Math.floor(Math.random() * actors.length)],
      ip: ips[Math.floor(Math.random() * ips.length)],
      failureReason: eventType === "auth.failed" ? "Invalid API key" : undefined,
    });
  }
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const MOCK_ENTRIES = generateMockAuditEntries();
const PAGE_SIZE = 20;

export function AuditLogDrawer({ open, onOpenChange, credentialFilter, credentialName }: AuditLogDrawerProps) {
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return MOCK_ENTRIES.filter((e) => {
      if (credentialFilter && e.credentialId !== credentialFilter) return false;
      if (eventTypeFilter !== "all" && e.eventType !== eventTypeFilter) return false;
      if (searchQuery && !e.credentialName.toLowerCase().includes(searchQuery.toLowerCase()) && !e.actor.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [credentialFilter, eventTypeFilter, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageEntries = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleExport = (format: "csv" | "json") => {
    toast({ title: `Exported as ${format.toUpperCase()}`, description: `${filtered.length} entries exported.` });
  };

  const formatRelativeTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {credentialFilter ? `Audit Log — ${credentialName}` : "Audit Log"}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Audit logs are read-only and retained for 12 months. Entries cannot be modified or deleted.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 pb-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Search by credential or actor..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              className="sm:max-w-xs"
            />
            <select
              value={eventTypeFilter}
              onChange={(e) => { setEventTypeFilter(e.target.value); setPage(0); }}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All Events</option>
              {Object.entries(eventTypeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <div className="flex gap-1.5 ml-auto">
              <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("json")}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> JSON
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Event</TableHead>
                  <TableHead className="text-xs">Credential</TableHead>
                  <TableHead className="text-xs">Actor</TableHead>
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageEntries.map((entry) => {
                  const config = eventTypeConfig[entry.eventType] || { label: entry.eventType, className: "bg-muted text-muted-foreground border-border" };
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px]", config.className)}>
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs">{entry.credentialName}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{entry.credentialId}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{entry.actor}</TableCell>
                      <TableCell>
                        <span className="text-xs" title={new Date(entry.timestamp).toLocaleString()}>
                          {formatRelativeTime(entry.timestamp)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{entry.ip || "—"}</TableCell>
                    </TableRow>
                  );
                })}
                {pageEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                      No audit entries found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-2">Page {page + 1} of {totalPages}</span>
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
