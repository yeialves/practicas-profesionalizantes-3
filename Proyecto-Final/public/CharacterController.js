export class CharacterController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.model.addEventListener('positionchanged', () => this.updateView()); // Actualiza la vista cuando cambia la posición del personaje
        this.model.addEventListener('mapchanged', (event) => this.handleMapChange(event)); // Escucha el cambio de mapa

        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false, // Estados de las teclas de dirección
        };
    }

    // Conecta los eventos de teclado
    connect() {
        document.addEventListener('keydown', (event) => this.handleKeyDown(event)); // Detecta cuando se presiona una tecla
        document.addEventListener('keyup', (event) => this.handleKeyUp(event)); // Detecta cuando se suelta una tecla
        this.animate(); 
    }

    // Maneja el evento de presionar teclas
    handleKeyDown(event) {
        if (event.key === 'w') this.keys.w = true; 
        if (event.key === 'a') this.keys.a = true; 
        if (event.key === 's') this.keys.s = true; 
        if (event.key === 'd') this.keys.d = true; 
        this.updateDirection();
    }

    // Maneja el evento de soltar teclas
    handleKeyUp(event) {
        if (event.key === 'w')this.keys.w = false;
        if (event.key === 'a') this.keys.a = false; 
        if (event.key === 's') this.keys.s = false; 
        if (event.key === 'd') this.keys.d = false; 

        this.updateDirection(); 
    }

    // Actualiza la dirección según las teclas presionadas
    updateDirection() {
        const x = this.keys.d ? 1 : this.keys.a ? -1 : 0; // Establece la dirección en x
        const y = this.keys.s ? 1 : this.keys.w ? -1 : 0; // Establece la dirección en y
        this.model.setDirection(x, y); // Envía la dirección al modelo
    }

    // Actualiza la vista con el estado del modelo
    updateView() {
        this.view.state = this.model.state; 
    }

    // Función de animación
    animate() {
        this.model.updatePosition(); 
        requestAnimationFrame(() => this.animate()); // Continúa la animación en el siguiente frame
    }

    // Función para manejar el cambio de mapa
    handleMapChange(event) {
        const newMapData = event.detail.mapData;
        this.view.mapData = newMapData; // Actualiza la vista con el nuevo mapa
        this.view.update(); // Llama a la función de actualización para redibujar la pantalla con el nuevo mapa
    }

    
}