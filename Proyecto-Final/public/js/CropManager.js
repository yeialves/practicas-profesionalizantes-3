export class CropManager {
    constructor(view, model, activeUser) { // Asegúrate de pasar el usuario activo al constructor
        this.view = view;
        this.model = model;
        this.activeUser = activeUser; // Almacena el usuario activo
        this.cropStage = 'initial';
        this.cropGrowthTimer = 0;
        this.growthInterval = null;
        this.proximityRange = 50;
    }

    startCropGrowth() {
        this.growthInterval = setInterval(() => {
            this.cropGrowthTimer += 1;
            console.log(`Timer: ${this.cropGrowthTimer}, Stage: ${this.cropStage}`);

            if (this.cropGrowthTimer >= 10 && this.cropStage === 'initial') {
                this.cropStage = 'intermediate'; 
                this.updateCultivoImages(); 
            }

            if (this.cropGrowthTimer >= 20 && this.cropStage === 'intermediate') {
                this.cropStage = 'full'; 
                this.updateCultivoImages(); 
                clearInterval(this.growthInterval);
                console.log('Cultivos alcanzaron su etapa completa, temporizador detenido.');
            }
        }, 1000);
    }
    
    checkProximity() {
        const minX = 704;
        const maxX = 1152; 
        const minY = 512;
        const maxY = 640; 
    
        const characterX = this.model.state.position_x;
        const characterY = this.model.state.position_y;
    
        const isCloseToCrops = (
            characterX >= minX - this.proximityRange && characterX <= maxX + this.proximityRange &&
            characterY >= minY - this.proximityRange && characterY <= maxY + this.proximityRange
        );

        if (isCloseToCrops && this.cropStage === 'full') {
            console.log('Cosecha disponible, estás cerca de los cultivos.');
            return true;
        }
        return false;
    }    
    
    collectCrops() {
        console.log('Recolectando cultivos...');
        clearInterval(this.growthInterval);
    
        // Generar un número total aleatorio entre 12 y 24
        const totalCrops = Math.floor(Math.random() * 13) + 12; 
        const crops = ['zanahoria', 'choclo', 'trigo'];
        const counts = { 'zanahoria': 0, 'choclo': 0, 'trigo': 0 };
    
        counts['zanahoria'] = 4;
        counts['choclo'] = 4;
        counts['trigo'] = 4;
    
        // Calcular los cultivos restantes a repartir
        const remainingCrops = totalCrops - 12; // Restar los 12 ya contados (4 de cada tipo)
    
        // Repartir los cultivos restantes de manera aleatoria entre los tres tipos
        for (let i = 0; i < remainingCrops; i++) {
            const randomCrop = crops[Math.floor(Math.random() * crops.length)];
            counts[randomCrop]++;
        }
    
        // Asegurar que ningún tipo exceda el máximo de 8
        for (let crop of crops) {
            counts[crop] = Math.min(counts[crop], 8);
        }
    
        // Crear marcador de recolección para cada tipo con un índice único
        let index = 0;
        for (let [crop, count] of Object.entries(counts)) {
            if (count > 0) {
                this.showCollectionMarker(crop, count, index);
                index++;  // Incrementar el índice para la siguiente posición
            }
        }
    
        // Guardar los cultivos recolectados en el inventario del usuario activo
        let activeUser = JSON.parse(localStorage.getItem('activeUser'));
        if (activeUser && activeUser.inventory) {
            // Si el cultivo ya existe en el inventario, se suma la cantidad
            for (let crop in counts) {
                if (activeUser.inventory[crop]) {
                    activeUser.inventory[crop] += counts[crop];
                } else {
                    activeUser.inventory[crop] = counts[crop];
                }
            }
            localStorage.setItem('activeUser', JSON.stringify(activeUser));
            console.log('Inventario actualizado:', activeUser.inventory);
        }
    
        // Reiniciar estado de cultivo
        this.cropStage = 'initial';
        this.cropGrowthTimer = 0;
        this.updateCultivoImages();
        this.startCropGrowth();
    }
    

    showCollectionMarker(cropType, count, index) {
        const marker = document.createElement('div');
        marker.style.position = 'absolute';
    
        const canvas = document.querySelector('canvas');
        const canvasRect = canvas.getBoundingClientRect();
    
        const canvasCenterX = canvasRect.left + canvasRect.width / 2;
        const canvasCenterY = canvasRect.top + canvasRect.height / 2;
    
        const offsetX = 80; 
    
        // Ajuste adicional para que estén más a la izquierda y más abajo
        const leftAdjustment = -100; 
        const topAdjustment = 130; 
    
        // Posicionar los marcadores en el centro del canvas con ajustes
        marker.style.left = `${canvasCenterX + (index * offsetX) + leftAdjustment}px`;
        marker.style.top = `${canvasCenterY + topAdjustment}px`;
    
        marker.style.padding = '5px';
        marker.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        marker.style.borderRadius = '5px';
        marker.style.color = 'white';
        marker.style.fontSize = '14px';
        marker.style.display = 'flex';
        marker.style.alignItems = 'center';
    
        // Crear imagen de cultivo
        const cropImage = document.createElement('img');
        cropImage.src = `/assets/${cropType}.png`;
        cropImage.style.width = '20px';
        cropImage.style.height = '20px';
        cropImage.style.marginRight = '5px';
    
        // Texto de cantidad recolectada
        const text = document.createElement('span');
        text.textContent = `+${count}`;
    
        marker.appendChild(cropImage);
        marker.appendChild(text);
        document.body.appendChild(marker);
    
        // Animación para desvanecer el marcador
        setTimeout(() => {
            marker.style.transition = 'all 0.5s ease-out';
            marker.style.opacity = '0';
            marker.style.top = `${parseInt(marker.style.top) - 20}px`;
        }, 1000);
    
        setTimeout(() => {
            document.body.removeChild(marker);
        }, 1500);
    }    
    
    updateCultivoImages() {
        console.log('Actualizando imágenes de cultivo...');
        const cultivosLayer = this.view.mapData.layers.find(layer => layer.name === "cultivos-za");
    
        if (cultivosLayer && cultivosLayer.type === 'tilelayer') {
            const tileData = cultivosLayer.data; 
            let tileIndex;
    
            if (this.cropStage === 'intermediate') {
                tileIndex = 100; 
            } else if (this.cropStage === 'full') {
                tileIndex = 28; 
            } else {
                tileIndex = 99; 
            }
    
            for (let i = 0; i < tileData.length; i++) {
                if (tileData[i] === 99 || tileData[i] === 100 || tileData[i] === 28) {
                    tileData[i] = tileIndex;
                }
            }
        }

        const cultivosLayerChoTri = this.view.mapData.layers.find(layer => layer.name === "cultivos-cho-tri");
    
        if (cultivosLayerChoTri && cultivosLayerChoTri.type === 'tilelayer') {
            const tileData = cultivosLayerChoTri.data; 
            let tileIndex;
    
            if (this.cropStage === 'intermediate') {
                tileIndex = 160; 
            } else if (this.cropStage === 'full') {
                tileIndex = 48; 
            } else {
                tileIndex = 99; 
            }
    
            for (let i = 0; i < tileData.length; i++) {
                if (tileData[i] === 99 || tileData[i] === 160 || tileData[i] === 48) {
                    tileData[i] = tileIndex;
                }
            }
        }
    }
}
