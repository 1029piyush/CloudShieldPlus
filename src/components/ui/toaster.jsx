import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      theme="dark"
      toastOptions={{
        style: {
          background: "#0A1F38",
          border: "1px solid rgba(125,232,255,0.18)",
          color: "white",
        },
      }}
    />
  );
}
