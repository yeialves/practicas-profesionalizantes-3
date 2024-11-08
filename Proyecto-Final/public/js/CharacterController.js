import { CropManager } from './CropManager.js';

export class CharacterController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.cropManager = new CropManager(view, model); 
        this.model.addEventListener('positionchanged', () => this.updateView()); 
        this.model.addEventListener('mapchanged', (event) => this.handleMapChange(event)); 

        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false, 
        };

    }
    connect() {
        document.addEventListener('keydown', (event) => this.handleKeyDown(event)); 
        document.addEventListener('keyup', (event) => this.handleKeyUp(event)); 
        document.getElementById('logoutButton').addEventListener('click', () => this.handleLogout()); 
        this.animate(); 
        this.cropManager.startCropGrowth(); 
    }

    handleKeyDown(event) {
        if (event.key === 'w') this.keys.w = true;
        if (event.key === 'a') this.keys.a = true;
        if (event.key === 's') this.keys.s = true;
        if (event.key === 'd') this.keys.d = true;
        this.updateDirection();

        if (this.cropManager.checkProximity() && this.cropManager.cropStage === 'full') {
            this.cropManager.collectCrops();
        }
    }

    handleKeyUp(event) {
        if (event.key === 'w') this.keys.w = false;
        if (event.key === 'a') this.keys.a = false; 
        if (event.key === 's') this.keys.s = false; 
        if (event.key === 'd') this.keys.d = false; 
        this.updateDirection(); 
    }

    updateDirection() {
        const x = this.keys.d ? 1 : this.keys.a ? -1 : 0; 
        const y = this.keys.s ? 1 : this.keys.w ? -1 : 0; 
        this.model.setDirection(x, y); 
    }

    updateView() {
        this.view.state = this.model.state; 
    }

    animate() {
        this.model.updatePosition(); 
        requestAnimationFrame(() => this.animate()); 
    }

    handleMapChange(event) {
        const newMapData = event.detail.mapData;
        this.view.mapData = newMapData; 
        this.view.update(); 
    }

    handleLogout() {
        const activeUser = JSON.parse(localStorage.getItem('activeUser')); 
        
        fetch('/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'logout',
                user: activeUser 
            })
        })
        .then(response => {
            if (response.ok) {
                localStorage.removeItem('activeUser'); 
                window.location.href = '/img/login.html'; 
            } else {
                document.getElementById('logout-message').textContent = 'Error al cerrar sesión.';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('logout-message').textContent = 'Error al cerrar sesión.';
        });
    }    
        
}
