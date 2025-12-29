"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, AlertCircle, CheckCircle, FileQuestion, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PageInfo {
  route: string;
  filePath: string;
  userType: "Buyer" | "Dealer" | "Public" | "Shared";
  notes?: string[];
  status?: "canonical" | "duplicate" | "legacy" | "unclear";
}

const pages: PageInfo[] = [
  // Public / Landing
  {
    route: "/",
    filePath: "src/app/page.tsx",
    userType: "Public",
    status: "canonical",
  },
  {
    route: "/browse",
    filePath: "src/app/browse/page.tsx",
    userType: "Public",
    status: "canonical",
  },

  // Auth / System
  {
    route: "/auth/buyer",
    filePath: "src/app/auth/buyer/page.tsx",
    userType: "Public",
    status: "canonical",
  },
  {
    route: "/auth/dealer",
    filePath: "src/app/auth/dealer/page.tsx",
    userType: "Public",
    status: "canonical",
  },
  {
    route: "/auth/dealer/apply",
    filePath: "src/app/auth/dealer/apply/page.tsx",
    userType: "Public",
    status: "canonical",
  },
  {
    route: "/auth/dealer/pending",
    filePath: "src/app/auth/dealer/pending/page.tsx",
    userType: "Public",
    status: "canonical",
  },

  // Buyer (canonical structure)
  {
    route: "/buyer",
    filePath: "src/app/buyer/page.tsx",
    userType: "Buyer",
    status: "canonical",
    notes: ["Buyer root route"],
  },
  {
    route: "/buyer/browse",
    filePath: "src/app/buyer/browse/page.tsx",
    userType: "Buyer",
    status: "canonical",
    notes: ["Canonical marketplace browse"],
  },
  {
    route: "/buyer/garage",
    filePath: "src/app/buyer/garage/page.tsx",
    userType: "Buyer",
    status: "canonical",
    notes: ["Saved vehicles and ownership"],
  },
  {
    route: "/buyer/messages",
    filePath: "src/app/buyer/messages/page.tsx",
    userType: "Buyer",
    status: "canonical",
    notes: ["Buyer messaging center"],
  },
  {
    route: "/buyer/profile",
    filePath: "src/app/buyer/profile/page.tsx",
    userType: "Buyer",
    status: "canonical",
    notes: ["Buyer profile management"],
  },
  {
    route: "/buyer/appointments",
    filePath: "src/app/buyer/appointments/page.tsx",
    userType: "Buyer",
    status: "canonical",
    notes: ["Canonical scheduling for buyers"],
  },

  // Dealer (canonical structure)
  {
    route: "/dealer",
    filePath: "src/app/dealer/page.tsx",
    userType: "Dealer",
    status: "canonical",
  },
  {
    route: "/dealer/appointments",
    filePath: "src/app/dealer/appointments/page.tsx",
    userType: "Dealer",
    status: "canonical",
  },
  {
    route: "/dealer/insights",
    filePath: "src/app/dealer/insights/page.tsx",
    userType: "Dealer",
    status: "canonical",
  },
  {
    route: "/dealer/listings",
    filePath: "src/app/dealer/listings/page.tsx",
    userType: "Dealer",
    status: "canonical",
  },
  {
    route: "/dealer/messages",
    filePath: "src/app/dealer/messages/page.tsx",
    userType: "Dealer",
    status: "canonical",
  },
  {
    route: "/dealer/reputation",
    filePath: "src/app/dealer/reputation/page.tsx",
    userType: "Dealer",
    status: "canonical",
  },
  {
    route: "/dealer/settings",
    filePath: "src/app/dealer/settings/page.tsx",
    userType: "Dealer",
    status: "canonical",
  },

  // Shared / Listings
  {
    route: "/listings/[id]",
    filePath: "src/app/listings/[id]/page.tsx",
    userType: "Shared",
    status: "canonical",
    notes: ["Dynamic route - use /listings/1 to test"],
  },
];

const statusConfig = {
  canonical: { label: "Canonical", color: "bg-green-500/10 text-green-700 border-green-500/20" },
  duplicate: { label: "Duplicate", color: "bg-orange-500/10 text-orange-700 border-orange-500/20" },
  legacy: { label: "Legacy", color: "bg-red-500/10 text-red-700 border-red-500/20" },
  unclear: { label: "Unclear", color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" },
};

const userTypeConfig = {
  Buyer: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  Dealer: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  Public: "bg-gray-500/10 text-gray-700 border-gray-500/20",
  Shared: "bg-teal-500/10 text-teal-700 border-teal-500/20",
};

export default function PageDirectoryPage() {
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());

  const handleToggle = (filePath: string) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  };

  const downloadCSV = () => {
    const csvContent = [
      "Route,File Path,User Type,Status,Notes",
      ...pages
        .filter((page) => selectedPages.has(page.filePath))
        .map((page) => {
          const notes = page.notes?.join("; ") || "";
          return `"${page.route}","${page.filePath}","${page.userType}","${page.status || "canonical"}","${notes}"`;
        }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pages-to-delete-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const groupedPages = {
    "Public / Landing": pages.filter((p) => p.route === "/" || p.route === "/browse"),
    "Auth / System": pages.filter((p) => p.route.startsWith("/auth")),
    "Buyer (inside route group)": pages.filter(
      (p) => p.userType === "Buyer" && p.notes?.includes("Inside (buyer) route group")
    ),
    "Buyer (outside route group)": pages.filter(
      (p) => p.userType === "Buyer" && !p.notes?.includes("Inside (buyer) route group")
    ),
    Dealer: pages.filter((p) => p.userType === "Dealer"),
    "Shared / Listings": pages.filter((p) => p.userType === "Shared"),
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-8 border-2 border-yellow-500/20 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              Temporary Page Directory
            </CardTitle>
            <CardDescription className="text-base">
              This is an internal development tool for reviewing all routable pages in the application.
              Click any link to inspect the page. Check boxes for pages to delete, then download CSV.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {selectedPages.size} page{selectedPages.size !== 1 ? "s" : ""} selected
          </p>
          <Button 
            onClick={downloadCSV} 
            disabled={selectedPages.size === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download CSV ({selectedPages.size})
          </Button>
        </div>

        {Object.entries(groupedPages).map(([groupName, groupPages]) => (
          <div key={groupName} className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">{groupName}</h2>
            <div className="space-y-3">
              {groupPages.map((page) => {
                const statusInfo = statusConfig[page.status || "canonical"];
                const testRoute = page.route.includes("[id]") ? page.route.replace("[id]", "1") : page.route;

                return (
                  <Card key={page.route} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedPages.has(page.filePath)}
                          onCheckedChange={() => handleToggle(page.filePath)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Link
                              href={testRoute}
                              target="_blank"
                              className="text-lg font-mono font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                            >
                              {page.route}
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={userTypeConfig[page.userType]}>
                              {page.userType}
                            </Badge>
                            <Badge variant="outline" className={statusInfo.color}>
                              {statusInfo.label}
                            </Badge>
                          </div>

                          <p className="text-sm text-gray-600 font-mono mb-2">{page.filePath}</p>

                          {page.notes && page.notes.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {page.notes.map((note, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border"
                                >
                                  {note}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {groupName !== "Shared / Listings" && <Separator className="mt-8" />}
          </div>
        ))}

        <Card className="mt-8 border-2 border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Total Pages
            </CardTitle>
            <CardDescription>
              {pages.length} routable pages discovered in src/app directory
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
