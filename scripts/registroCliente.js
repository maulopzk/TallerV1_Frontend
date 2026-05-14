// En scripts/api.js
async function doRegister(datos) {
    try {
        const response = await fetch('http://localhost:3000/api/nuevo-cliente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const result = await response.json();

        // AQUÍ ESTÁ EL TRUCO:
        // El servidor manda 'ok', pero tu función 'guardarClienteLogin' busca 'success'.
        return {
            success: result.ok, 
            message: result.error || result.mensaje
        };
    } catch (error) {
        console.error("Error de red:", error);
        return { success: false, message: "Error de conexión" };
    }
}