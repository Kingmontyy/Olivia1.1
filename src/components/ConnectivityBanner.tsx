import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ConnectivityBannerProps {
  message: string;
  onRetry?: () => void;
}

export const ConnectivityBanner: React.FC<ConnectivityBannerProps> = ({ message, onRetry }) => {
  return (
    <div className="mb-6">
      <Alert>
        <AlertTitle>Connection issue</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{message}</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ConnectivityBanner;
