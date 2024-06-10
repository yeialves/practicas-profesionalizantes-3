// Clase modelo que maneja la lógica de cálculo
class wcCalculatorModel {
    constructor() {}

    // Método para evaluar la ecuación y devolver el resultado
    equation(calculation) {
        try {
            return eval(calculation); // Evalúa la ecuación
        } catch (e) {
            return 'Error'; // Devuelve 'Error' si hay una excepción
        }
    }
}

export {wcCalculatorModel};