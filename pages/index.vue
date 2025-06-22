<template>
    <div class="max-w-4xl mx-auto p-6 bg-slate-50 min-h-screen">
      <header class="text-center mb-10">
        <h1 class="text-4xl font-bold text-slate-800">Platform Donasi Direct</h1>
        <p class="text-slate-500 mt-2">Kirim donasi secara transparan dan langsung ke penerima.</p>
      </header>
  
      <div class="text-center mb-8">
        <button 
          v-if="!account" 
          @click="connectWallet" 
          class="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-slate-400"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Menghubungkan...' : 'Hubungkan Wallet' }}
        </button>
        <div v-else class="p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg">
          <p class="font-semibold">Wallet Terhubung!</p>
          <p class="text-sm break-all">{{ account }}</p>
        </div>
      </div>
  
      <div v-if="errorMessage" class="mb-6 p-4 bg-red-100 text-red-700 rounded-lg text-center">{{ errorMessage }}</div>
      <div v-if="isLoading && !account" class="mb-6 text-center text-slate-500">Menunggu koneksi...</div>
  
      <div class="grid grid-cols-1 md:grid-cols-2 gap-10" v-if="account">
        <div class="bg-white p-6 rounded-xl shadow-md">
          <h2 class="text-2xl font-bold mb-6 text-slate-700">Buat Donasi Baru</h2>
          <form @submit.prevent="handleDonationSubmit">
            <div class="space-y-4">
              <input v-model="form.recipient" type="text" placeholder="Alamat Wallet Penerima (0x...)" class="w-full p-3 border rounded-lg" required>
              <input v-model="form.name" type="text" placeholder="Nama Anda" class="w-full p-3 border rounded-lg" required>
              <input v-model="form.message" type="text" placeholder="Pesan Anda" class="w-full p-3 border rounded-lg" required>
              <input v-model="form.amount" type="text" placeholder="Jumlah Donasi (ETH), cth: 0.01" class="w-full p-3 border rounded-lg" required>
            </div>
            <button 
              type="submit"
              class="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition duration-300 mt-6 disabled:bg-slate-400"
              :disabled="isLoading"
            >
              {{ isLoading ? 'Mengirim Transaksi...' : 'Kirim Donasi' }}
            </button>
          </form>
        </div>
  
        <div class="bg-white p-6 rounded-xl shadow-md">
          <h2 class="text-2xl font-bold mb-6 text-slate-700">Riwayat Donasi</h2>
          <div v-if="pending" class="text-center">Memuat riwayat...</div>
          <div v-else-if="errorFetch" class="text-center text-red-500">Gagal memuat riwayat.</div>
          <div v-else-if="donations && donations.length > 0" class="space-y-4 max-h-96 overflow-y-auto">
            <div v-for="donation in donations" :key="donation.id" class="p-4 border rounded-lg bg-slate-50">
              <p class="font-bold text-blue-600">{{ donation.amount }} ETH</p>
              <p class="text-sm text-slate-600">Dari: <span class="font-mono text-xs">{{ donation.name }}</span></p>
              <p class="text-sm text-slate-600">Pesan: "{{ donation.message }}"</p>
              <p class="text-xs text-slate-400 mt-2">{{ donation.timestamp }}</p>
            </div>
          </div>
          <div v-else class="text-center text-slate-500">Belum ada donasi.</div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  // Menggunakan Composable yang sudah kita buat
  const { account, isLoading, errorMessage, connectWallet, sendDonation } = useWeb3();
  onMounted(() => {
  // Anda bisa menempatkan logika yang bergantung pada 'window' di sini.
  // Contoh: memeriksa apakah pengguna sudah pernah terhubung sebelumnya.
  if (window.ethereum && window.ethereum.selectedAddress) {
    console.log("Pengguna sudah pernah menghubungkan wallet ini.");
    // Anda bisa memanggil connectWallet() di sini untuk mencoba auto-connect
    connectWallet(); 
  }
});
  // Mendefinisikan tipe data untuk donasi (sesuai dengan output API backend)
  interface Donation {
    id: number;
    from: string;
    to: string;
    name: string;
    message: string;
    amount: string;
    timestamp: string;
  }
  
  // Mendefinisikan tipe data untuk form
  interface DonationForm {
    recipient: string;
    name: string;
    message: string;
    amount: string;
  }
  
  // Memberikan tipe pada state form
  const form = ref<DonationForm>({
    recipient: '',
    name: 'Donatur Anonim',
    message: '',
    amount: ''
  });
  
  // Memberikan tipe pada hasil fetch data dari API
  const runtimeConfig = useRuntimeConfig();
  const { data: donations, pending, error: errorFetch, refresh } = await useFetch<Donation[]>(`http://localhost:3001/donations`);
  
  // Fungsi untuk menangani submit form
  const handleDonationSubmit = async () => {
    // Validasi sederhana
    if (!form.value.recipient || !form.value.amount) {
      alert("Alamat penerima dan jumlah donasi harus diisi.");
      return;
    }
    
    const tx = await sendDonation(form.value.recipient, form.value.name, form.value.message, form.value.amount);
    
    // Jika transaksi berhasil, reset form dan refresh daftar donasi
    if (tx) {
      alert('Donasi berhasil terkirim! Terima kasih.');
      // Reset form
      form.value = {
          recipient: '',
          name: 'Donatur Anonim',
          message: '',
          amount: ''
      };
      await refresh(); // Memuat ulang data donasi
    }
  };
  </script>