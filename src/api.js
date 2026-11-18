// Semua pemanggilan ke API backend ada di sini
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path = "", options = {}) {
  const res = await fetch(`${BASE_URL}/siswa${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Permintaan gagal");
  return data;
}

export const getSiswa = () => request();

export const createSiswa = (siswa) =>
  request("", { method: "POST", body: JSON.stringify(siswa) });

export const updateSiswa = (kode, siswa) =>
  request(`/${encodeURIComponent(kode)}`, {
    method: "PUT",
    body: JSON.stringify(siswa),
  });

export const deleteSiswa = (kode) =>
  request(`/${encodeURIComponent(kode)}`, { method: "DELETE" });
