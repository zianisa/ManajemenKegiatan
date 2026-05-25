// Menghubungkan ke folder utama 'api', lalu masuk ke folder 'api' milik back-end
const BASE_URL = "http://localhost/api/api/";
// Alternatif lain jika pakai localhost biasa:
// const BASE_URL = 'http://localhost/kegiatan lab/api/';

// Jalankan fungsi otomatis setelah halaman selesai dimuat sepenuhnya
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("formLogin")) {
    initLogin();
  }
  if (document.getElementById("tabelKegiatan")) {
    initManajemenKegiatan();
  }
  if (document.getElementById("tabelArsip")) {
    initArsipDokumen();
  }
});

// ==========================================
// A. LOGIKA UNTUK HALAMAN LOGIN (login.html)
// ==========================================
function initLogin() {
  const form = document.getElementById("formLogin");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Pastikan ID di sini SAMA PERSIS dengan di HTML (username & password)
    const email = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      console.log("Sedang mencoba login ke server..."); // Log pelacak di console

      // ... (setelah const password = document.getElementById("password").value;)

      const formData = new FormData();
      formData.append("email", email); // Ganti jadi variabel 'email'
      formData.append("password", password); // Ganti jadi variabel 'password'

      const response = await fetch(`${BASE_URL}login.php`, {
        method: "POST",
        body: formData, // Langsung masukkan formData (Tanpa Headers JSON)
      });

      const result = await response.json();
      console.log("Respon dari back-end:", result);

      if (result.status === "success") {
        // CARA MENANGANI ROLE:
        // Kita ambil data role yang dikirim oleh back-end (misal: "super admin" atau "admin")
        const userRole = result.data.role.toLowerCase();

        alert(
          `Login Berhasil! Selamat datang ${result.data.nama} (${result.data.role})`,
        );

        // Di dalam blok if (result.status === "success")
        // ...
        // Simpan data ke localStorage agar browser 'ingat' siapa yang login
        localStorage.setItem("user_id", result.data.id);
        localStorage.setItem("user_role", result.data.role); // INI YANG PENTING
        localStorage.setItem("user_nama", result.data.nama);

        // Tambahkan ini untuk memastikan data benar-benar tersimpan sebelum pindah halaman
        console.log(
          "Data role yang disimpan:",
          localStorage.getItem("user_role"),
        );

        // Baru pindah halaman
        window.location.href = "dashboard.html";
      } else {
        // Kalau email/password salah, atau user tidak ditemukan
        alert(`Gagal Login: ${result.message}`);
      }
    } catch (error) {
      console.error("Error lengkap saat login:", error);
      alert(
        "Waduh, gagal terhubung ke back-end! Pastikan server back-end temenmu sudah aktif ya.",
      );
    }
  });
}

// ==========================================
// B. LOGIKA MANAJEMEN KEGIATAN (kegiatan.html)
// ==========================================
function initManajemenKegiatan() {
  // PROTEKSI HALAMAN BERDASARKAN ROLE
  // Kita cek, kalau yang masuk bukan super admin atau admin, tendang balik ke login.html
  const roleSekarang = localStorage.getItem("user_role");
  if (
    !roleSekarang ||
    (roleSekarang !== "super_admin" && roleSekarang !== "admin")
  ) {
    alert("Akses ditolak! Halaman ini khusus untuk Admin / Super Admin.");
    window.location.href = "login.html";
    return;
  }

  // Tampilkan nama role di navbar jika ada elemen teksnya (opsional)
  // document.querySelector(".navbar span:last-child").innerText = localStorage.getItem('user_nama');

  const formKegiatan = document.getElementById("formKegiatan");
  loadDaftarKegiatan();

  if (formKegiatan) {
    formKegiatan.addEventListener("submit", async (e) => {
      e.preventDefault();

      const namaKegiatan = document.getElementById("namaKegiatan").value;
      const tanggalKegiatan = document.getElementById("tanggalKegiatan").value;
      const statusDefault = "aktif";

      try {
        const response = await fetch(`${BASE_URL}kegiatan.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama_kegiatan: namaKegiatan,
            tanggal: tanggalKegiatan,
            status: statusDefault,
          }),
        });

        const result = await response.json();

        if (result.status === "success") {
          alert("Kegiatan berhasil ditambahkan!");
          formKegiatan.reset();
          loadDaftarKegiatan();
        } else {
          alert(`Gagal menambah kegiatan: ${result.message}`);
        }
      } catch (error) {
        console.error("Error POST kegiatan:", error);
      }
    });
  }
}

async function loadDaftarKegiatan() {
  const tabelKegiatan = document.getElementById("tabelKegiatan");
  if (!tabelKegiatan) return;

  try {
    const response = await fetch(`${BASE_URL}kegiatan.php`, { method: "GET" });
    const result = await response.json();

    if (result.status === "success") {
      tabelKegiatan.innerHTML = "";

      // Perbaikan penulisan fungsi loop pembaca data back-end
      result.data.forEach((keg) => {
        tabelKegiatan.innerHTML += `
                    <tr>
                        <td>${keg.nama_kegiatan}</td>
                        <td>${keg.tanggal}</td>
                        <td>${keg.status || "Lab"}</td>
                        <td>
                            <a href="detail.html?id=${keg.id}" class="btn btn-sm btn-info text-white">
                                <i class="bi bi-eye"></i> Detail
                            </a>
                        </td>
                    </tr>
                `;
      });
    }
  } catch (error) {
    console.error("Error mengambil daftar kegiatan:", error);
  }
}

// ==========================================
// C. LOGIKA UPLOAD ARSIP DOKUMEN (detail.html)
// ==========================================
function initArsipDokumen() {
  const formArsip = document.getElementById("formArsip");
  const urlParams = new URLSearchParams(window.location.search);
  const kegiatanId = urlParams.get("id") || 1;

  if (formArsip) {
    formArsip.addEventListener("submit", async (e) => {
      e.preventDefault();

      const namaFile = document.getElementById("namaFile").value;
      const fileArsip = document.getElementById("fileArsip").files[0];

      const formData = new FormData();
      formData.append("kegiatan_id", kegiatanId);
      formData.append("user_id", localStorage.getItem("user_id") || 1);
      formData.append("jenis_dokumen", namaFile);
      formData.append("file", fileArsip);

      try {
        const response = await fetch(`${BASE_URL}dokumentasi.php`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.status === "success") {
          alert("Dokumen berhasil diarsip!");
          formArsip.reset();
        } else {
          alert(`Gagal unggah: ${result.message}`);
        }
      } catch (error) {
        console.error("Error upload file:", error);
      }
    });
  }
}
