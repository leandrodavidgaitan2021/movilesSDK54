// src/hooks/useLocation.ts
import { useContext } from "react";
import { LocationContext } from "../context/LocationContext";

export function useLocation() {
  const context = useContext(LocationContext);
  
  if (!context) {
    throw new Error("useLocation debe ser usado dentro de un LocationProvider");
  }
  
  return context;
}