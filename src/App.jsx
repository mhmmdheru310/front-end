import { useCallback, useEffect, useMemo, useState } from "react";
import SiswaForm from "./SiswaForm.jsx";
import {
  getSiswa,
  createSiswa,
  updateSiswa,
  deleteSiswa,
} from "./api.js";
import {
  IconGraduationCap,
  IconUsers,
  IconUserPlus,
  IconBookOpen,
  IconSearch,
  IconFilter,
  IconDownload,
  IconRefresh,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconMapPin,
  IconCheck,
  IconAlertCircle,
  IconX,
  IconLayoutDashboard,
  IconPlus,
} from "./icons.jsx";

const AVATAR_PALETTE = [
  { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" }, // blue
  { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" }, // emerald
  { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" }, // violet
  { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" }, // orange
  { bg: "#fdf2f8", text: "#be185d", border: "#fbcfe8" }, // pink
  { bg: "#f0fdfa", text: "#0f766e", border: "#99f6e4" }, // teal
  { bg: "#fefce8", text: "#a16207", border: "#fef08a" }, // amber
];

const getAvatarStyle = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatTanggal = (tanggal) => {
  if (!tanggal) return "-";
  const parsed = new Date(tanggal);
  return Number.isNaN(parsed.getTime())
    ? tanggal
    : new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(parsed);
};

export default function App() {
  const [siswa, setSiswa] = useState([]);
  const [editing, setEditing] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState("");
  const [jurusanFilter, setJurusanFilter] = useState("Semua Jurusan");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-dismiss notification after 4 seconds
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const muat = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSiswa();
      setSiswa(Array.isArray(data) ? data : []);
    } catch {
      setNotice({
        type: "error",
        text: "Tidak dapat terhubung ke server. Pastikan backend aktif di port 5000.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  const jurusan = useMemo(
    () => [...new Set(siswa.map((s) => s.jurusan_siswa).filter(Boolean))].sort(),
    [siswa],
  );

  const siswaTampil = useMemo(() => {
    const kataKunci = search.trim().toLocaleLowerCase("id");
    return siswa.filter((s) => {
      const cocokJurusan =
        jurusanFilter === "Semua Jurusan" || s.jurusan_siswa === jurusanFilter;
      const cocokKata =
        !kataKunci ||
        [s.nama_siswa, s.kode_siswa, s.alamat_siswa, s.jurusan_siswa]
          .filter(Boolean)
          .some((nilai) => nilai.toLocaleLowerCase("id").includes(kataKunci));
      return cocokJurusan && cocokKata;
    });
  }, [jurusanFilter, search, siswa]);

  const bukaFormTambah = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const bukaFormEdit = (item) => {
    setEditing(item);
    setIsFormOpen(true);
  };

  const tutupForm = () => {
    setEditing(null);
    setIsFormOpen(false);
  };

  const simpan = async (data) => {
    setSaving(true);
    try {
      const res = editing
        ? await updateSiswa(editing.kode_siswa, data)
        : await createSiswa(data);
      setNotice({ type: "ok", text: res.message || "Data berhasil disimpan" });
      await muat();
      return true;
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Gagal menyimpan data" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const konfirmasiHapus = (item) => {
    setDeleteTarget(item);
  };

  const eksekusiHapus = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteSiswa(deleteTarget.kode_siswa);
      setNotice({ type: "ok", text: res.message || "Data berhasil dihapus" });
      if (editing?.kode_siswa === deleteTarget.kode_siswa) {
        tutupForm();
      }
      setDeleteTarget(null);
      await muat();
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Gagal menghapus data" });
    } finally {
      setDeleting(false);
    }
  };

  const eksporCsv = () => {
    const kolom = [
      ["Kode Siswa", "kode_siswa"],
      ["Nama Siswa", "nama_siswa"],
      ["Alamat", "alamat_siswa"],
      ["Tanggal Lahir", "tgl_siswa"],
      ["Program Keahlian", "jurusan_siswa"],
    ];
    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const isi = [
      kolom.map(([judul]) => escapeCsv(judul)).join(","),
      ...siswaTampil.map((s) =>
        kolom.map(([, kunci]) => escapeCsv(s[kunci])).join(","),
      ),
    ].join("\r\n");
    const file = new Blob(["\uFEFF" + isi], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `data-siswa-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetFilter = () => {
    setSearch("");
    setJurusanFilter("Semua Jurusan");
  };

  return (
    <div className="layout-root">
      {/* Toast Notification */}
      {notice && (
        <div className={`toast-alert toast-${notice.type}`} role="status">
          <div className="toast-icon">
            {notice.type === "ok" ? (
              <IconCheck size={18} />
            ) : (
              <IconAlertCircle size={18} />
            )}
          </div>
          <span className="toast-text">{notice.text}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => setNotice(null)}
            aria-label="Tutup notifikasi"
          >
            <IconX size={16} />
          </button>
        </div>
      )}

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside className={`app-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="brand-header">
          <div className="brand-crest">
            <IconGraduationCap size={22} />
          </div>
          <div className="brand-titles">
            <span className="brand-name">univ as-syafiiyah</span>
            <span className="brand-sub">Sistem Informasi mahasiswa</span>
          </div>
        </div>

        <div className="sidebar-action-wrap">
          <button
            type="button"
            className="btn-add-primary"
            onClick={() => {
              bukaFormTambah();
              setMobileMenuOpen(false);
            }}
          >
            <IconPlus size={18} />
            <span>Tambah Siswa</span>
          </button>
        </div>

        <div className="sidebar-nav-group">
          <span className="nav-group-label">NAVIGASI UTAMA</span>
          <nav className="nav-menu">
            <a
              href="#dashboard"
              className="nav-item active"
              onClick={() => setMobileMenuOpen(false)}
            >
              <IconLayoutDashboard size={18} />
              <span>Dashboard & Data</span>
            </a>
            <button
              type="button"
              className="nav-item"
              onClick={() => {
                bukaFormTambah();
                setMobileMenuOpen(false);
              }}
            >
              <IconUserPlus size={18} />
              <span>Registrasi Siswa</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar">HP</div>
            <div className="user-meta">
              <span className="user-name">Muhammad Heru</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
          <div className="connection-status">
            <span className="status-ping" />
            <span>Sistem Terhubung</span>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Buka menu navigasi"
            >
              <span className="hamburger-bar" />
              <span className="hamburger-bar" />
              <span className="hamburger-bar" />
            </button>
            <nav className="breadcrumb-nav" aria-label="Breadcrumb">
              <span className="crumb-root">Portal Akademik</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-active">Direktori MahaSiswa</span>
            </nav>
          </div>

          <div className="topbar-right">
            <div className="current-date-chip">
              <IconCalendar size={14} />
              <span>
                {new Intl.DateTimeFormat("id-ID", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(new Date())}
              </span>
            </div>
            <button
              type="button"
              className="btn-topbar-add"
              onClick={bukaFormTambah}
            >
              <IconPlus size={16} />
              <span>MahaSiswa Baru</span>
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="main-content" id="dashboard">
          {/* Page Hero */}
          <section className="page-header">
            <div className="page-title-block">
              <h1>Direktori Siswa</h1>
              <p>
                Kelola data peserta didik, pantau jurusan, dan unduh arsip data akademik.
              </p>
            </div>
            <div className="header-actions">
              <button
                type="button"
                className="btn-subtle"
                onClick={muat}
                disabled={loading}
                title="Muat ulang data dari server"
              >
                <span className={loading ? "spin-icon" : ""}>
                  <IconRefresh size={16} />
                </span>
                <span>{loading ? "Memuat..." : "Refresh"}</span>
              </button>
              <button
                type="button"
                className="btn-subtle"
                onClick={eksporCsv}
                disabled={siswaTampil.length === 0}
                title="Unduh seluruh data siswa dalam format CSV"
              >
                <IconDownload size={16} />
                <span>Ekspor CSV</span>
              </button>
              <button
                type="button"
                className="btn-cta"
                onClick={bukaFormTambah}
              >
                <IconUserPlus size={16} />
                <span>Tambah Ma</span>
              </button>
            </div>
          </section>

          {/* Stats Metrics */}
          <section className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon-box bg-blue">
                <IconUsers size={22} />
              </div>
              <div className="metric-content">
                <span className="metric-label">Total MahaSiswa Terdaftar</span>
                <span className="metric-value">
                  {loading ? "..." : siswa.length}
                </span>
                <span className="metric-hint">Data aktif di database sekolah</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box bg-emerald">
                <IconBookOpen size={22} />
              </div>
              <div className="metric-content">
                <span className="metric-label">Program Keahlian</span>
                <span className="metric-value">
                  {loading ? "..." : jurusan.length}
                </span>
                <span className="metric-hint">Kompetensi kejuruan tersedia</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box bg-indigo">
                <IconFilter size={22} />
              </div>
              <div className="metric-content">
                <span className="metric-label">Hasil Ditampilkan</span>
                <span className="metric-value">
                  {loading ? "..." : siswaTampil.length}
                </span>
                <span className="metric-hint">
                  {search || jurusanFilter !== "Semua Jurusan"
                    ? "Tersaring berdasarkan kriteria"
                    : "Menampilkan seluruh siswa"}
                </span>
              </div>
            </div>
          </section>

          {/* Table Container Card */}
          <section className="data-card">
            {/* Table Filters & Toolbar */}
            <div className="table-toolbar">
              <div className="search-field">
                <IconSearch size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama, NIS, jurusan, alamat..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Cari siswa"
                />
                {search && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearch("")}
                    aria-label="Hapus kata kunci pencarian"
                  >
                    <IconX size={14} />
                  </button>
                )}
              </div>

              <div className="filter-controls">
                <div className="select-wrapper">
                  <IconFilter size={15} className="select-icon" />
                  <select
                    value={jurusanFilter}
                    onChange={(e) => setJurusanFilter(e.target.value)}
                    aria-label="Pilih jurusan untuk difilter"
                  >
                    <option value="Semua Jurusan">Semua Jurusan</option>
                    {jurusan.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {(search || jurusanFilter !== "Semua Jurusan") && (
                  <button
                    type="button"
                    className="btn-reset-filter"
                    onClick={resetFilter}
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* Table Body */}
            <div className="table-responsive">
              {loading ? (
                <div className="table-loading-state">
                  <span className="loading-spinner" />
                  <p>Memuat data siswa dari sistem...</p>
                </div>
              ) : siswaTampil.length === 0 ? (
                <div className="table-empty-state">
                  <div className="empty-icon-box">
                    <IconSearch size={28} />
                  </div>
                  <h3>
                    {siswa.length === 0
                      ? "Belum Ada Data Siswa"
                      : "Siswa Tidak Ditemukan"}
                  </h3>
                  <p>
                    {siswa.length === 0
                      ? "Mulai dengan mendaftarkan siswa baru ke dalam sistem akademik."
                      : "Tidak ada siswa yang sesuai dengan kata kunci pencarian atau filter jurusan."}
                  </p>
                  {siswa.length === 0 ? (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={bukaFormTambah}
                    >
                      <IconPlus size={16} />
                      <span>Tambah Siswa Pertama</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-subtle"
                      onClick={resetFilter}
                    >
                      Reset Kriteria Pencarian
                    </button>
                  )}
                </div>
              ) : (
                <table className="student-table">
                  <thead>
                    <tr>
                      <th scope="col">Profil Siswa</th>
                      <th scope="col">Program Keahlian</th>
                      <th scope="col">Tanggal Lahir</th>
                      <th scope="col">Alamat Domisili</th>
                      <th scope="col" className="text-right">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {siswaTampil.map((s) => {
                      const avatarStyle = getAvatarStyle(s.nama_siswa || "");
                      const initials = getInitials(s.nama_siswa || "");
                      return (
                        <tr key={s.kode_siswa} className="table-row">
                          <td className="col-student">
                            <div className="student-info-flex">
                              <div
                                className="student-avatar-circle"
                                style={{
                                  backgroundColor: avatarStyle.bg,
                                  color: avatarStyle.text,
                                  border: `1px solid ${avatarStyle.border}`,
                                }}
                              >
                                {initials}
                              </div>
                              <div className="student-titles">
                                <span className="student-name">
                                  {s.nama_siswa}
                                </span>
                                <span className="student-code">
                                  NIS: {s.kode_siswa}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="col-jurusan">
                            <span className="jurusan-tag">
                              {s.jurusan_siswa || "Belum Ditentukan"}
                            </span>
                          </td>
                          <td className="col-tanggal">
                            <div className="date-cell-flex">
                              <IconCalendar size={14} className="cell-icon" />
                              <span>{formatTanggal(s.tgl_siswa)}</span>
                            </div>
                          </td>
                          <td className="col-alamat">
                            <div className="address-cell-flex">
                              <IconMapPin size={14} className="cell-icon" />
                              <span title={s.alamat_siswa}>
                                {s.alamat_siswa || "-"}
                              </span>
                            </div>
                          </td>
                          <td className="col-aksi text-right">
                            <div className="action-button-group">
                              <button
                                type="button"
                                className="action-btn edit-btn"
                                onClick={() => bukaFormEdit(s)}
                                title={`Edit data ${s.nama_siswa}`}
                                aria-label={`Edit ${s.nama_siswa}`}
                              >
                                <IconEdit size={15} />
                              </button>
                              <button
                                type="button"
                                className="action-btn delete-btn"
                                onClick={() => konfirmasiHapus(s)}
                                title={`Hapus data ${s.nama_siswa}`}
                                aria-label={`Hapus ${s.nama_siswa}`}
                              >
                                <IconTrash size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Table Footer */}
            {!loading && siswaTampil.length > 0 && (
              <div className="table-footer-bar">
                <span>
                  Menampilkan <strong>{siswaTampil.length}</strong> dari{" "}
                  <strong>{siswa.length}</strong> siswa terdaftar
                </span>
                {(search || jurusanFilter !== "Semua Jurusan") && (
                  <span className="filtered-hint">
                    (Difilter dari total data)
                  </span>
                )}
              </div>
            )}
          </section>

          {/* Page Footer */}
          <footer className="portal-footer">
            <p>
              &copy; {new Date().getFullYear()} Sistem Informasi Siswa SMK Nusantara.
              Seluruh hak cipta dilindungi.
            </p>
          </footer>
        </main>
      </div>

      {/* Modal Dialog Form Tambah / Edit */}
      <SiswaForm
        isOpen={isFormOpen}
        editing={editing}
        onSubmit={simpan}
        onClose={tutupForm}
        saving={saving}
      />

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setDeleteTarget(null);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
        >
          <div className="modal-card modal-confirm">
            <div className="confirm-icon-box">
              <IconTrash size={24} />
            </div>
            <div className="confirm-content">
              <h2 id="confirm-delete-title">Hapus Data Siswa?</h2>
              <p>
                Apakah Anda yakin ingin menghapus data{" "}
                <strong>{deleteTarget.nama_siswa}</strong> (Kode:{" "}
                <code>{deleteTarget.kode_siswa}</code>)?
              </p>
              <p className="confirm-warning">
                Data yang sudah dihapus tidak dapat dipulihkan kembali.
              </p>
            </div>
            <div className="modal-footer confirm-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={eksekusiHapus}
                disabled={deleting}
              >
                {deleting ? "Menghapus..." : "Ya, Hapus Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
