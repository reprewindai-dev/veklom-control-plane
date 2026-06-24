import TerminalApp from "@/components/terminal/App";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quantum Terminal - Veklom Control Plane",
};

export default function TerminalPage() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <TerminalApp />
    </div>
  );
}
