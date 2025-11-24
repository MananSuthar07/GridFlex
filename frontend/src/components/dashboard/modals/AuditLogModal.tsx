import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

interface Decision {
  timestamp: string;
  agent: string;
  decision: string;
  reasoning?: string;
  outcome?: string;
  impact?: {
    cost_saved?: number;
    carbon_reduced?: number;
  };
}

interface AuditLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisions: Decision[];
}

type SortField = "timestamp" | "agent" | "outcome" | "impact";
type SortDirection = "asc" | "desc";

export const AuditLogModal = ({ open, onOpenChange, decisions }: AuditLogModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  const getAgentIcon = (agent: string) => {
    if (agent.toLowerCase().includes("orchestrator")) return "⚙️";
    if (agent.toLowerCase().includes("workload")) return "🧠";
    if (agent.toLowerCase().includes("grid")) return "📊";
    return "🤖";
  };

  const getAgentColor = (agent: string) => {
    if (agent.toLowerCase().includes("orchestrator")) return "text-orange-600";
    if (agent.toLowerCase().includes("workload")) return "text-blue-600";
    if (agent.toLowerCase().includes("grid")) return "text-green-600";
    return "text-gray-600";
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return timestamp;
      }
      return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return timestamp;
    }
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = decisions.filter((decision) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        decision.agent.toLowerCase().includes(searchLower) ||
        decision.decision.toLowerCase().includes(searchLower) ||
        (decision.reasoning?.toLowerCase().includes(searchLower) ?? false) ||
        (decision.outcome?.toLowerCase().includes(searchLower) ?? false)
      );
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortField) {
        case "timestamp":
          aVal = new Date(a.timestamp).getTime();
          bVal = new Date(b.timestamp).getTime();
          break;
        case "agent":
          aVal = a.agent;
          bVal = b.agent;
          break;
        case "outcome":
          aVal = a.outcome || "";
          bVal = b.outcome || "";
          break;
        case "impact":
          aVal = (a.impact?.cost_saved || 0) + (a.impact?.carbon_reduced || 0);
          bVal = (b.impact?.cost_saved || 0) + (b.impact?.carbon_reduced || 0);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [decisions, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const exportToCSV = () => {
    const headers = ["Timestamp", "Agent", "Decision", "Reasoning", "Outcome", "Cost Saved (£)", "Carbon Reduced (kg)"];
    const csvData = filteredAndSortedData.map((decision) => [
      decision.timestamp,
      decision.agent,
      `"${decision.decision.replace(/"/g, '""')}"`,
      `"${(decision.reasoning || "N/A").replace(/"/g, '""')}"`,
      decision.outcome || "N/A",
      decision.impact?.cost_saved || 0,
      decision.impact?.carbon_reduced || 0,
    ]);

    const csv = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const today = new Date().toISOString().split("T")[0];
    a.download = `gridflex-audit-log-${today}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-40" />;
    return sortDirection === "asc" ? "↑" : "↓";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[85vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            Complete Audit Log - All System Decisions
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 border-b space-y-4">
          {decisions.length > 100 && (
            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              Showing last 100 decisions
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search decisions..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export as CSV
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6">
          <div className="min-w-full">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-gray-800 text-white z-10">
                <tr>
                  <th 
                    className="text-left p-3 text-sm font-semibold w-[10%] cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort("timestamp")}
                  >
                    Timestamp {getSortIcon("timestamp")}
                  </th>
                  <th 
                    className="text-left p-3 text-sm font-semibold w-[15%] cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort("agent")}
                  >
                    Agent {getSortIcon("agent")}
                  </th>
                  <th className="text-left p-3 text-sm font-semibold w-[25%]">
                    Decision
                  </th>
                  <th className="text-left p-3 text-sm font-semibold w-[25%]">
                    Reasoning
                  </th>
                  <th 
                    className="text-left p-3 text-sm font-semibold w-[10%] cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort("outcome")}
                  >
                    Outcome {getSortIcon("outcome")}
                  </th>
                  <th 
                    className="text-left p-3 text-sm font-semibold w-[15%] cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort("impact")}
                  >
                    Impact {getSortIcon("impact")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((decision, index) => (
                  <tr
                    key={index}
                    className={`border-b border-gray-200 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50 dark:bg-gray-900/20"
                    }`}
                  >
                    <td className="p-3 text-sm font-mono">
                      {formatTimestamp(decision.timestamp)}
                    </td>
                    <td className="p-3 text-sm">
                      <span className={`flex items-center gap-2 ${getAgentColor(decision.agent)}`}>
                        <span className="text-base">{getAgentIcon(decision.agent)}</span>
                        <span className="font-medium">{decision.agent}</span>
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      {decision.decision}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {decision.reasoning || "N/A"}
                    </td>
                    <td className="p-3 text-sm">
                      {decision.outcome ? (
                        <Badge
                          variant={decision.outcome.toLowerCase() === "success" ? "default" : "destructive"}
                          className={
                            decision.outcome.toLowerCase() === "success"
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-red-500 hover:bg-red-600"
                          }
                        >
                          {decision.outcome}
                        </Badge>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="p-3 text-sm">
                      {decision.impact ? (
                        <div className="space-y-1">
                          {decision.impact.cost_saved !== undefined && (
                            <div className="text-green-600 font-medium">
                              £{decision.impact.cost_saved.toFixed(2)}
                            </div>
                          )}
                          {decision.impact.carbon_reduced !== undefined && (
                            <div className="text-green-600 text-xs">
                              {decision.impact.carbon_reduced.toFixed(1)} kg CO₂
                            </div>
                          )}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedData.length)} of {filteredAndSortedData.length} decisions
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              );
            })}
            
            {totalPages > 5 && <span className="text-sm text-muted-foreground">...</span>}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
