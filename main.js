// ==========================================
// KONFIGURASI API (UBAH IP DI SINI SAJA)
// ==========================================
const BASE_API = "http://10.21.1.39/manajemen_kegiatan/api";
// ==========================================

// --- 0. PROTEKSI DASHBOARD & LOGOUT ---
function checkAuth() {
  const userData = localStorage.getItem("userData");
  // Jika tidak ada data login dan berada di halaman selain login
  if (
    !userData &&
    !window.location.pathname.includes("login.html") &&
    !window.location.pathname.includes("register.html")
  ) {
    window.location.href = "login.html";
  }
}
checkAuth();

window.logout = function () {
  localStorage.removeItem("userData");
  window.location.href = "login.html";
};

// --- FUNGSI LOAD DASHBOARD KHUSUS ---
window.loadDashboardData = async function () {
  const tabelDashboard = document.getElementById("tabelDashboard");
  const totalKegiatan = document.getElementById("totalKegiatan");
  if (!tabelDashboard) return;

  try {
    const res = await fetch(`${BASE_API}/get_kegiatan.php`);
    const resData = await res.json();
    if (resData.status === "success") {
      totalKegiatan.innerText = resData.data.length;
      tabelDashboard.innerHTML = resData.data
        .map(
          (item) => `
              <tr>
                  <td class="fw-semibold">${item.judul}</td>
                  <td><span class="badge bg-primary">${item.kategori}</span></td>
                  <td>${item.tanggal}</td>
                  <td><span class="badge bg-success">Aktif</span></td>
              </tr>
          `,
        )
        .join("");
    }
  } catch (e) {
    console.error("Gagal load dashboard");
  }
};

document.addEventListener("DOMContentLoaded", function () {
  // Panggil data khusus dashboard jika elemennya ada
  if (document.getElementById("tabelDashboard")) {
    loadDashboardData();
  }

  // --- 1. LOGIKA LOGIN ---
  const formLogin = document.getElementById("formLogin");
  if (formLogin) {
    formLogin.addEventListener("submit", async function (e) {
      e.preventDefault();
      const formData = new FormData(formLogin);
      try {
        const response = await fetch(`${BASE_API}/login.php`, {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (data.status === "success") {
          localStorage.setItem("userData", JSON.stringify(data.user));
          window.location.href = "dashboard.html";
        } else {
          alert("Gagal: " + data.message);
        }
      } catch (error) {
        alert("Gagal terhubung.");
      }
    });
  }

  // --- 2. LOGIKA MANAJEMEN KEGIATAN (TAMBAH & HAPUS) ---
  const formKegiatan = document.getElementById("formKegiatan");
  const tabelKegiatan = document.getElementById("tabelKegiatan");

  window.loadDataKegiatan = async function () {
    if (!tabelKegiatan) return;
    try {
      const response = await fetch(`${BASE_API}/get_kegiatan.php`);
      const result = await response.json();
      if (result.status === "success") {
        tabelKegiatan.innerHTML = result.data
          .map((item) => {
            // Cek status dari database, jika kosong default ke 'Segera Berlangsung'
            const statusSaatIni = item.status_acara || "Segera Berlangsung";
            // Tentukan warna badge dan status kebalikannya untuk tombol
            const warnaBadge =
              statusSaatIni === "Selesai" ? "bg-secondary" : "bg-success";
            const statusBaru =
              statusSaatIni === "Segera Berlangsung"
                ? "Selesai"
                : "Segera Berlangsung";

            return `
            <tr>
              <td class="fw-bold">${item.judul}</td>
              <td>${item.kategori || "-"}</td>
              <td>${item.tanggal}</td>
              <td><span class="badge ${warnaBadge}">${statusSaatIni}</span></td>
              <td>
                <button class="btn btn-sm btn-outline-warning fw-bold" onclick="ubahStatusAcara('${item.judul}', '${statusBaru}')" title="Ubah Status">
                    <i class="bi bi-arrow-repeat"></i>
                </button>
                <a href="edit.html?judul=${encodeURIComponent(item.judul)}" class="btn btn-sm btn-outline-info">Edit</a>
                <button class="btn btn-sm btn-outline-danger" onclick="hapusKegiatan('${item.judul}')"><i class="bi bi-trash"></i></button>
              </td>
            </tr>`;
          })
          .join("");
      }
    } catch (error) {
      console.error("Gagal load:", error);
    }
  };

  if (formKegiatan) {
    formKegiatan.addEventListener("submit", async function (e) {
      e.preventDefault();
      const inputJudul = document.getElementById("namaKegiatan");
      const inputKategori = document.getElementById("kategoriKegiatan");
      const inputTanggal = document.getElementById("tanggalKegiatan");

      if (!inputJudul.value || !inputKategori.value || !inputTanggal.value) {
        alert("Gagal: Nama, Kategori, dan Tanggal wajib diisi!");
        return;
      }

      const formData = new FormData();
      formData.append("judul", inputJudul.value);
      formData.append("kategori", inputKategori.value);
      formData.append("tanggal", inputTanggal.value);

      try {
        const response = await fetch(`${BASE_API}/add_kegiatan.php`, {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (result.status === "success") {
          alert("Data Kegiatan Berhasil Ditambahkan!");
          inputJudul.value = "";
          inputKategori.value = "";
          inputTanggal.value = "";
          loadDataKegiatan();
        } else {
          alert("Gagal: " + result.message);
        }
      } catch (error) {
        alert("Gagal terhubung ke server.");
      }
    });
  }

  loadDataKegiatan();

  // --- 3. LOGIKA DETAIL, POSTER, ARSIP & PANITIA ---
  const detailTitle = document.getElementById("detailTitle");
  if (detailTitle) {
    const judul = new URLSearchParams(window.location.search).get("judul");
    if (judul) {
      detailTitle.innerText = "Daftar Peserta: " + judul;

      // A. Load Pendaftar (Diubah menjadi fungsi agar bisa di-refresh otomatis)
      window.loadTabelPendaftar = function () {
        fetch(
          `${BASE_API}/get_pendaftar.php?judul=${encodeURIComponent(judul)}`,
        )
          .then((r) => r.json())
          .then((res) => {
            if (res.status === "success")
              document.getElementById("tabelDetailPendaftar").innerHTML =
                res.data
                  .map(
                    (item, i) => `<tr>
                    <td>${i + 1}</td>
                    <td>${item.nama_lengkap}</td>
                    <td>${item.nim}</td>
                    <td>${item.no_telp || "-"}</td>
                    <td>${item.bukti_pembayaran ? `<a href="${item.bukti_pembayaran}" target="_blank" class="btn btn-xs btn-outline-primary py-0 px-2 fw-bold" style="font-size: 11px;"><i class="bi bi-image"></i> Lihat</a>` : '<span class="text-muted small">-</span>'}</td>
                    <td><span class="badge ${item.status_kehadiran === "Hadir" || item.status === "Hadir" ? "bg-success" : "bg-secondary"}">${item.status_kehadiran || item.status || "Belum Hadir"}</span></td>
                    <td>${item.tanggal_daftar}</td>
                  </tr>`,
                  )
                  .join("");
          });
      };

      // Panggil pertama kali saat halaman edit dibuka
      loadTabelPendaftar();

      // --- LOGIKA SCANNER YANG SUDAH DIPERBAIKI ---
      const btnScanQR = document.getElementById("btnScanQR");
      const scannerContainer = document.getElementById("scannerContainer");
      let html5QrcodeScanner; // Deklarasi di luar agar stabil

      if (btnScanQR) {
        btnScanQR.addEventListener("click", () => {
          scannerContainer.classList.remove("d-none");
          html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false,
          );

          html5QrcodeScanner.render(async (decodedText) => {
            // 1. Matikan kamera segera setelah membaca QR
            html5QrcodeScanner.clear();
            scannerContainer.classList.add("d-none");

            // 2. Bersihkan NIM
            const nimBersih = decodedText.replace(/\D/g, "");
            alert(`QR Terbaca: ${nimBersih}. Sedang menyimpan ke database...`);

            // 3. Kirim ke API Absensi
            const fd = new FormData();
            fd.append("judul_kegiatan", judul);
            fd.append("nim", nimBersih);

            try {
              const res = await fetch(`${BASE_API}/absensi_qr.php`, {
                method: "POST",
                body: fd,
              });

              // Membaca teks mentah dulu agar terhindar dari error PHP/JSON
              const textRes = await res.text();
              try {
                const result = JSON.parse(textRes);
                if (result.status === "success") {
                  alert("✅ " + result.message);
                  loadTabelPendaftar(); // <-- INI KUNCI UTAMA: Auto-refresh tabel
                } else {
                  alert("❌ " + result.message);
                }
              } catch (e) {
                alert("Error respon server: \n" + textRes);
              }
            } catch (error) {
              alert("Gagal terhubung ke server Absensi.");
            }
          });
        });

        // Fungsi tombol tutup scanner jika batal scan
        const btnCloseScanner = document.getElementById("btnCloseScanner");
        if (btnCloseScanner) {
          btnCloseScanner.addEventListener("click", () => {
            if (html5QrcodeScanner) html5QrcodeScanner.clear();
            scannerContainer.classList.add("d-none");
          });
        }
      }

      // --- TAMBAHKAN KODE INI UNTUK EXPORT EXCEL ---
      const btnExportExcel = document.getElementById("btnExportExcel");
      if (btnExportExcel) {
        btnExportExcel.addEventListener("click", function () {
          const table = document.getElementById("tabelPesertaUtama"); // Sesuaikan ID tabelmu
          if (!table) return;

          const tableHTML = table.outerHTML;
          const downloadLink = document.createElement("a");

          downloadLink.href =
            "data:application/vnd.ms-excel;base64," +
            btoa(unescape(encodeURIComponent(tableHTML)));

          downloadLink.download = `Data_Peserta_${judul}.xls`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        });
      }

      // B. Load Poster dan Arsip yang sudah tersimpan
      window.loadDetailData = function () {
        fetch(`${BASE_API}/get_kegiatan.php`)
          .then((r) => r.json())
          .then((res) => {
            const keg = res.data.find((k) => k.judul === judul);
            if (keg) {
              // Tampilkan Poster
              if (keg.gambar && keg.gambar !== "") {
                document.getElementById("posterName").innerText = keg.gambar
                  .split("/")
                  .pop();
                document.getElementById("posterLink").href = keg.gambar;
                document
                  .getElementById("previewContainer")
                  .classList.remove("d-none");
              }

              // Tampilkan Banyak Arsip Dokumen
              const arsipContainer = document.getElementById("arsipContainer");
              const arsipList = document.getElementById("arsipList");

              if (keg.dokumen && keg.dokumen !== "") {
                const docsArray = keg.dokumen.split(",");
                arsipContainer.classList.remove("d-none");

                arsipList.innerHTML = docsArray
                  .map((docUrl) => {
                    const docName = docUrl.split("/").pop();
                    return `
                    <div class="p-2 border rounded bg-light d-flex align-items-center justify-content-between">
                      <a href="${docUrl}" target="_blank" class="text-decoration-none text-truncate w-75">
                        <i class="bi bi-file-earmark-text text-primary"></i> 
                        <span class="text-dark fw-semibold small">${docName}</span>
                      </a>
                      <button class="btn btn-sm btn-outline-danger border-0" onclick="hapusArsip('${judul}', '${docUrl}')" title="Hapus Dokumen">
                        <i class="bi bi-x-lg"></i>
                      </button>
                    </div>
                  `;
                  })
                  .join("");
              } else {
                arsipContainer.classList.add("d-none");
                arsipList.innerHTML = "";
              }
            }
          });
      };

      loadDetailData();

      // C. Logika Upload Poster
      const btnSimpanPoster = document.getElementById("btnSimpanPoster");
      const posterInput = document.getElementById("posterInput");
      if (btnSimpanPoster) {
        btnSimpanPoster.addEventListener("click", async () => {
          if (!posterInput.files[0]) return alert("Pilih file gambar!");
          const fd = new FormData();
          fd.append("poster", posterInput.files[0]);
          fd.append("judul", judul);

          btnSimpanPoster.disabled = true;
          btnSimpanPoster.innerHTML = "Mengunggah...";
          try {
            const res = await fetch(`${BASE_API}/upload_poster.php`, {
              method: "POST",
              body: fd,
            });
            const result = await res.json();
            if (result.status === "success") {
              alert("Poster berhasil diunggah!");
              loadDetailData();
              posterInput.value = "";
            } else {
              alert("Gagal: " + result.message);
            }
          } catch (e) {
            alert("Error koneksi");
          } finally {
            btnSimpanPoster.disabled = false;
            btnSimpanPoster.innerHTML =
              '<i class="bi bi-upload"></i> Simpan Poster';
          }
        });
      }

      // D. Logika Upload BANYAK Arsip Dokumen
      const btnSimpanArsip = document.getElementById("btnSimpanArsip");
      const arsipInput = document.getElementById("arsipInput");
      if (btnSimpanArsip) {
        btnSimpanArsip.addEventListener("click", async () => {
          if (arsipInput.files.length === 0)
            return alert("Pilih file dokumen dulu!");

          const fd = new FormData();
          fd.append("judul", judul);

          for (let i = 0; i < arsipInput.files.length; i++) {
            fd.append("dokumen[]", arsipInput.files[i]);
          }

          btnSimpanArsip.disabled = true;
          btnSimpanArsip.innerHTML = "Mengunggah...";
          try {
            const res = await fetch(`${BASE_API}/upload_arsip.php`, {
              method: "POST",
              body: fd,
            });
            const result = await res.json();
            if (result.status === "success") {
              alert("Dokumen berhasil ditambahkan!");
              loadDetailData();
              arsipInput.value = "";
            } else {
              alert("Gagal: " + result.message);
            }
          } catch (e) {
            alert("Error koneksi");
          } finally {
            btnSimpanArsip.disabled = false;
            btnSimpanArsip.innerHTML =
              '<i class="bi bi-cloud-arrow-up"></i> Upload Dokumen';
          }
        });
      }

      // E. LOGIKA SUSUNAN PANITIA
      const formPanitia = document.getElementById("formPanitia");
      const tabelPanitia = document.getElementById("tabelPanitia");

      window.loadPanitia = async function () {
        if (!tabelPanitia) return;
        try {
          const res = await fetch(
            `${BASE_API}/get_panitia.php?judul=${encodeURIComponent(judul)}`,
          );
          const result = await res.json();
          if (result.status === "success" && result.data.length > 0) {
            tabelPanitia.innerHTML = result.data
              .map(
                (p) => `
              <tr>
                <td class="fw-semibold text-dark">${p.nama}</td>
                <td><span class="badge bg-secondary">${p.jabatan}</span></td>
                <td class="text-center">
                  <button type="button" class="btn btn-sm btn-outline-danger border-0" onclick="hapusPanitia(${p.id})">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            `,
              )
              .join("");
          } else {
            tabelPanitia.innerHTML = `<tr><td colspan="3" class="text-center text-muted small py-3">Belum ada panitia ditambahkan.</td></tr>`;
          }
        } catch (e) {
          console.error("Gagal meload panitia:", e);
        }
      };

      loadPanitia();

      if (formPanitia) {
        formPanitia.addEventListener("submit", async (e) => {
          e.preventDefault();
          const namaPanitia = document.getElementById("namaPanitia");
          const jabatanPanitia = document.getElementById("jabatanPanitia");

          const fd = new FormData();
          fd.append("judul_kegiatan", judul);
          fd.append("nama", namaPanitia.value);
          fd.append("jabatan", jabatanPanitia.value);

          try {
            const res = await fetch(`${BASE_API}/add_panitia.php`, {
              method: "POST",
              body: fd,
            });
            const result = await res.json();
            if (result.status === "success") {
              formPanitia.reset();
              loadPanitia();
            } else {
              alert("Gagal menambah panitia: " + result.message);
            }
          } catch (error) {
            alert("Error koneksi");
          }
        });
      }
    }
  }
});

// --- FUNGSI HAPUS GLOBAL ---

// 1. Hapus Kegiatan
async function hapusKegiatan(judul) {
  if (!confirm(`Hapus "${judul}"?`)) return;
  const fd = new FormData();
  fd.append("judul", judul);
  try {
    const res = await fetch(`${BASE_API}/delete_kegiatan.php`, {
      method: "POST",
      body: fd,
    });
    const result = await res.json();
    if (result.status === "success") {
      alert("Berhasil dihapus!");
      window.loadDataKegiatan();
    } else {
      alert("Gagal");
    }
  } catch (e) {
    alert("Error koneksi");
  }
}

// 2. Hapus Dokumen Arsip
async function hapusArsip(judul, urlDokumen) {
  if (!confirm("Yakin ingin menghapus dokumen ini dari arsip?")) return;
  const fd = new FormData();
  fd.append("judul", judul);
  fd.append("url_hapus", urlDokumen);

  try {
    const res = await fetch(`${BASE_API}/delete_arsip.php`, {
      method: "POST",
      body: fd,
    });
    const result = await res.json();
    if (result.status === "success") {
      alert("Dokumen berhasil dihapus!");
      window.loadDetailData();
    } else {
      alert("Gagal menghapus dokumen");
    }
  } catch (e) {
    alert("Error koneksi");
  }
}

// 3. Hapus Susunan Panitia
window.hapusPanitia = async function (idPanitia) {
  if (!confirm("Yakin ingin menghapus panitia ini?")) return;
  const fd = new FormData();
  fd.append("id", idPanitia);
  try {
    const res = await fetch(`${BASE_API}/delete_panitia.php`, {
      method: "POST",
      body: fd,
    });
    const result = await res.json();
    if (result.status === "success") {
      window.loadPanitia();
    } else {
      alert("Gagal menghapus panitia");
    }
  } catch (e) {
    alert("Error koneksi");
  }
};

// Fungsi mengubah status kegiatan (Segera Berlangsung <-> Selesai)
window.ubahStatusAcara = async function (judul, statusBaru) {
  if (!confirm(`Ubah status kegiatan "${judul}" menjadi ${statusBaru}?`))
    return;

  const fd = new FormData();
  fd.append("judul", judul);
  fd.append("status_baru", statusBaru);

  try {
    const res = await fetch(`${BASE_API}/ubah_status_kegiatan.php`, {
      method: "POST",
      body: fd,
    });
    const result = await res.json();
    if (result.status === "success") {
      window.loadDataKegiatan(); // Refresh tabel otomatis
    } else {
      alert("Gagal merubah status.");
    }
  } catch (e) {
    alert("Error koneksi jaringan");
  }
};

// Fungsi untuk memuat data dashboard admin
window.loadDashboardStats = async function () {
  try {
    const response = await fetch(`${BASE_API}/get_dashboard_admin.php`);
    const result = await response.json();

    if (result.status === "success") {
      document.getElementById("angka-kegiatan").innerText =
        result.data.total_kegiatan;
      document.getElementById("angka-pendaftar").innerText =
        result.data.total_pendaftar;
    }
  } catch (error) {
    console.error("Gagal memuat data dashboard:", error);
  }
};

// Panggil fungsi ini otomatis saat halaman load (tambahkan di dalam event DOMContentLoaded jika ada)
document.addEventListener("DOMContentLoaded", () => {
  // Cek apakah elemen angka-kegiatan ada (berarti sedang di halaman dashboard)
  if (document.getElementById("angka-kegiatan")) {
    loadDashboardStats();
  }
});
