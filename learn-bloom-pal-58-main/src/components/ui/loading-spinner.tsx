import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8"
};

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
  );
}

export function LoadingOverlay({ children, isLoading }: { children: React.ReactNode; isLoading: boolean }) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-4 rounded-lg shadow-lg flex items-center space-x-3">
            <LoadingSpinner size="md" />
            <span className="text-sm font-medium">加载中...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function LoadingButton({ 
  children, 
  isLoading, 
  disabled, 
  className,
  ...props 
}: {
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}) {
  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "h-10 px-4 py-2",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
}

export function SkeletonLoader({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-muted rounded", className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <SkeletonLoader className="h-4 w-3/4" />
      <SkeletonLoader className="h-4 w-1/2" />
      <SkeletonLoader className="h-20 w-full" />
      <div className="flex space-x-2">
        <SkeletonLoader className="h-8 w-16" />
        <SkeletonLoader className="h-8 w-16" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonLoader key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}