import { CropManager } from './CropManager.js';

export class CharacterController extends EventTarget {
    constructor(model, view) {  
        super();
        this.model = model;
        this.view = view;
        this.cropManager = new CropManager(view, model); 
        this.model.addEventListener('positionchanged', () => this.updateView()); 
        this.model.addEventListener('mapchanged', (event) => this.handleMapChange(event)); 
        this.view.addEventListener('npcProximity', this.handleNpcProximity.bind(this));

        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false, 
        };
        
        this.dialogBox = this.createDialogBox();
        this.missionAccepted = false;
    }

    connect() {
        document.addEventListener('keydown', (event) => this.handleKeyDown(event)); 
        document.addEventListener('keyup', (event) => this.handleKeyUp(event)); 
        document.getElementById('logoutButton').addEventListener('click', () => this.handleLogout()); 
        this.animate(); 
        this.cropManager.startCropGrowth();
        
        // Verificar si el unicornio debe ser visible al inicio
        const activeUser = JSON.parse(localStorage.getItem('activeUser'));
        if (activeUser && activeUser.unicornVisible) {
            this.view.setUnicornVisible(); 
        }
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

    handleNpcProximity(event) {
        const npc = event.detail.npc;
        const activeUser = JSON.parse(localStorage.getItem('activeUser'));
        
        // Si la misión ya fue completada
        if (activeUser && activeUser.missionCompleted) {
            this.displayDialog(
                ['¡Has completado la misión!'],
                [
                    this.createStyledButton('Próximamente más misiones', () => this.hideDialog())
                ]
            );
        } else if (activeUser && activeUser.missionAccepted && !activeUser.missionCompleted) {
            // Si la misión está aceptada pero no completada
            this.showCompleteMissionDialog();
        } else if (!activeUser.missionAccepted) {
            // Si no se ha aceptado la misión aún
            this.showMissionDialog();
        }
    }
    
    createDialogBox() {
        const dialogBox = document.createElement('div');
        dialogBox.classList.add('dialog-box'); 
        dialogBox.style.display = 'none';
        document.body.appendChild(dialogBox);
        return dialogBox;
    }

    displayDialog(messages, buttons = []) {
        this.clearDialog();
        messages.forEach(msg => {
            const p = document.createElement('p');
            p.textContent = msg;
            this.dialogBox.appendChild(p);
        });
        buttons.forEach(btn => this.dialogBox.appendChild(btn));
        this.dialogBox.style.display = 'block';
    }

    hideDialog() {
        this.dialogBox.style.display = 'none';
    }

    createStyledButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.classList.add('styled-button'); 
        button.addEventListener('click', onClick);
        return button;
    }

    clearDialog() {
        this.dialogBox.innerHTML = '';
    }

    checkForMission() {
        const activeUser = JSON.parse(localStorage.getItem('activeUser'));
        if (activeUser && activeUser.missionAccepted && !activeUser.missionCompleted) {
            this.handleMissionCompletion();
        } else if (!activeUser.missionAccepted) {
            this.showMissionDialog();
        }
    }

    showMissionDialog() {
        this.displayDialog(
            [
                '¡Hola, Félix! ¿Quieres agregar una criatura mágica a tu granja?',
                'Para eso, debes juntar 10 zanahorias, 10 choclos, 10 trigos.'
            ],
            [
                this.createStyledButton('Aceptar', () => this.acceptMission()),
                this.createStyledButton('Rechazar', () => this.rejectMission())
            ]
        );
    }

    acceptMission() {
        this.missionAccepted = true;
        const activeUser = JSON.parse(localStorage.getItem('activeUser')) || {};
        activeUser.missionAccepted = true;
        localStorage.setItem('activeUser', JSON.stringify(activeUser));
        this.displayDialog(['¡Genial! Espero tus cultivos.']);
        this.autoHideDialog();
    }

    rejectMission() {
        this.missionAccepted = false;
        this.displayDialog(['Nos vemos cuando me necesites.']);
        this.autoHideDialog();
    }

    showCompleteMissionDialog() {
        this.clearDialog();
        
        const completionPrompt = document.createElement('p');
        completionPrompt.textContent = '¿Quieres completar la misión?';
        this.dialogBox.appendChild(completionPrompt);
    
        const yesButton = this.createStyledButton('Sí', () => this.handleMissionCompletion());
        const noButton = this.createStyledButton('No', () => this.declineCompletion());
    
        this.dialogBox.appendChild(yesButton);
        this.dialogBox.appendChild(noButton);
    
        this.dialogBox.style.display = 'block';
    }

    declineCompletion() {
        this.clearDialog();
        const declineMessage = document.createElement('p');
        declineMessage.textContent = 'Nos vemos cuando estés listo.';
        this.dialogBox.appendChild(declineMessage);
        this.autoHideDialog();
    }
    
    handleMissionCompletion() {
        const activeUser = JSON.parse(localStorage.getItem('activeUser'));
        const inventory = activeUser.inventory || {};
        const carrots = inventory['zanahoria'] || 0; 
        const corn = inventory['choclo'] || 0;      
        const wheat = inventory['trigo'] || 0;      
        const requiredCarrots = 10;
        const requiredCorn = 10;
        const requiredWheat = 10;
    
        if (carrots >= requiredCarrots && corn >= requiredCorn && wheat >= requiredWheat) {
            // Restar los recursos consumidos
            inventory['zanahoria'] -= requiredCarrots;  
            inventory['choclo'] -= requiredCorn;      
            inventory['trigo'] -= requiredWheat;
    
            activeUser.missionCompleted = true;
            activeUser.unicornVisible = true; 
            localStorage.setItem('activeUser', JSON.stringify(activeUser));
    
            this.dispatchEvent(new Event('missionCompleted'));
    
            this.displayDialog(['¡Misión completada! Has ganado una criatura mágica.','Recompensa = ¡Un unicornio!']);
            this.autoHideDialog();
            
            this.view.setUnicornVisible();
            this.view.refreshInventory();
        } else {
            this.displayDialog(['No tienes suficientes recursos para completar la misión.']);
            this.autoHideDialog();
        }
    }
    
    autoHideDialog() {
        setTimeout(() => this.hideDialog(), 3000);
    }

    handleLogout() {
        const activeUser = JSON.parse(localStorage.getItem('activeUser'));
        
        fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'logout', user: activeUser })
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