import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTextColor(category: string) {
  switch (category.toLowerCase()) {
    case 'combat':
      return 'text-purple-300';
    case 'collection':
      return 'text-amber-300';
    case 'exploration':
      return 'text-emerald-300';
    default:
      return 'text-slate-300';
  }
}

export function getBgColor(category: string) {
  switch (category.toLowerCase()) {
    case 'combat':
      return 'bg-purple-900';
    case 'collection':
      return 'bg-amber-900';
    case 'exploration':
      return 'bg-emerald-900';
    default:
      return 'bg-slate-900';
  }
}

export const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Combat': return 'bg-red-500 text-red-500';
      case 'Collection': return 'bg-emerald-500 text-emerald-500';
      default: return 'bg-amber-500 text-amber-500';
    }
  };