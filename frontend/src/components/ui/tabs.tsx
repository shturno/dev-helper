import * as React from "react";

export function Tabs({ defaultValue, className, children }: any) {
  // Simplesmente renderiza os filhos, sem lógica de tabs real
  return <div className={className}>{children}</div>;
}

export function TabsList({ children }: any) {
  return <div>{children}</div>;
}

export function TabsTrigger({ value, children }: any) {
  return <button>{children}</button>;
}

export function TabsContent({ value, className, children }: any) {
  return <div className={className}>{children}</div>;
}
