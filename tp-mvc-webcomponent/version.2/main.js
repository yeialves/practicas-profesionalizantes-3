import {wcCalculatorModel} from './WCCalculatorModel.js';
import {wcCalculatorView} from './WCCalculatorView.js';

// Función principal para inicializar el componente
function main() {
    const modelComponent = new wcCalculatorModel();
    const viewComponent = new wcCalculatorView(modelComponent);
    document.body.appendChild(viewComponent);
}

// Ejecuta la función principal cuando se carga la página
window.onload = main;

export{main};