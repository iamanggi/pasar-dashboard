import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MarketFormModal = ({
  open,
  onClose,
  initialData = null,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    id_api_pasar: "",
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
  const [currentPhoto, setCurrentPhoto] = useState(null); // State untuk foto yang sudah ada

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        id_api_pasar: initialData.id_api_pasar || "",
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
        foto: null, // file input selalu null untuk form baru
      });

      // Set foto yang sudah ada jika mode edit
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
      // Reset form untuk mode tambah
      setFormData({
        id_api_pasar: "",
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
      alert("Lokasi tidak ditemukan.");
    }
  };

  const handleFormSubmit = async () => {
  const authToken = localStorage.getItem("authToken");

  const submitFormData = new FormData();

  // Tambahkan data dari form ke FormData
  submitFormData.append("id_api_pasar", formData.id_api_pasar);
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

  // Tambahkan foto hanya jika ada
  if (formData.foto instanceof File) {
    submitFormData.append("foto", formData.foto);
  }

  // 🔁 Tambahkan spoof method untuk PUT
  if (initialData?.id) {
    submitFormData.append("_method", "PUT");
  }

  const url = initialData?.id
    ? `http://127.0.0.1:8000/api/pasar/${initialData.id}`
    : `http://127.0.0.1:8000/api/pasar`;

  try {
    const response = await fetch(url, {
      method: "POST", // Gunakan POST untuk semua
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json", // Penting!
      },
      body: submitFormData,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Gagal:", result);
      alert("Gagal menyimpan data");
    } else {
      alert("Berhasil disimpan");
      onClose(); // Tutup modal jika perlu
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Terjadi kesalahan saat mengirim data");
  }
};


  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" onClose={onClose} className="relative z-50">
        {/* Backdrop */}
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

        {/* Modal Container */}
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
              {/* Header */}
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

              {/* Form Content */}
              <div className="space-y-6 px-6 py-6">
                {/* Basic Information Section */}
                <div>
                  <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                    Informasi Dasar
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* ID API Pasar */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        ID API Pasar <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="id_api_pasar"
                        type="number"
                        value={formData.id_api_pasar}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Masukkan ID API"
                      />
                    </div>

                    {/* Nama Pasar */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nama Pasar <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="nama"
                        value={formData.nama}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Masukkan nama pasar"
                      />
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div>
                  <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                    Lokasi Pasar
                  </h3>

                  {/* Alamat Input */}
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

                  {/* Search and Map */}
                  {showSearch && (
                    <div className="space-y-4">
                      {/* Search Bar */}
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

                      {/* Map Container */}
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

                      {/* Coordinates */}
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
                    {/* Jumlah Pedagang */}
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

                    {/* Jumlah Kios */}
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

                    {/* Jumlah MCK */}
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

                    {/* Jumlah Bango */}
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

                    {/* Jumlah Kantor */}
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

                    {/* TPS */}
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

                  {/* Tampilkan foto yang sudah ada jika mode edit */}
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

              {/* Footer Buttons */}
              <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleFormSubmit(formData)}
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

export default MarketFormModal;
