import QrReader from "../components/QrReader";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold text-center">QR Scanner</h1>
      <QrReader />
    </div>
  );
}