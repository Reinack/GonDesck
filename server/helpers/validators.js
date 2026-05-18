const validateStatus = (status, validStates) => {
    if (!validStates.includes(status)) {
        throw {
            status: 400,
            message: `Estado inválido. Estados válidos: ${validStates.join(', ')}`
        };
    }
};

const validatePipelineStage = (stage) => {
    const validStages = ['prospecto', 'contactado', 'propuesta', 'negociando', 'ganado', 'perdido'];
    validateStatus(stage, validStages);
};

const validateMeetingStatus = (status) => {
    const validStatuses = ['programada', 'realizada', 'cancelada'];
    validateStatus(status, validStatuses);
};

const validateBudgetStatus = (status) => {
    const validStatuses = ['borrador', 'enviado', 'aceptado', 'rechazado', 'vencido'];
    validateStatus(status, validStatuses);
};

const validateFinanceType = (tipo) => {
    if (!['ingreso', 'gasto'].includes(tipo)) {
        throw {
            status: 400,
            message: 'Tipo inválido. Debe ser "ingreso" o "gasto"'
        };
    }
};

const validateRequired = (fields, data) => {
    const missing = fields.filter(field => !data[field]);
    if (missing.length > 0) {
        throw {
            status: 400,
            message: `Campos requeridos: ${missing.join(', ')}`
        };
    }
};

module.exports = {
    validateStatus,
    validatePipelineStage,
    validateMeetingStatus,
    validateBudgetStatus,
    validateFinanceType,
    validateRequired
};
