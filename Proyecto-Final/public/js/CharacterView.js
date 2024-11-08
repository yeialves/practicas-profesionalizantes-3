export class CharacterView extends HTMLElement {
    constructor(drawingContext, characterModel) {
        super();
        this.drawingContext = drawingContext;
        this.characterModel = characterModel; 
        this.currentState = null;
        this.dialogBox = this.createDialogBox();
        this.inventoryBox = this.createInventoryBox(); 
        this.animals = [];
        this.npcs = [];
        
        this.cameraWidth = 640;  
        this.cameraHeight = 480;
        this.loadedImages = {};

        this.frameCounter = 0; // Contador para el control de la animación
        this.idleFrameRate = 10; // Velocidad para chica-idle (ajusta según necesites)
        this.defaultFrameRate = 5; // Velocidad por defecto para otros estados
    
        
        this.showInventory();
    }


    createDialogBox() {
        const dialogBox = document.createElement('div');
        dialogBox.style.position = 'absolute';
        dialogBox.style.bottom = '20px'; 
        dialogBox.style.left = '50%';
        dialogBox.style.transform = 'translateX(-50%)';
        dialogBox.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        dialogBox.style.color = 'white';
        dialogBox.style.padding = '10px';
        dialogBox.style.borderRadius = '5px';
        dialogBox.style.display = 'none'; // Oculto por defecto
        document.body.appendChild(dialogBox);
        return dialogBox;
    }

    showDialog(message) {
        this.dialogBox.innerText = message; 
        this.dialogBox.style.display = 'block'; 

        // Oculta el diálogo después de un tiempo
        setTimeout(() => {
            this.dialogBox.style.display = 'none';
        }, 3000); // Ajusta el tiempo según necesites
    }

    

   
    createInventoryBox() {
        const inventoryBox = document.createElement('div');
        inventoryBox.style.position = 'absolute';
        inventoryBox.style.top = '20px'; // Parte superior de la pantalla
        inventoryBox.style.left = '50%';
        inventoryBox.style.transform = 'translateX(-50%)';
        inventoryBox.style.backgroundColor = '#6b4006'; // Marrón
        inventoryBox.style.color = 'white';
        inventoryBox.style.padding = '10px';
        inventoryBox.style.borderRadius = '15px'; 
        inventoryBox.style.border = '4px solid #f81aa6 '; 
        inventoryBox.style.fontFamily = '"Pixelify Sans", sans-serif'; // Fuente personalizada
        document.body.appendChild(inventoryBox); // Siempre visible, sin `display: none`
        return inventoryBox;
    }

// Método para mostrar el cuadro de inventario con el contenido del localStorage
showInventory() {
    let activeUser = JSON.parse(localStorage.getItem('activeUser'));

    if (activeUser && activeUser.inventory) {
        const inventoryItems = Object.entries(activeUser.inventory)
            .map(([crop, count]) => `${crop}: ${count}`)
            .join(', ');
        
        this.inventoryBox.innerText = `INVENTARIO: ${inventoryItems}`;
    } else {
        this.inventoryBox.innerText = "Inventario vacío";
        console.log("No hay usuario activo o el inventario está vacío.");
    }
}

// Método para refrescar y mostrar el inventario al actualizarlo
refreshInventory() {
    this.showInventory(); // Llama a showInventory para mostrar el inventario actualizado
}


    set state(newState) {
        this.currentState = newState;
        this.update();
    }

    get state() {
        return this.currentState;
    }

    setMapData(mapData) {
    this.mapData = mapData;
    this.shouldDrawAnimalsAndNpcs = (mapData.fileName === '/maps/mapa.tmj');
    }


    update() {
        this.drawingContext.clearRect(0, 0, this.drawingContext.canvas.width, this.drawingContext.canvas.height);
    
        if (this.mapData) {
            this.drawMap(this.mapData, this.drawingContext, 64);
        }
    
        // Dibuja el personaje principal
        if (this.state) {
            this.drawCharacter(this.state);
        }
    
        // Verifica si el mapa actual es 'mapa.tmj' antes de dibujar animales y NPCs
        if (this.mapData && this.mapData.fileName === '/maps/mapa.tmj') {
            // Dibuja animales
            this.animals.forEach(animal => {
                if (animal && animal.state) {
                    this.drawCharacter(animal.state);
                }
            });
    
            // Dibuja NPCs siempre
            this.npcs.forEach(npc => {
                npc.updateIdleState(); // Asegúrate de que el NPC actualice su estado
                this.drawCharacter(npc.state); // Dibuja el NPC aquí
    
                // Verifica la proximidad y muestra el diálogo
                if (npc.checkProximity(this.characterModel)) {
                    this.showDialog(`${npc.NpcType} : Holis Felix.`);
                }
            });
        }
    }    
    

    drawCharacter(state) {
        let img = this.loadedImages[state.sprite];
        if (!img) {
            img = new Image();
            img.src = state.sprite;
            this.loadedImages[state.sprite] = img;
    
            // Dibuja la imagen solo después de que se haya cargado
            img.onload = () => {
                this.renderCharacter(state, img);
            };
        } else {
            this.renderCharacter(state, img);
        }
    
        // Si la imagen ya está cargada, dibuja inmediatamente
        if (img.complete) {
            this.renderCharacter(state, img);
        }
    }
    
    renderCharacter(state, img) {
        const relativeX = state.position_x - (this.state.position_x - this.cameraWidth / 2);
        const relativeY = state.position_y - (this.state.position_y - this.cameraHeight / 2);
    
        const width = state.width || 64;
        const height = state.height || 64;
    
        this.drawingContext.drawImage(
            img,
            state.frame * width, 0, width, height, 
            relativeX, relativeY, width, height
        );
    }

    addAnimal(animalModel) {
        this.animals.push(animalModel);
    }

    addNpc(NpcModel) { // Añade NPC a la lista
        this.npcs.push(NpcModel);
    }

    drawMap(mapData, context, tileSize) {
        const layers = mapData.layers;
        const width = mapData.width;
        const height = mapData.height;
        const tilesetImage = document.getElementById('tiles');
        const tilesetWidth = tilesetImage.width / tileSize;

        const cameraX = this.state.position_x - this.cameraWidth / 2;
        const cameraY = this.state.position_y - this.cameraHeight / 2;

        layers.forEach(layer => {
            if (layer.type === 'tilelayer' && layer.name !== 'collision' && layer.name !== 'animalCollision' && layer.name !== 'rabbitCollision') {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const tileIndex = layer.data[y * width + x];
                        if (tileIndex > 0) {
                            const tileX = (tileIndex - 1) % tilesetWidth;
                            const tileY = Math.floor((tileIndex - 1) / tilesetWidth);

                            const tilePosX = x * tileSize;
                            const tilePosY = y * tileSize;

                            if (
                                tilePosX + tileSize > cameraX && tilePosX < cameraX + this.cameraWidth &&
                                tilePosY + tileSize > cameraY && tilePosY < cameraY + this.cameraHeight
                            ) {
                                context.drawImage(
                                    tilesetImage, 
                                    tileX * tileSize, tileY * tileSize, tileSize, tileSize, 
                                    tilePosX - cameraX, tilePosY - cameraY, tileSize, tileSize
                                );
                            }
                        }
                    }
                }
            }
        });
    }
}
// Función para cargar Google Fonts desde JavaScript
function loadGoogleFont() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&display=swap';
    document.head.appendChild(link);
}

// Llamamos a la función para cargar la fuente
loadGoogleFont();
// Registra el componente 'character-view' para el DOM
customElements.define('character-view', CharacterView);