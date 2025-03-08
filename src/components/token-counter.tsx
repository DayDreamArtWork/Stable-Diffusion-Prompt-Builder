"use client";

import { Progress } from "@/components/ui/progress";
import { TokenCount } from "@/lib/types";

interface TokenCounterProps {
  tokenCount: TokenCount;
}

export function TokenCounter({ tokenCount }: TokenCounterProps) {
  const percentage = (tokenCount.total / tokenCount.limit) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Tokens: {tokenCount.total}</span>
        <span className={tokenCount.isOverLimit ? "text-destructive" : "text-muted-foreground"}>
          Limit: {tokenCount.limit}
        </span>
      </div>
      <Progress
        value={percentage}
        className={tokenCount.isOverLimit ? "bg-destructive/20" : ""}
      />
    </div>
  );
}