const API_BASE_URL = 'http://localhost:3000/api/v1';


export const authService = {
    /**
     * Mengirim permintaan login ke backend.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>} Respon dari API (berhasil/gagal)
     */
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                
                const error = new Error(data.error || 'Terjadi kesalahan saat login.');
                error.status = response.status;
                error.details = data.details || data.errors; 
                throw error;
            }

            return data; 
        } catch (error) {
            console.error('Error di authService.login:', error);
            throw error; 
        }
    },


     /**
     * Melakukan proses logout.
     * Menghapus token dan data user dari local storage dan mengarahkan ke halaman login.
     */
    logout: () => {
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('isFirstLogin'); 

        
        
        window.location.href = '/src/pages/login.html'; 
    }

    
};

