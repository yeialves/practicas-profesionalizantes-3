class CharacterView extends HTMLElement {
    constructor(drawingContext) {
        super();
        this.drawingContext = drawingContext;
        this.currentState = null;
    }

    set state(newState) {
        this.currentState = newState;
        this.update();
    }

    get state() {
        return this.currentState;
    }

    update() {
        this.drawingContext.clearRect(0, 0, this.drawingContext.canvas.width, this.drawingContext.canvas.height);
        
        // Redibujar el mapa antes de dibujar el personaje
        if (this.mapData) {
            this.drawMap(this.mapData, this.drawingContext, 64);  
        }

        const img = new Image();
        img.src = this.state.sprite;
        this.drawingContext.drawImage(
            img,
            this.state.frame * 64, 0, 64, 64,
            this.state.position_x, this.state.position_y, 64, 64 // Dibujar el personaje en la posición correcta
        );
    }

    drawMap(mapData, context, tileSize) {
        const layers = mapData.layers;
        const width = mapData.width;
        const height = mapData.height;
        const tilesetImage = document.getElementById('tiles');
        const tilesetWidth = tilesetImage.width / tileSize; // Calcular cuántos tiles caben en el ancho del tileset
        
        layers.forEach(layer => {
            if (layer.type === 'tilelayer') {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const tileIndex = layer.data[y * width + x];
                        if (tileIndex > 0) {
                             // Calcula la posición del tile dentro del conjunto de tiles 
                            const tileX = (tileIndex - 1) % tilesetWidth;
                            const tileY = Math.floor((tileIndex - 1) / tilesetWidth);
                            
                             // Dibuja el tile en la posición correcta del canvas.
                            context.drawImage(
                                tilesetImage, 
                                tileX * tileSize, tileY * tileSize, tileSize, tileSize,
                                x * tileSize, y * tileSize, tileSize, tileSize
                            );
                        }
                    }
                }
            }
        });
    }    
    
}

customElements.define('character-view', CharacterView);


class CharacterModel extends EventTarget {
    constructor() {
        super();
        this.state = {
            width: 64,
            height: 64,
            position_x: 0,
            position_y: 0,
            frame: 0,
            speed: 3,
        };
        this.targetX = 0;
        this.targetY = 0;
        this.isMoving = false;
    }

    setTargetPosition(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.isMoving = true;
    }

    updatePosition() {
		if (this.isMoving) {
			const dx = this.targetX - this.state.position_x;
			const dy = this.targetY - this.state.position_y;
			const distance = Math.sqrt(dx * dx + dy * dy);
	
			// Determinar la dirección del movimiento
			if (Math.abs(dx) > Math.abs(dy)) {
				// Movimiento horizontal
				if (dx > 0) {
					this.state.sprite = 'assets/Felix-Walk-Right-Sheet-64x64.png';
				} else {
					this.state.sprite = 'assets/Felix-Walk-Left-Sheet-64x64.png';
				}
			} else {
				// Movimiento vertical
				if (dy > 0) {
					this.state.sprite = 'assets/Felix-Walk-Front-Sheet-64x64.png';
				} else {
					this.state.sprite = 'assets/Felix-Walk-Back-Sheet-64x64.png';
				}
			}
	
			if (distance < this.state.speed) {
				this.state.position_x = this.targetX;
				this.state.position_y = this.targetY;
				this.isMoving = false;
			} else {
				this.state.position_x += (dx / distance) * this.state.speed;
				this.state.position_y += (dy / distance) * this.state.speed;
			}
	
			// Cambiar frame para la animación
			this.frameCounter = (this.frameCounter || 0) + 1;
			if (this.frameCounter % 10 === 0) { 
				this.state.frame = (this.state.frame + 1) % 4;
			}
	
			this.dispatchEvent(new CustomEvent('positionchanged'));
		}
	}

    async loadMap(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to load map: ' + response.statusText);
        }
        const mapData = await response.json();
        return mapData;
    }
}

class CharacterController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.model.addEventListener('positionchanged', () => this.updateView());
    }

    connect() {
        document.getElementById('game-container').addEventListener('click', (event) => {
            const rect = document.getElementById('game-container').getBoundingClientRect();
            const targetX = event.clientX - rect.left - 32;
            const targetY = event.clientY - rect.top - 32;
            this.model.setTargetPosition(targetX, targetY);
        });

        this.animate();
    }

    updateView() {
        this.view.state = this.model.state;
    }

    animate() {
        this.model.updatePosition();
        requestAnimationFrame(() => this.animate());
    }
}

async function main() {
    let canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.border = "1px solid black";

    document.getElementById('game-container').appendChild(canvas);
    
    const context = canvas.getContext('2d');
    
    let characterModel = new CharacterModel();
    let characterView = new CharacterView(context);
    let characterController = new CharacterController(characterModel, characterView);

    try {
        const mapData = await characterModel.loadMap('mapa.tmj'); 
        const tileSize = 64; 
        characterView.mapData = mapData; 
        characterView.drawMap(mapData, context, tileSize);
    } catch (error) {
        console.error('Error loading map:', error);
    }

    characterController.connect();
}

window.onload = main;