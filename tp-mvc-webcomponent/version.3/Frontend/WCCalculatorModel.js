class wcCalculatorModel {
    constructor() {}

    async equation(calculation) {
        try {
            const response = await fetch('http://localhost:3000/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ calculation })
            });
            const data = await response.json();
            return data.result;
        } catch (e) {
            return 'Error';
        }
    }
}

export { wcCalculatorModel }
