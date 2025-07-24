import { Fragment, useState, useEffect } from "react";
import { Trash2, Pencil, Plus, MapPin, Building2, Image } from "lucide-react";

import { Dialog, Transition } from "@headlessui/react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const BASE_URL = "http://127.0.0.1:8000";

// SweetAlert2 replacement component
const showAlert = {
  success: (title, text = "") => {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50";
    alertDiv.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-medium text-gray-900">${title}</h3>
            ${text ? `<p class="text-sm text-gray-500 mt-1">${text}</p>` : ""}
          </div>
        </div>
        <div class="flex justify-end">
          <button onclick="this.closest('.fixed').remove()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            OK
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
  },

  error: (title, text = "") => {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50";
    alertDiv.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-medium text-gray-900">${title}</h3>
            ${text ? `<p class="text-sm text-gray-500 mt-1">${text}</p>` : ""}
          </div>
        </div>
        <div class="flex justify-end">
          <button onclick="this.closest('.fixed').remove()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            OK
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(alertDiv);
  },

  confirm: (title, text = "") => {
    return new Promise((resolve) => {
      const alertDiv = document.createElement("div");
      alertDiv.className =
        "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50";
      alertDiv.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
          <div class="flex items-center mb-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-gray-900">${title}</h3>
              ${text ? `<p class="text-sm text-gray-500 mt-1">${text}</p>` : ""}
            </div>
          </div>
          <div class="flex justify-end space-x-3">
            <button onclick="this.closest('.fixed').remove(); window.confirmResult(false)" class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Batal
            </button>
            <button onclick="this.closest('.fixed').remove(); window.confirmResult(true)" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Hapus
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(alertDiv);

      window.confirmResult = (result) => {
        resolve(result);
        delete window.confirmResult;
      };
    });
  },
};

const MarketFormModal = ({
  open,
  onClose,  
  refreshData,
  initialData = null,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    nama: "",
    alamat: "",
    latitude: "",
    longitude: "",
    jumlah_pedagang: "",
    jumlah_kios: "",
    jumlah_mck: "",
    jumlah_bango: "",
    jumlah_kantor: "",
    tps: "",
    keterangan: "",
    foto: null,
  });

  const [position, setPosition] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPhoto, setCurrentPhoto] = useState(null);

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        nama: initialData.nama || "",
        alamat: initialData.alamat || "",
        latitude: initialData.latitude || "",
        longitude: initialData.longitude || "",
        jumlah_pedagang: initialData.jumlah_pedagang || "",
        jumlah_kios: initialData.jumlah_kios || "",
        jumlah_mck: initialData.jumlah_mck || "",
        jumlah_bango: initialData.jumlah_bango || "",
        jumlah_kantor: initialData.jumlah_kantor || "",
        tps: initialData.tps || "",
        keterangan: initialData.keterangan || "",
        foto: null,
      });

      if (isEdit && initialData.foto) {
        setCurrentPhoto(initialData.foto);
      }

      if (initialData.latitude && initialData.longitude) {
        setPosition([
          parseFloat(initialData.latitude),
          parseFloat(initialData.longitude),
        ]);
        setShowSearch(true);
      }
    } else if (open && !initialData) {
      setFormData({
        nama: "",
        alamat: "",
        latitude: "",
        longitude: "",
        jumlah_pedagang: "",
        jumlah_kios: "",
        jumlah_mck: "",
        jumlah_bango: "",
        jumlah_kantor: "",
        tps: "",
        keterangan: "",
        foto: null,
      });
      setCurrentPhoto(null);
      setPosition(null);
      setShowSearch(false);
      setSearchQuery("");
    }
  }, [open, initialData, isEdit]);

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    setPosition([lat, lng]);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
    );
    const data = await res.json();

    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      alamat: data.display_name || "",
    }));

    setShowSearch(true);
  };

  const MapClickHandler = () => {
    useMapEvents({ click: handleMapClick });
    return null;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "foto") {
      setFormData((prev) => ({ ...prev, foto: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSearch = async () => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`,
    );
    const data = await res.json();

    if (data.length > 0) {
      const { lat, lon, display_name } = data[0];
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      setPosition([latNum, lonNum]);

      setFormData((prev) => ({
        ...prev,
        latitude: latNum,
        longitude: lonNum,
        alamat: display_name,
      }));
    } else {
      showAlert.error(
        "Lokasi Tidak Ditemukan",
        "Silakan coba dengan kata kunci yang berbeda",
      );
    }
  };

  const handleFormSubmit = async () => {
    const authToken = localStorage.getItem("authToken");

    const submitFormData = new FormData();

    submitFormData.append("nama", formData.nama);
    submitFormData.append("alamat", formData.alamat);
    submitFormData.append("latitude", formData.latitude);
    submitFormData.append("longitude", formData.longitude);
    submitFormData.append("jumlah_pedagang", formData.jumlah_pedagang);
    submitFormData.append("jumlah_kios", formData.jumlah_kios);
    submitFormData.append("jumlah_mck", formData.jumlah_mck);
    submitFormData.append("jumlah_bango", formData.jumlah_bango);
    submitFormData.append("jumlah_kantor", formData.jumlah_kantor);
    submitFormData.append("tps", formData.tps);
    submitFormData.append("keterangan", formData.keterangan);

    if (formData.foto instanceof File) {
      submitFormData.append("foto", formData.foto);
    }

    if (initialData?.id) {
      submitFormData.append("_method", "PUT");
    }

    const url = initialData?.id
      ? `http://127.0.0.1:8000/api/pasar/${initialData.id}`
      : `http://127.0.0.1:8000/api/pasar`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
        body: submitFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Gagal:", result);
        console.log("Detail error:", result.errors);
        showAlert.error(
          "Gagal Menyimpan",
          "Terjadi kesalahan saat menyimpan data pasar",
        );
      } else {
        showAlert.success(
          `Data ${isEdit ? "Berhasil Diupdate" : "Berhasil Disimpan"}`,
          `Pasar ${formData.nama} telah ${isEdit ? "diperbarui" : "ditambahkan"} ke dalam sistem`,
        );
        onClose();
        if (refreshData) refreshData();
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert.error("Kesalahan Koneksi", "Tidak dapat terhubung ke server");
    }
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-gray-800">
              <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isEdit ? "Edit Data Pasar" : "Tambah Data Pasar"}
                </Dialog.Title>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {isEdit
                    ? "Ubah informasi data pasar yang sudah ada"
                    : "Isi informasi lengkap untuk menambahkan data pasar baru"}
                </p>
              </div>

              <div className="space-y-6 px-6 py-6">
                {/* Basic Information Section */}
                <div>
                  <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                    Informasi Dasar
                  </h3>
                  {/* Nama Pasar - Made Full Width */}
                  <div className="w-full">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nama Pasar <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="nama"
                      value={formData.nama}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="Masukkan nama lengkap pasar (contoh: Pasar Tradisional Bantul Kota)"
                    />
                  </div>
                </div>

                {/* Location Section */}
                <div>
                  <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                    Lokasi Pasar
                  </h3>

                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Alamat
                    </label>
                    <input
                      name="alamat"
                      value={formData.alamat}
                      readOnly
                      onClick={() => setShowSearch((prev) => !prev)}
                      placeholder="Klik untuk pilih lokasi di peta"
                      className="w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-700 hover:bg-gray-100 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                    />
                  </div>

                  {showSearch && (
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Cari lokasi (contoh: Pasar Bantul)"
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleSearch()
                          }
                        />
                        <button
                          onClick={handleSearch}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Cari
                        </button>
                      </div>

                      <div className="overflow-hidden rounded-lg border border-gray-300">
                        <MapContainer
                          center={position || [-7.8881, 110.3288]}
                          zoom={13}
                          style={{ height: "350px", width: "100%" }}
                          whenReady={(map) => {
                            setTimeout(() => {
                              map.target.invalidateSize();
                            }, 100);
                          }}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <MapClickHandler />
                          {position && <Marker position={position} />}
                        </MapContainer>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Latitude
                          </label>
                          <input
                            name="latitude"
                            value={formData.latitude}
                            readOnly
                            placeholder="Latitude"
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-700 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Longitude
                          </label>
                          <input
                            name="longitude"
                            value={formData.longitude}
                            readOnly
                            placeholder="Longitude"
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-700 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Market Details Section */}
                <div>
                  <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                    Detail Pasar
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Jumlah Pedagang
                      </label>
                      <input
                        name="jumlah_pedagang"
                        type="number"
                        value={formData.jumlah_pedagang}
                        onChange={handleChange}
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Jumlah Kios
                      </label>
                      <input
                        name="jumlah_kios"
                        type="number"
                        value={formData.jumlah_kios}
                        onChange={handleChange}
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Jumlah MCK
                      </label>
                      <input
                        name="jumlah_mck"
                        type="number"
                        value={formData.jumlah_mck}
                        onChange={handleChange}
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Jumlah Bango
                      </label>
                      <input
                        name="jumlah_bango"
                        type="number"
                        value={formData.jumlah_bango}
                        onChange={handleChange}
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Jumlah Kantor
                      </label>
                      <input
                        name="jumlah_kantor"
                        type="number"
                        value={formData.jumlah_kantor}
                        onChange={handleChange}
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        TPS
                      </label>
                      <input
                        name="tps"
                        type="text"
                        value={formData.tps}
                        onChange={handleChange}
                        placeholder="Tempat Pembuangan Sampah"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information Section */}
                <div>
                  <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                    Informasi Tambahan
                  </h3>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Keterangan
                    </label>
                    <textarea
                      name="keterangan"
                      value={formData.keterangan}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Masukkan keterangan tambahan..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Photo Upload Section */}
                <div>
                  <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                    Foto Pasar
                  </h3>

                  {isEdit && currentPhoto && (
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Foto Saat Ini
                      </label>
                      <div className="relative inline-block">
                        <img
                          src={`http://127.0.0.1:8000${currentPhoto}`}
                          alt="Foto Pasar"
                          className="h-32 w-32 rounded-lg border border-gray-300 object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isEdit
                        ? "Ganti Foto (Opsional)"
                        : "Upload Foto (Opsional)"}
                    </label>
                    <input
                      type="file"
                      name="foto"
                      accept="image/*"
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 text-sm text-gray-500 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:file:bg-gray-600 dark:file:text-gray-300"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Format: JPG, PNG, GIF. Maksimal 5MB.
                      {isEdit && " Kosongkan jika tidak ingin mengubah foto."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleFormSubmit}
                    className="rounded-lg border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    {isEdit ? "Update Data" : "Simpan Data"}
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

const PasarPage = () => {
  const [pasars, setPasars] = useState([]);
  const [selectedPasar, setSelectedPasar] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    loadPasars();
  }, []);

  const loadPasars = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/pasar`);
      const json = await res.json();

      if (Array.isArray(json)) {
        // Urutkan berdasarkan waktu terbaru
        json.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPasars(json);
      } else if (json.success && json.data) {
        // Urutkan berdasarkan waktu terbaru
        json.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPasars(json.data);
      } else {
        console.error("Format data tidak dikenali:", json);
      }
    } catch (err) {
      console.error("Gagal memuat data pasar:", err);
      showAlert.error(
        "Gagal Memuat Data",
        "Tidak dapat mengambil data pasar dari server",
      );
    }
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

      // Tutup form dan reset state
      setShowForm(false);
      setSelectedPasar(null);
      setIsEdit(false);

      showAlert.success(
        `Data ${isEdit ? "Berhasil Diupdate" : "Berhasil Disimpan"}`,
        `Pasar telah ${isEdit ? "diperbarui" : "ditambahkan"} ke dalam sistem`,
      );
      // Refresh data dari server
      await loadPasars(); 
    } catch (err) {
      console.error("Gagal submit data pasar:", err);
      showAlert.error(
        "Gagal Menyimpan",
        "Terjadi kesalahan saat menyimpan data pasar",
      );
    }
  };

  const handleDelete = async (id) => {
    const authToken = localStorage.getItem("authToken");
    const confirmDelete = await showAlert.confirm(
      "Hapus Data Pasar",
      "Apakah Anda yakin ingin menghapus data pasar ini? Tindakan ini tidak dapat dibatalkan.",
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`${BASE_URL}/api/pasar/${id}`, {
        method: "DELETE",
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
      });

      // Periksa status respons
      if (!response.ok) {
        const errorText = await response.text(); // Ambil teks respons untuk debugging
        console.error("Error:", errorText);
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      // Jika respons tidak memiliki konten, tidak perlu mengurai JSON
      if (response.status === 204) {
        // Hapus dari state lokal
        setPasars((prev) => prev.filter((p) => p.id !== id));
        showAlert.success(
          "Data Berhasil Dihapus",
          "Pasar telah dihapus dari sistem",
        );
      } else {
        // Jika ada respons JSON, Anda bisa mengurainya
        const result = await response.json();
        if (!result.success) {
          throw new Error(
            result.message || "Gagal menghapus data dari server.",
          );
        }
      }
    } catch (error) {
      console.error("Error deleting pasar:", error);
      showAlert.error(
        "Gagal Menghapus",
        "Terjadi kesalahan saat menghapus data pasar",
      );
    }
  };

  // Handler untuk membuka form tambah
  const handleAdd = () => {
    setSelectedPasar(null);
    setIsEdit(false);
    setShowForm(true);
    loadPasars(true);
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
                      <div className="max-w-xs">
                        <p className="truncate" title={pasar.nama}>
                          {pasar.nama}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      <div className="flex max-w-sm items-start">
                        <MapPin className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span className="truncate" title={pasar.alamat}>
                          {pasar.alamat}
                        </span>
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
        refreshData={loadPasars}
      />
    </div>
  );
};

export default PasarPage;
