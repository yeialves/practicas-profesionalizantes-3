// Clase controladora que conecta el modelo y la vista
class wcCalculatorController {
	constructor(viewComponent, modelComponent) {
		// Asigna la vista y el modelo a variables internas
		this._viewComponent = viewComponent;
        this._modelComponent = modelComponent;
	}

	// Métodos para manejar los clics de los botones numéricos y de operaciones
	onButton0Click() {   	
		this._viewComponent.updateInput('0');	
	}

	onButton1Click() {   	
		this._viewComponent.updateInput('1');	
	}

	onButton2Click() {   	
		this._viewComponent.updateInput('2');	
	}

	onButton3Click() {   	
		this._viewComponent.updateInput('3');	
	}

	onButton4Click() {   	
		this._viewComponent.updateInput('4');	
	}

	onButton5Click() {   	
		this._viewComponent.updateInput('5');	
	}

	onButton6Click() {   	
		this._viewComponent.updateInput('6');	
	}

	onButton7Click() {   	
		this._viewComponent.updateInput('7');	
	}

	onButton8Click() {   	
		this._viewComponent.updateInput('8');	
	}

	onButton9Click() {   	
		this._viewComponent.updateInput('9');	
	}

	onButtonDecimalPointClick() {   	
		this._viewComponent.updateInput('.');	
	}

	onButtonMinusClick() {   	
		this._viewComponent.updateInput('-');	
	}

	onButtonDivisionClick() {   	
		this._viewComponent.updateInput('/');	
	}

	onButtonProductClick() {   	
		this._viewComponent.updateInput('*');	
	}

	onButtonPlusClick() {   	
		this._viewComponent.updateInput('+');	
	}

	onButtonClearClick() { 
    	this._viewComponent.replaceInput('');
	}

	onButtonCalculateClick() {
        const calculation = this._viewComponent.getInputValue(); 
        const result = this._modelComponent.equation(calculation); 
        this._viewComponent.replaceInput(result); 
	}
}

export {wcCalculatorController};