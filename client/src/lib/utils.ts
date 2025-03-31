import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const pastDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}d ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }
  
  return `${Math.floor(diffInMonths / 12)}y ago`;
}

export function calculateTaskProgress(task: any): number {
  if (task.is_completed) return 100;
  return task.progress || 0;
}

export function getXpColor(xpAmount: number): string {
  if (xpAmount >= 100) return 'bg-purple-500 bg-opacity-20 text-purple-400';
  if (xpAmount >= 50) return 'bg-pink-500 bg-opacity-20 text-pink-400';
  if (xpAmount >= 25) return 'bg-yellow-500 bg-opacity-20 text-yellow-400';
  return 'bg-green-500 bg-opacity-20 text-green-400';
}

export function getRankOrdinal(position: number): string {
  const j = position % 10,
        k = position % 100;
  if (j === 1 && k !== 11) {
    return position + "st";
  }
  if (j === 2 && k !== 12) {
    return position + "nd";
  }
  if (j === 3 && k !== 13) {
    return position + "rd";
  }
  return position + "th";
}
