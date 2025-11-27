// server/controllers/Cancha.controller.js
const CanchaModel = require('../models/Cancha.model');
/**
 * Función auxiliar para limpiar y parsear el array JSON de características.
 */
function cleanAndParseFeatures(cancha) {
    let features = [];
    
    // 1. Manejar si MySQL devuelve el JSON como una cadena (depende de la versión)
    try {
        features = typeof cancha.caracteristicas === 'string' 
                   ? JSON.parse(cancha.caracteristicas) 
                   : cancha.caracteristicas;
    } catch (e) {
        // En caso de error de parseo, asumimos array vacío
        features = []; 
    }
    
    // 2. Limpiar elementos nulos (si una cancha sin características devuelve [null])
    features = Array.isArray(features) ? features.filter(item => item !== null) : [];

    // 3. Devolver la cancha con las características limpias
    return {
        ...cancha,
        caracteristicas: features
    };
}

/**
 * @route GET /api/v1/canchas
 * @description Obtiene la lista de todas las canchas con sus características como objetos JSON.
 * @access Public
 */
async function getCanchasConDetalles(req, res) {
    try {
        const canchasRaw = await CanchaModel.findAllCanchasConCaracteristicas();
        
        // Procesamos los resultados para limpiar el JSON y remover nulos
        const canchas = canchasRaw.map(cleanAndParseFeatures);

        if (canchas.length === 0) {
            return res.status(200).json({
                message: "No se encontraron canchas en la base de datos.",
                data: []
            });
        }

        res.status(200).json({
            message: "Canchas obtenidas exitosamente.",
            data: canchas
        });

    } catch (error) {
        console.error("Error en el controlador al obtener canchas:", error.message);
        res.status(500).json({
            message: "Error interno del servidor al procesar la solicitud."
        });
    }
}

/**
 * @route GET /api/v1/canchas/club/:clubName
 * @description Obtiene la lista de canchas para un club específico.
 * @access Public
 */
async function getCanchasByClubName(req, res) {
    try {
        const { clubName } = req.params;
        const decodedClubName = decodeURIComponent(clubName);
        
        const canchasRaw = await CanchaModel.findAllCanchasConCaracteristicas(decodedClubName);
        
        // Procesamos los resultados para limpiar el JSON y remover nulos
        const canchas = canchasRaw.map(cleanAndParseFeatures);

        if (canchas.length === 0) {
            return res.status(200).json({
                message: `No se encontraron canchas para el club: ${decodedClubName}`,
                data: []
            });
        }

        res.status(200).json({
            message: "Canchas obtenidas exitosamente.",
            data: canchas
        });

    } catch (error) {
        console.error("Error en el controlador al obtener canchas por club:", error.message);
        res.status(500).json({
            message: "Error interno del servidor al procesar la solicitud."
        });
    }
}

module.exports = {
    getCanchasConDetalles,
    getCanchasByClubName
};