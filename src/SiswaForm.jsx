import { useEffect, useState } from "react";
import {
  IconUserPlus,
  IconEdit,
  IconX,
  IconCheck,
  IconCalendar,
  IconMapPin,
  IconBookOpen,
} from "./icons.jsx";

const KOSONG = {
  kode_siswa: "",
  nama_siswa: "",
  alamat_siswa: "",
  tgl_siswa: "",
  jurusan_siswa: "",
};

export default function SiswaForm({
  isOpen,
  editing,
  onSubmit,
  onClose,
  saving,
}) {
  const [form, setForm] = useState(KOSONG);
  const isEdit = Boolean(editing);

  useEffect(() => {
    if (editing) {
      setForm({
        kode_siswa: editing.kode_siswa || "",
        nama_siswa: editing.nama_siswa || "",
        alamat_siswa: editing.alamat_siswa || "",
        tgl_siswa: editing.tgl_siswa
          ? editing.tgl_siswa.split("T")[0]
          : "",
        jurusan_siswa: editing.jurusan_siswa || "",
      });
    } else {
      setForm(KOSONG);
    }
  }, [editing, isOpen]);

  // Tutup dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !saving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  const ubah = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const kirim = async (e) => {
    e.preventDefault();
    const berhasil = await onSubmit(form);
    if (berhasil) {
      if (!isEdit) setForm(KOSONG);
      onClose();
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-card">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-icon">
            {isEdit ? <IconEdit size={20} /> : <IconUserPlus size={20} />}
          </div>
          <div className="modal-header-text">
            <h2 id="modal-title">
              {isEdit ? "Edit Data Siswa" : "Tambah Siswa Baru"}
            </h2>
            <p>
              {isEdit
                ? `Perbarui informasi untuk siswa dengan kode ${editing?.kode_siswa}`
                : "Lengkapi formulir di bawah ini untuk mendaftarkan siswa baru."}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={saving}
            aria-label="Tutup jendela"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={kirim} className="modal-form">
          <div className="form-grid">
            {/* Kode Siswa */}
            <div className="form-group">
              <label htmlFor="field-kode">
                Kode / NIM  MahaSiswa <span className="req">*</span>
              </label>
              <input
                id="field-kode"
                name="kode_siswa"
                value={form.kode_siswa}
                onChange={ubah}
                disabled={isEdit}
                placeholder="Contoh: S001 atau NIS-2401"
                maxLength={20}
                required
                autoFocus={!isEdit}
              />
              <span className="field-hint">
                {isEdit
                  ? "Kode siswa bersifat unik dan tidak dapat diubah."
                  : "Identitas unik siswa di pangkalan data."}
              </span>
            </div>

            {/* Nama Siswa */}
            <div className="form-group">
              <label htmlFor="field-nama">
                Nama Lengkap MahaSiswa <span className="req">*</span>
              </label>
              <input
                id="field-nama"
                name="nama_siswa"
                value={form.nama_siswa}
                onChange={ubah}
                placeholder="Contoh: Muhammad Budi Pratama"
                maxLength={100}
                required
                autoFocus={isEdit}
              />
            </div>

            {/* Tanggal Lahir */}
            <div className="form-group">
              <label htmlFor="field-tgl">
                Tanggal Lahir <span className="req">*</span>
              </label>
              <div className="input-with-icon">
                <input
                  id="field-tgl"
                  type="date"
                  name="tgl_siswa"
                  value={form.tgl_siswa}
                  onChange={ubah}
                  required
                />
              </div>
            </div>

            {/* Program Keahlian / Jurusan */}
            <div className="form-group">
              <label htmlFor="field-jurusan">
                Program Keahlian / Jurusan <span className="req">*</span>
              </label>
              <input
                id="field-jurusan"
                name="jurusan_siswa"
                value={form.jurusan_siswa}
                onChange={ubah}
                placeholder="Contoh: teknik informatika"
                maxLength={100}
                list="jurusan-suggestions"
                required
              />
              <datalist id="jurusan-suggestions">
                <option value="hukum" />
                <option value="Teknik informatika" />
                <option value="teknik industri" />
                <option value="Akuntansi dan Keuangan" />
                <option value="teknik" />
                <option value="Teknik geosifika" />
              </datalist>
            </div>

            {/* Alamat Siswa (Full Width) */}
            <div className="form-group full-width">
              <label htmlFor="field-alamat">
                Alamat Domisili <span className="req">*</span>
              </label>
              <textarea
                id="field-alamat"
                name="alamat_siswa"
                value={form.alamat_siswa}
                onChange={ubah}
                placeholder="Tuliskan jalan, nomor rumah, RT/RW, kelurahan, kecamatan..."
                rows={3}
                maxLength={255}
                required
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner" />
                  <span>Menyimpan...</span>
                </>
              ) : isEdit ? (
                <>
                  <IconCheck size={16} />
                  <span>Simpan Perubahan</span>
                </>
              ) : (
                <>
                  <IconUserPlus size={16} />
                  <span>Tambah Siswa</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
