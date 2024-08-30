import {wcCalculatorController} from './WCCalculatorController.js';


// Clase de vista que define el componente personalizado
class wcCalculatorView extends HTMLElement {
    constructor(modelComponent) {
        super();
        // Crea un controlador para manejar la lógica de la calculadora
        this._innerControler = new wcCalculatorController(this, modelComponent);
        this._table = document.createElement('table');

        // Crea las filas y celdas de la tabla
        this._firstRow = this._table.insertRow();
        this._inputCell = this._firstRow.insertCell();
        this._inputCell.setAttribute('colspan', 4);

		this._secondRow = this._table.insertRow();
        this._button7Cell = this._secondRow.insertCell();
        this._button8Cell = this._secondRow.insertCell();
        this._button9Cell = this._secondRow.insertCell();
        this._buttonPlusCell = this._secondRow.insertCell();

        this._thirdRow = this._table.insertRow();
        this._button4Cell = this._thirdRow.insertCell();
        this._button5Cell = this._thirdRow.insertCell();
        this._button6Cell = this._thirdRow.insertCell();
        this._buttonMinusCell = this._thirdRow.insertCell();

        this._fourthRow = this._table.insertRow();
        this._button1Cell = this._fourthRow.insertCell();
        this._button2Cell = this._fourthRow.insertCell();
        this._button3Cell = this._fourthRow.insertCell();
        this._buttonProductCell = this._fourthRow.insertCell();

        this._fifthRow = this._table.insertRow();
        this._button0Cell = this._fifthRow.insertCell();
        this._buttonDecimalCell = this._fifthRow.insertCell();
        this._buttonCalculateCell = this._fifthRow.insertCell();
        this._buttonDivideCell = this._fifthRow.insertCell();

        this._sixthRow = this._table.insertRow();
        this._buttonClearCell = this._sixthRow.insertCell();
        this._buttonClearCell.setAttribute('colspan', 4);

        // Crea el campo de entrada para mostrar el resultado
        this._input = document.createElement('input');
        this._input.className = 'displayResult';
        this._input.id = 'display';
        this._input.type = 'text';
        this._input.setAttribute('disabled', true);

        // Crea los botones de la calculadora
        this._button0 = document.createElement('button');
        this._button0.className = 'numButton';
        this._button0.id = 'button0';
        this._button0.innerText = '0';

        this._button1 = document.createElement('button');
        this._button1.className = 'numButton';
        this._button1.id = 'button1';
        this._button1.innerText = '1';

        this._button2 = document.createElement('button');
        this._button2.className = 'numButton';
        this._button2.id = 'button2';
        this._button2.innerText = '2';

        this._button3 = document.createElement('button');
        this._button3.className = 'numButton';
        this._button3.id = 'button3';
        this._button3.innerText = '3';

        this._button4 = document.createElement('button');
        this._button4.className = 'numButton';
        this._button4.id = 'button4';
        this._button4.innerText = '4';

        this._button5 = document.createElement('button');
        this._button5.className = 'numButton';
        this._button5.id = 'button5';
        this._button5.innerText = '5';

        this._button6 = document.createElement('button');
        this._button6.className = 'numButton';
        this._button6.id = 'button6';
        this._button6.innerText = '6';

        this._button7 = document.createElement('button');
        this._button7.className = 'numButton';
        this._button7.id = 'button7';
        this._button7.innerText = '7';

        this._button8 = document.createElement('button');
        this._button8.className = 'numButton';
        this._button8.id = 'button8';
        this._button8.innerText = '8';

        this._button9 = document.createElement('button');
        this._button9.className = 'numButton';
        this._button9.id = 'button9';
        this._button9.innerText = '9';

        this._buttonDecimalPoint = document.createElement('button');
        this._buttonDecimalPoint.className = 'numButton';
        this._buttonDecimalPoint.id = 'buttonDecimalPoint';
        this._buttonDecimalPoint.innerText = '.';

        this._buttonPlus = document.createElement('button');
        this._buttonPlus.className = 'operatorButton';
        this._buttonPlus.innerText = '+';
        this._buttonPlus.id = 'buttonPlus';

        this._buttonMinus = document.createElement('button');
        this._buttonMinus.className = 'operatorButton';
        this._buttonMinus.innerText = '-';
        this._buttonMinus.id = 'buttonMinus';

        this._buttonProduct = document.createElement('button');
        this._buttonProduct.className = 'operatorButton';
        this._buttonProduct.innerText = '*';
        this._buttonProduct.id = 'buttonProduct';

        this._buttonDivide = document.createElement('button');
        this._buttonDivide.className = 'operatorButton';
        this._buttonDivide.innerText = '/';
        this._buttonDivide.id = 'buttonDivision';

        this._buttonCalculate = document.createElement('button');
        this._buttonCalculate.className = 'operatorButton';
        this._buttonCalculate.innerText = '=';
        this._buttonCalculate.id = 'buttonCalculate';

        this._buttonClear = document.createElement('button');
        this._buttonClear.className = 'clearButton';
        this._buttonClear.id = 'buttonClear';
        this._buttonClear.innerText = 'Delete';
    }

	// Método llamado cuando el componente se conecta al DOM
	connectedCallback() {
		this.appendChild(this._table);

		this._inputCell.appendChild(this._input);

		this._button0Cell.appendChild(this._button0);
		this._button1Cell.appendChild(this._button1);
		this._button2Cell.appendChild(this._button2);
		this._button3Cell.appendChild(this._button3);
		this._button4Cell.appendChild(this._button4);
		this._button5Cell.appendChild(this._button5);
		this._button6Cell.appendChild(this._button6);
		this._button7Cell.appendChild(this._button7);
		this._button8Cell.appendChild(this._button8);
		this._button9Cell.appendChild(this._button9);

		this._buttonDecimalCell.appendChild(this._buttonDecimalPoint);
		this._buttonPlusCell.appendChild(this._buttonPlus);
		this._buttonMinusCell.appendChild(this._buttonMinus);
		this._buttonProductCell.appendChild(this._buttonProduct);
		this._buttonDivideCell.appendChild(this._buttonDivide);
		this._buttonCalculateCell.appendChild(this._buttonCalculate);
		this._buttonClearCell.appendChild(this._buttonClear);

		// Asigna eventos de clic a los botones
		this._button0.onclick = function() { this._innerControler.onButton0Click(); }.bind(this);
		this._button1.onclick = function() { this._innerControler.onButton1Click(); }.bind(this);
		this._button2.onclick = function() { this._innerControler.onButton2Click(); }.bind(this);
		this._button3.onclick = function() { this._innerControler.onButton3Click(); }.bind(this);
		this._button4.onclick = function() { this._innerControler.onButton4Click(); }.bind(this);
		this._button5.onclick = function() { this._innerControler.onButton5Click(); }.bind(this);
		this._button6.onclick = function() { this._innerControler.onButton6Click(); }.bind(this);
		this._button7.onclick = function() { this._innerControler.onButton7Click(); }.bind(this);
		this._button8.onclick = function() { this._innerControler.onButton8Click(); }.bind(this);
		this._button9.onclick = function() { this._innerControler.onButton9Click(); }.bind(this);

		this._buttonDecimalPoint.onclick = function() { this._innerControler.onButtonDecimalPointClick(); }.bind(this);
		this._buttonPlus.onclick = function() { this._innerControler.onButtonPlusClick(); }.bind(this);
		this._buttonMinus.onclick = function() { this._innerControler.onButtonMinusClick(); }.bind(this);
		this._buttonProduct.onclick = function() { this._innerControler.onButtonProductClick(); }.bind(this);
		this._buttonDivide.onclick = function() { this._innerControler.onButtonDivisionClick(); }.bind(this);
		this._buttonCalculate.onclick = function() { this._innerControler.onButtonCalculateClick(); }.bind(this);
		this._buttonClear.onclick = function() { this._innerControler.onButtonClearClick(); }.bind(this);
	}

	// Actualiza el campo de entrada añadiendo los datos
	updateInput(data) {
        this._input.value += data;
    }

    // Reemplaza el valor del campo de entrada con nuevos datos
    replaceInput(data) {
        this._input.value = data;
    }

    // Retorna el valor actual del campo de entrada
    getInputValue() {
        return this._input.value;
    }

    // Se llama cuando el componente se desconecta del DOM
    disconnectedCallback() {
        // Remueve los eventos de clic
        this._button0.onclick = null;
        this._button1.onclick = null;
        this._button2.onclick = null;
        this._button3.onclick = null;
        this._button4.onclick = null;
        this._button5.onclick = null;
        this._button6.onclick = null;
        this._button7.onclick = null;
        this._button8.onclick = null;
        this._button9.onclick = null;
        this._buttonDecimalPoint.onclick = null;
        this._buttonPlus.onclick = null;
        this._buttonMinus.onclick = null;
        this._buttonProduct.onclick = null;
        this._buttonDivide.onclick = null;
        this._buttonCalculate.onclick = null;
        this._buttonClear.onclick = null;
    }

    // Métodos requeridos para el ciclo de vida del componente
    adoptedCallback() {}
    attributesChangedCallback(oldValue, newValue) {}
    static get observableAttributes() { return []; }
}

// Define el componente personalizado
customElements.define('x-wc-component-view', wcCalculatorView);

export {wcCalculatorView};