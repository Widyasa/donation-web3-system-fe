import { ref } from 'vue';
import { ethers, type BrowserProvider, type JsonRpcSigner } from 'ethers';
import { contractABI } from '~/utils/abi';

// State yang tidak butuh konteks Nuxt (seperti ref biasa) aman untuk didefinisikan di sini.
const account = ref<string | null>(null);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string>('');

// Ini adalah fungsi utama composable Anda.
// Semua hook Nuxt (yang diawali 'use') harus berada di dalamnya.
export function useWeb3() {
    // --- PINDAHKAN KODE YANG BERMASALAH KE DALAM SINI ---
    const runtimeConfig = useRuntimeConfig();
    const contractAddress = runtimeConfig.public.contractAddress as string;
    // --- SELESAI DIPINDAHKAN ---

    // Fungsi untuk menghubungkan ke wallet
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
        } finally {
            isLoading.value = false;
        }
    };

    // Fungsi untuk mengirim donasi
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

            // `contractAddress` sekarang bisa diakses dengan aman di sini
            const donationContract = new ethers.Contract(contractAddress, contractABI, currentSigner);
            const amountInWei = ethers.parseEther(amount);

            const tx = await donationContract.sendDonation(name, message, recipient, { value: amountInWei });
            await tx.wait();
            return tx;
        } catch (error: any) {
            if (error.code === 'ACTION_REJECTED') {
                 errorMessage.value = "Anda menolak transaksi di MetaMask.";
            } else {
                 errorMessage.value = error.message || "Terjadi kesalahan saat mengirim donasi.";
            }
            return null;
        } finally {
            isLoading.value = false;
        }
    };

    // Kembalikan semua state dan fungsi yang dibutuhkan oleh komponen
    return {
        account,
        isLoading,
        errorMessage,
        connectWallet,
        sendDonation
    };
}