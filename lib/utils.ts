// Importuri pentru utilitare de manipulare a claselor CSS
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Functie utilitara pentru combinarea claselor CSS cu suport pentru Tailwind
// Foloseste clsx pentru combinarea conditionala si twMerge pentru rezolvarea conflictelor
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
