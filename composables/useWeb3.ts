import { ref } from 'vue';
import { ethers, type BrowserProvider, type JsonRpcSigner } from 'ethers';
import { contractABI } from '~/utils/abi';

// Mengambil alamat kontrak dari .env


// State reaktif untuk digunakan di seluruh aplikasi dengan tipe yang eksplisit
const account = ref<string | null>(null);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string>('');

export function useWeb3() {

    const runtimeConfig = useRuntimeConfig();
    const contractAddress = runtimeConfig.public.contractAddress as string;

    // Fungsi connectWallet tidak perlu diubah
    const connectWallet = async () => {
        if (process.server) return;
        errorMessage.value = '';
        isLoading.value = true;
        try {
            if (!window.ethereum) {
                throw new Error("MetaMask tidak terdeteksi. Silakan install MetaMask dan refresh halaman.");
            }
            const ethProvider = new ethers.BrowserProvider(window.ethereum);
            const currentSigner = await ethProvider.getSigner();
            const userAddress = await currentSigner.getAddress();
            account.value = userAddress;
        } catch (error: any) {
            errorMessage.value = error.message || "Gagal menghubungkan wallet.";
            console.error("Connection Error:", error);
        } finally {
            isLoading.value = false;
        }
    };

    // --- FUNGSI sendDonation YANG KITA PERBAIKI ---
    const sendDonation = async (recipient: string, name: string, message: string, amount: string) => {
        if (process.server) return null;

        if (!window.ethereum) {
            errorMessage.value = "Wallet tidak terhubung.";
            return null;
        }
        
        isLoading.value = true;
        errorMessage.value = '';

        try {
            const ethProvider = new ethers.BrowserProvider(window.ethereum);
            const currentSigner = await ethProvider.getSigner();

            const donationContract = new ethers.Contract(contractAddress, contractABI, currentSigner);
            const amountInWei = ethers.parseEther(amount);

            // Meminta MetaMask untuk menandatangani dan mengirim transaksi
            const tx = await donationContract.sendDonation(name, message, recipient, { 
                value: amountInWei 
            });

            // Menunggu transaksi selesai
            await tx.wait();
            return tx;

        } catch (error: any) {
            // --- BLOK PENANGANAN ERROR YANG LEBIH PINTAR ---
            // Kita tetap log error lengkapnya di console untuk debugging
            console.error("Full Donation Error Object:", error);

            // Cek kode error spesifik dari Ethers.js/MetaMask
            // 'code' bisa ada di level atas atau di dalam objek 'error'
            const errorCode = error.code || error?.error?.code;

            if (errorCode === 'INSUFFICIENT_FUNDS' || errorCode === -32003) {
                errorMessage.value = "Transaksi gagal: Saldo Anda tidak cukup untuk mengirim donasi ini beserta biaya gas.";
            } else if (errorCode === 'ACTION_REJECTED' || errorCode === 4001) {
                errorMessage.value = "Anda membatalkan atau menolak transaksi di MetaMask.";
            } else {
                // Fallback untuk error lainnya yang tidak terduga
                errorMessage.value = "Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.";
            }
            return null;
        } finally {
            isLoading.value = false;
        }
    };

    return {
        account,
        isLoading,
        errorMessage,
        connectWallet,
        sendDonation
    };
}