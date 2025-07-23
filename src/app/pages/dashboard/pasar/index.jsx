import Pasar from "./listPasar/marketTable";


export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard Admin</h1>
      <Pasar /> {/* Panggil langsung komponen Pasar */}
    </div>
  );
}
