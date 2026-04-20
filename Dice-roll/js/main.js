document.addEventListener("DOMContentLoaded", () => {
    const resultText = document.getElementById("result-text");
    const diceLabel = document.getElementById("dice-type-label");
    const buttons = document.querySelectorAll(".dice-btn[data-sides]");

    let lastSides = 6;
    let lastResult = '?';

    let colors = {
        dice: localStorage.getItem('diceColor') || "#cc0000",
        text: localStorage.getItem('textColor') || "#ffffff"
    };

    const colorDiceInput = document.getElementById("color-dice");
    const colorTextInput = document.getElementById("color-text");
    if(colorDiceInput) colorDiceInput.value = colors.dice;
    if(colorTextInput) colorTextInput.value = colors.text;

    const settingsPanel = document.getElementById("settings-panel");
    const logsPanel = document.getElementById("logs-panel");
    const logsList = document.getElementById("logs-list");

    let rollHistory = JSON.parse(localStorage.getItem('rollHistory')) || [];

    function renderLogs() {
        if (rollHistory.length === 0) {
            logsList.innerHTML = `<div class="log-item" style="justify-content: center; opacity: 0.5;">주사위를 굴리지 않았다!</div>`;
            return;
        }
        logsList.innerHTML = rollHistory.map(log => {
            let critClass = "";
            let critText = "";
            let isCritSuccess = false;
            let isCritFail = false;
            if (log.sides === 100) {
                if (log.result === 1) isCritSuccess = true;
                else if (log.result === 100) isCritFail = true;
            } else {
                if (log.result === log.sides) isCritSuccess = true;
                else if (log.result === 1) isCritFail = true;
            }

            if (isCritSuccess) {
                critClass = "log-crit-success";
                critText = " <span class='crit-badge success-badge'>대성공</span>";
            } else if (isCritFail) {
                critClass = "log-crit-fail";
                critText = " <span class='crit-badge fail-badge'>대실패</span>";
            }
            return `<div class="log-item ${critClass}">
                <span class="log-sides">${log.time} &nbsp;&bull;&nbsp; 1d${log.sides}${critText}</span>
                <span class="log-result">${log.result}</span>
            </div>`;
        }).join('');
        
        logsList.scrollTop = logsList.scrollHeight;
    }

    document.getElementById("settings-btn").addEventListener("click", () => {
        logsPanel.classList.add("hidden");
        settingsPanel.classList.remove("hidden");
    });
    document.getElementById("close-settings").addEventListener("click", () => settingsPanel.classList.add("hidden"));
    
    document.getElementById("logs-btn").addEventListener("click", () => {
        settingsPanel.classList.add("hidden");
        renderLogs();
        logsPanel.classList.remove("hidden");
    });
    document.getElementById("close-logs").addEventListener("click", () => logsPanel.classList.add("hidden"));
    
    document.getElementById("clear-logs-btn").addEventListener("click", () => {
        rollHistory = [];
        localStorage.setItem('rollHistory', JSON.stringify(rollHistory));
        renderLogs();
    });

    function hexToRgba(hex, alpha) {
        if(hex.length === 4) hex = "#" + hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3];
        let r = parseInt(hex.substring(1,3), 16); let g = parseInt(hex.substring(3,5), 16); let b = parseInt(hex.substring(5,7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function updateColors() {
        colors.dice = colorDiceInput.value;
        colors.text = colorTextInput.value;
        localStorage.setItem('diceColor', colors.dice);
        localStorage.setItem('textColor', colors.text);
        
        const root = document.documentElement;
        root.style.setProperty('--theme-base', darkenHex(colors.dice, 130));
        root.style.setProperty('--theme-mid', darkenHex(colors.dice, 100));
        root.style.setProperty('--theme-high', darkenHex(colors.dice, 80));
        root.style.setProperty('--panel-bg', hexToRgba(darkenHex(colors.dice, 150), 0.6));
        
        root.style.setProperty('--btn-light', lightenHex(colors.dice, 30));
        root.style.setProperty('--btn-dark', darkenHex(colors.dice, 20));
        root.style.setProperty('--btn-light-hover', lightenHex(colors.dice, 50));
        root.style.setProperty('--btn-dark-hover', colors.dice);
        root.style.setProperty('--btn-shadow', hexToRgba(colors.dice, 0.3));
        root.style.setProperty('--btn-shadow-hover', hexToRgba(colors.dice, 0.4));
        root.style.setProperty('--theme-text', colors.text);
        
        if (lastSides === 100 && lastResult !== '?') {
            let tens = Math.floor(lastResult / 10);
            let ones = lastResult % 10;
            if (lastResult === 100) { tens = 0; ones = 0; }
            resultText.innerHTML = getDiceShape(10, tens + "0") + getDiceShape(10, ones);
            resultText.classList.add("double");
        } else {
            resultText.innerHTML = getDiceShape(lastSides, lastResult);
            resultText.classList.remove("double");
        }
    }

    if(colorDiceInput) colorDiceInput.addEventListener("input", updateColors);
    if(colorTextInput) colorTextInput.addEventListener("input", updateColors);

    function darkenHex(hex, amount) {
        if(hex.length === 4) hex = "#" + hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3];
        let r = parseInt(hex.substring(1,3), 16); let g = parseInt(hex.substring(3,5), 16); let b = parseInt(hex.substring(5,7), 16);
        return `#${Math.max(0,r-amount).toString(16).padStart(2,'0')}${Math.max(0,g-amount).toString(16).padStart(2,'0')}${Math.max(0,b-amount).toString(16).padStart(2,'0')}`;
    }
    function lightenHex(hex, amount) {
        if(hex.length === 4) hex = "#" + hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3];
        let r = parseInt(hex.substring(1,3), 16); let g = parseInt(hex.substring(3,5), 16); let b = parseInt(hex.substring(5,7), 16);
        return `#${Math.min(255,r+amount).toString(16).padStart(2,'0')}${Math.min(255,g+amount).toString(16).padStart(2,'0')}${Math.min(255,b+amount).toString(16).padStart(2,'0')}`;
    }

    // Default init drawing
    setTimeout(() => { 
        updateColors(); 
        if (lastResult === '?') resultText.innerHTML = getDiceShape(6, '?'); 
    }, 50);

    function createPips(number) {
        const dotCoords = {
            1: ['50,50'],
            2: ['25,25', '75,75'],
            3: ['25,25', '50,50', '75,75'],
            4: ['25,25', '25,75', '75,25', '75,75'],
            5: ['25,25', '25,75', '50,50', '75,25', '75,75'],
            6: ['25,20', '25,50', '25,80', '75,20', '75,50', '75,80']
        };
        const coords = dotCoords[number] || dotCoords[1];
        return coords.map(c => {
            const [cx, cy] = c.split(',');
            return `<circle cx="${cx}" cy="${cy}" r="9" fill="${colors.text}" filter="url(#drop-shadow)" />`;
        }).join('');
    }

    function getDiceShape(sides, result) {
        const svgStart = `<svg viewBox="0 0 100 100" width="160" height="160" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 15px 10px rgba(0,0,0,0.4)); flex-shrink: 0;">`;
        const defs = `
            <defs>
                <radialGradient id="diceGrad" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stop-color="${lightenHex(colors.dice, 80)}"/>
                    <stop offset="40%" stop-color="${lightenHex(colors.dice, 30)}"/>
                    <stop offset="100%" stop-color="${colors.dice}"/>
                </radialGradient>
                <filter id="drop-shadow">
                    <feDropShadow dx="0" dy="2" stdDeviation="1" flood-color="#000" flood-opacity="0.8"/>
                </filter>
                <filter id="glassBevel" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
                    <feOffset dx="-3" dy="-3" result="offsetBlur"/>
                    <feComposite in="SourceGraphic" in2="offsetBlur" operator="arithmetic" k2="1" k3="-0.7" result="highlight"/>
                    <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0"/>
                </filter>
            </defs>`;
            
        let shape = '';
        let textSize = 34; 
        let textY = sides === 4 ? 62 : 52;
        
        if (sides === 6) textSize = 0;
        
        let text = textSize > 0 ? `<text x="50" y="${textY}" dominant-baseline="middle" font-family="'Outfit', sans-serif" font-size="${textSize}" font-weight="900" text-anchor="middle" fill="${colors.text}" filter="url(#drop-shadow)">${result}</text>` : '';

        if (sides === 6) {
            shape = `<rect x="8" y="8" width="84" height="84" rx="14" fill="url(#diceGrad)" filter="url(#glassBevel)"/>`;
            text = createPips(result);
        } else if (sides === 4) {
            shape = `<polygon points="50,12 92,86 8,86" fill="url(#diceGrad)" filter="url(#glassBevel)"/>`;
        } else if (sides === 10) {
            shape = `<polygon points="50,5 90,45 50,90 10,45" fill="url(#diceGrad)" filter="url(#glassBevel)"/>`;
        } else if (sides === 12) {
            shape = `<polygon points="50,6 88,34 74,86 26,86 12,34" fill="url(#diceGrad)" filter="url(#glassBevel)"/>`;
        } else if (sides === 20) {
            shape = `<polygon points="50,4 88,26 88,74 50,96 12,74 12,26" fill="url(#diceGrad)" filter="url(#glassBevel)"/>`;
        }

        return svgStart + defs + shape + text + `</svg>`;
    }

    function rollDice(sides) {
        lastSides = sides;
        const result = Math.floor(Math.random() * sides) + 1;
        lastResult = result;
        
        // Setup history log
        const timeStr = new Date().toLocaleTimeString('ko-KR', {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'});
        rollHistory.push({ sides: sides, result: result, time: timeStr });
        if (rollHistory.length > 50) rollHistory.shift();
        localStorage.setItem('rollHistory', JSON.stringify(rollHistory));
        
        // Auto-update history panel
        renderLogs();

        // Remove animation classes to reset
        resultText.classList.remove("animate-roll");
        document.body.classList.remove("flash-success", "flash-failure");
        
        const effectContainer = document.getElementById("effect-container");
        const effectMessage = document.getElementById("effect-message");
        effectContainer.className = "effect-overlay"; 
        
        // Force a browser reflow
        void resultText.offsetWidth;
        
        // Update DOM elements differently for 1d100
        if (sides === 100) {
            let tens = Math.floor(result / 10);
            let ones = result % 10;
            if (result === 100) { tens = 0; ones = 0; }
            resultText.innerHTML = getDiceShape(10, tens + "0") + getDiceShape(10, ones);
            resultText.classList.add("double");
        } else {
            resultText.innerHTML = getDiceShape(sides, result);
            resultText.classList.remove("double");
        }
        
        diceLabel.textContent = `1d${sides} 굴림 완료!`;
        
        // Trigger the animation
        resultText.classList.add("animate-roll");
        
        let isCritSuccess = false;
        let isCritFail = false;
        if (sides === 100) {
            if (result === 1) isCritSuccess = true;
            else if (result === 100) isCritFail = true;
        } else {
            if (result === sides) isCritSuccess = true;
            else if (result === 1) isCritFail = true;
        }

        // Setup Extreme Result Effects
        if (isCritSuccess) {
            effectMessage.textContent = "대성공!";
            effectContainer.classList.add("active", "critical-success");
            document.body.classList.add("flash-success");
        } else if (isCritFail) {
            effectMessage.textContent = "대실패!";
            effectContainer.classList.add("active", "critical-failure");
            document.body.classList.add("flash-failure");
        }
        
        // Reset effects afterwards
        clearTimeout(window.effectTimeout);
        if (isCritSuccess || isCritFail) {
            window.effectTimeout = setTimeout(() => {
                effectContainer.classList.remove("active");
                setTimeout(() => { effectContainer.className = "effect-overlay"; }, 300);
            }, 2000);
        }
    }

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const sides = parseInt(button.dataset.sides, 10);
            rollDice(sides);
            
            // Interaction feedback
            button.style.transform = "scale(0.92)";
            setTimeout(() => {
                button.style.transform = "";
            }, 150);
        });
    });
});
