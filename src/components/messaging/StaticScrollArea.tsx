"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export const StaticScrollArea = React.memo(function StaticScrollArea({
  children,
  className,
}: Props) {
  return (
    <ScrollArea className={className}>
      {children}
    </ScrollArea>
  );
});
