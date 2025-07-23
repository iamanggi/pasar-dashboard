import { useState, useEffect } from "react";
import { Trash2, Pencil, Plus, MapPin, Building2, Image } from "lucide-react";
import MarketFormModal from "./marketForm";

const BASE_URL = "http://127.0.0.1:8000";

const PasarPage = () => {
  const [pasars, setPasars] = useState([]);
  const [selectedPasar, setSelectedPasar] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false); // Tambahkan state untuk mode edit

  useEffect(() => {
    loadPasars();
  }, []);

  const loadPasars = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/pasar`);
      const json = await res.json();

      // Jika response berupa array, langsung set
      if (Array.isArray(json)) {
        setPasars(json);
      } else if (json.success && json.data) {
        setPasars(json.data);
      } else {
        console.error("Format data tidak dikenali:", json);
      }
    } catch (err) {
      console.error("Gagal memuat data pasar:", err);
    }
  };

const handleDelete = async (id) => {
  const authToken = localStorage.getItem("authToken");
  const confirmDelete = confirm("Yakin ingin menghapus pasar ini?");
  if (!confirmDelete) return;

  const response = await fetch(`${BASE_URL}/api/pasar/${id}`, {
    method: "DELETE",
    headers: {
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Gagal menghapus data dari server.");
  }

  // Hapus dari state lokal
  setPasars((prev) => prev.filter((p) => p.id !== id));

  alert("✅ Pasar berhasil dihapus.");
};



  const handleSubmit = async (formData) => {
    const authToken = localStorage.getItem("authToken");
    
    try {
      const dataToSend = new FormData();

      // Append semua data form
      for (const key in formData) {
        const value = formData[key];
        if (value !== null && value !== undefined) {
          dataToSend.append(key, value);
        }
      }

      const url = isEdit 
        ? `${BASE_URL}/api/pasar/${selectedPasar.id}` 
        : `${BASE_URL}/api/pasar`;
      
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: dataToSend,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menyimpan");
      }

      // Refresh data dari server
      await loadPasars();

      // Tutup form dan reset state
      setShowForm(false);
      setSelectedPasar(null);
      setIsEdit(false);
      
      alert(`Pasar berhasil ${isEdit ? 'diupdate' : 'disimpan'}!`);
    } catch (err) {
      console.error("Gagal submit data pasar:", err);
      alert("Terjadi kesalahan saat menyimpan data pasar.");
    }
  };

  // Handler untuk membuka form tambah
  const handleAdd = () => {
    setSelectedPasar(null);
    setIsEdit(false);
    setShowForm(true);
  };

  // Handler untuk membuka form edit
  const handleEdit = (pasar) => {
    setSelectedPasar(pasar);
    setIsEdit(true);
    setShowForm(true);
  };

  // Handler untuk menutup form
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedPasar(null);
    setIsEdit(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-white">
                Manajemen Pasar
              </h1>
              <p className="text-lg text-gray-400">
                Kelola data pasar dengan mudah dan efisien
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="inline-flex transform items-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-500 hover:to-blue-600 hover:shadow-xl"
            >
              <Plus className="mr-2" size={20} />
              Tambah Pasar
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Total Pasar</p>
                <p className="text-3xl font-bold">{pasars.length}</p>
              </div>
              <Building2 className="h-12 w-12 text-blue-200" />
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-green-600 to-green-700 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Aktif</p>
                <p className="text-3xl font-bold">{pasars.length}</p>
              </div>
              <MapPin className="h-12 w-12 text-green-200" />
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Pengelola</p>
                <p className="text-3xl font-bold">
                  {new Set(pasars.map((p) => p.keterangan)).size}
                </p>
              </div>
              <Image className="h-12 w-12 text-purple-200" />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/50 shadow-2xl backdrop-blur-sm">
          <div className="border-b border-gray-700/50 p-6">
            <h2 className="text-xl font-semibold text-white">Daftar Pasar</h2>
            <p className="mt-1 text-sm text-gray-400">
              Kelola semua data pasar dalam sistem
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-300 uppercase">
                    No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-300 uppercase">
                    Foto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-300 uppercase">
                    Nama Pasar
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-300 uppercase">
                    Alamat
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-300 uppercase">
                    Pengelola
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-300 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {pasars.map((pasar, index) => (
                  <tr
                    key={pasar.id}
                    className="group transition-all duration-200 hover:bg-gray-700/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/20 text-sm font-semibold text-blue-400">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {pasar.foto ? (
                        <img
                          src={`${BASE_URL}${pasar.foto}`}
                          alt="Foto Pasar"
                          className="h-16 w-16 rounded-xl border-2 border-gray-600 object-cover shadow-lg"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-gray-600 bg-gradient-to-br from-gray-600 to-gray-700">
                          <Image className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">
                      {pasar.nama}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      <div className="flex items-start">
                        <MapPin className="mt-0.5 mr-2 h-4 w-4 text-gray-400" />
                        <span>{pasar.alamat}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center rounded-full border border-green-700/50 bg-green-900/30 px-3 py-1 text-xs font-medium text-green-400">
                        {pasar.keterangan}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          onClick={() => handleEdit(pasar)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-600/20 text-yellow-400 transition-all duration-200 group-hover:scale-110 hover:bg-yellow-600/30 hover:text-yellow-300"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(pasar.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/20 text-red-400 transition-all duration-200 group-hover:scale-110 hover:bg-red-600/30 hover:text-red-300"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pasars.length === 0 && (
            <div className="py-12 text-center">
              <Building2 className="mx-auto mb-4 h-16 w-16 text-gray-500" />
              <h3 className="mb-2 text-lg font-semibold text-gray-400">
                Belum ada data pasar
              </h3>
              <p className="mb-6 text-gray-500">
                Mulai dengan menambahkan pasar pertama Anda
              </p>
              <button
                onClick={handleAdd}
                className="inline-flex items-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-500"
              >
                <Plus className="mr-2" size={18} />
                Tambah Pasar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      <MarketFormModal
        open={showForm}
        onClose={handleCloseForm}
        initialData={selectedPasar}
        isEdit={isEdit}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default PasarPage;