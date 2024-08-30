class AnimatedCharacter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Crear un estilo para el shadow DOM
        const style = document.createElement('style');
        style.textContent = `
            @keyframes play-animation {
                from { background-position: 0px; }
                to { background-position: -256px; } /* -64px * número de frames */
            }

            .character {
                width: 64px;
                height: 64px;
                background-repeat: no-repeat;
                animation: play-animation 1s steps(4) infinite;
                position: absolute;
                transition: transform 0.2s linear;
            }

            .walk-right {
                background-image: url("assets/Felix-Walk-Right-Sheet-64x64.png");
            }

            .walk-left {
                background-image: url("assets/Felix-Walk-Left-Sheet-64x64.png");
            }

            .walk-front {
                background-image: url("assets/Felix-Walk-Front-Sheet-64x64.png");
            }

            .walk-back {
                background-image: url("assets/Felix-Walk-Back-Sheet-64x64.png");
            }
        `;

        // Crear el contenedor del personaje
        this.container = document.createElement('div');
        this.container.classList.add('character');

        // Adjuntar el estilo y el contenedor al shadow DOM
        this.shadowRoot.append(style, this.container);

        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.speed = 2; // Velocidad de movimiento
        this.isMoving = false;

        // Escuchar eventos de clic para movimiento
        document.getElementById('game-container').addEventListener('click', this.setTargetPosition.bind(this));

        // Iniciar el loop de animación
        this.animate();
    }

    // Establecer la posición objetivo al hacer clic
    setTargetPosition(event) {
        const rect = document.getElementById('game-container').getBoundingClientRect();
        this.targetX = event.clientX - rect.left - 32; // Ajuste para centrar el personaje
        this.targetY = event.clientY - rect.top - 32;  // Ajuste para centrar el personaje
        this.isMoving = true;

        // Actualizar la clase de animación según la dirección
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        if (Math.abs(dx) > Math.abs(dy)) {
            // Movimiento horizontal
            if (dx > 0) {
                this.setAnimationClass('walk-right');
            } else {
                this.setAnimationClass('walk-left');
            }
        } else {
            // Movimiento vertical
            if (dy > 0) {
                this.setAnimationClass('walk-front');
            } else {
                this.setAnimationClass('walk-back');
            }
        }
    }

    // Método para establecer la clase de animación
    setAnimationClass(className) {
        this.container.className = 'character ' + className;
    }

    // Animar el movimiento del personaje
    animate() {
        if (this.isMoving) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.speed) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.isMoving = false;
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }

            this.container.style.transform = `translate(${this.x}px, ${this.y}px)`;
        }

        requestAnimationFrame(this.animate.bind(this));
    }
}

customElements.define('animated-character', AnimatedCharacter);

// Agregar el personaje animado al contenedor del juego
document.getElementById('game-container').appendChild(document.createElement('animated-character'));
