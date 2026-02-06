import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApp } from "@/contexts/AppContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Copy, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LogEvent } from "@/contexts/AppContext";

export default function Logs() {
  const { logEvents, products } = useApp();
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<LogEvent | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const eventTypes = Array.from(new Set(logEvents.map((e) => e.eventType)));

  const filteredEvents = logEvents.filter((event) => {
    if (selectedProduct !== "all" && event.product !== selectedProduct) {
      return false;
    }
    if (selectedEventType !== "all" && event.eventType !== selectedEventType) {
      return false;
    }
    return true;
  });

  const copyPayload = () => {
    if (selectedEvent) {
      navigator.clipboard.writeText(JSON.stringify(selectedEvent.payload, null, 2));
      setCopied(true);
      toast({ title: "Copied", description: "Payload copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Logs & Events"
        breadcrumbs={[{ label: "Logs & Events" }]}
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.name.split(" ")[0]}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Event Types</SelectItem>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(selectedProduct !== "all" || selectedEventType !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedProduct("all");
                  setSelectedEventType("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow
                  key={event.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedEvent(event)}
                >
                  <TableCell className="font-mono text-xs">
                    {new Date(event.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">{event.product}</TableCell>
                  <TableCell>
                    <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                      {event.eventType}
                    </code>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={event.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {event.message}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Event Detail Sheet */}
      <Sheet open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              Event Details
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedEvent(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetTitle>
            <SheetDescription>
              {selectedEvent && (
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {selectedEvent.eventType}
                </code>
              )}
            </SheetDescription>
          </SheetHeader>

          {selectedEvent && (
            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Timestamp</span>
                  <span className="font-mono">
                    {new Date(selectedEvent.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Product</span>
                  <span>{selectedEvent.product}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={selectedEvent.status} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Correlation ID</span>
                  <span className="font-mono text-xs">{selectedEvent.correlationId}</span>
                </div>
                {selectedEvent.externalRefId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">External Ref ID</span>
                    <span className="font-mono text-xs">{selectedEvent.externalRefId}</span>
                  </div>
                )}
                {selectedEvent.providerRef && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Provider Ref</span>
                    <span className="font-mono text-xs">{selectedEvent.providerRef}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Payload</span>
                  <Button variant="ghost" size="sm" onClick={copyPayload}>
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
