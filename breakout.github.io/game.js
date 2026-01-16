// Game State
const state = {
    currentScene: 'start',
    inventory: [],
    flags: {
        doorUnlocked: false,
        boxUnlocked: false,
        hasKey: false,
        hasKnife: false,
        seenGhost: false
    }
};

// Functions
function log(text) {
    const p = document.createElement('p');
    p.innerText = text;
    p.style.opacity = 0;
    p.style.transition = 'opacity 0.5s';
    document.getElementById('text-log').appendChild(p);

    void p.offsetWidth;
    p.style.opacity = 1;

    const logArea = document.getElementById('text-log');
    logArea.scrollTop = logArea.scrollHeight;
}

function inventoryAdd(itemName) {
    state.inventory.push(itemName);
    renderInventory();
}

function renderInventory() {
    const list = document.getElementById('inventory-list');
    list.innerHTML = '';
    state.inventory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'inventory-item';
        div.innerText = item;
        div.addEventListener('click', () => {
            document.querySelectorAll('.inventory-item').forEach(i => i.classList.remove('selected'));
            div.classList.add('selected');

            if (item === 'Entrance Key') {
                log("玄関の鍵だ。これがあれば脱出できるかもしれない。");
                state.flags.doorUnlocked = true;
            }
        });
        list.appendChild(div);
    });
}

function triggerEffect(type) {
    const layer = document.getElementById('effect-layer');
    if (type === 'flash') {
        const div = document.createElement('div');
        div.className = 'jumpscare-flash';
        div.style.width = '100%';
        div.style.height = '100%';
        layer.appendChild(div);
        setTimeout(() => div.remove(), 200);
    }
}

function endGame(win) {
    if (win) {
        document.getElementById('visual-content').style.background = 'white';
        document.getElementById('interactables-layer').innerHTML = '';
        log("扉が開いた！外の光が眩しい... 脱出成功だ！");
        setTimeout(() => {
            alert("CONGRATULATIONS! YOU ESCAPED!");
            location.reload();
        }, 2000);
    }
}

// Scene Definitions
const scenes = {
    'start': {
        description: "目を覚ますと、冷たい床の上だった。ここはどこだ...？",
        visual: "url('bg_start_1767493724206.png')",
        interactables: [
            {
                text: "立ち上がる",
                style: { top: '50%', left: '45%', width: '10%', height: '10%', border: '1px solid #555', background: 'rgba(34, 34, 34, 0.8)', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '5px', cursor: 'pointer' },
                action: () => changeScene('mainHall')
            }
        ]
    },
    'mainHall': {
        description: "広間だ。古びたシャンデリアが揺れている。正面に大きな扉、左に書斎、右に食堂がある。",
        visual: "url('bg_main_hall_1767493741394.png')",
        interactables: [
            {
                id: 'door-front',
                style: { top: '20%', left: '40%', width: '20%', height: '40%', border: '2px solid rgba(255,0,0,0.1)' },
                action: () => {
                    if (state.flags.doorUnlocked) {
                        endGame(true);
                    } else {
                        log("扉には鍵がかかっている。");
                    }
                }
            },
            {
                text: "Library >>",
                style: { top: '40%', left: '2%', width: '15%', height: '50%', border: '1px solid rgba(255,255,255,0.2)', color: '#ddd', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.5)' },
                action: () => changeScene('library')
            },
            {
                text: "Dining >>",
                style: { top: '40%', right: '2%', width: '15%', height: '50%', border: '1px solid rgba(255,255,255,0.2)', color: '#ddd', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.5)' },
                action: () => changeScene('diningRoom')
            }
        ]
    },
    'library': {
        description: "書斎。埃っぽい本の匂いがする。",
        visual: "url('bg_library_1767493756783.png')",
        interactables: [
            {
                text: "<< Back",
                style: { bottom: '5%', left: '45%', width: '10%', height: '5%', background: 'rgba(0,0,0,0.7)', textAlign: 'center', color: 'white', borderRadius: '5px' },
                action: () => changeScene('mainHall')
            },
            {
                id: 'desk-box',
                style: { top: '55%', left: '45%', width: '15%', height: '15%', background: 'rgba(50, 20, 10, 0.6)', border: '1px solid #543', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '0.8rem' },
                text: "Box", // Placeholder text since image gen failed
                action: () => {
                    if (state.flags.boxUnlocked) {
                        log("箱は空だ。");
                    } else if (state.flags.hasKey) {
                        log("もう用はない。");
                    } else if (state.flags.hasKnife) {
                        log("ナイフで箱をこじ開けた！「玄関の鍵」を見つけた！");
                        inventoryAdd('Entrance Key');
                        state.flags.hasKey = true;
                        state.flags.boxUnlocked = true;
                        triggerEffect('flash');
                    } else {
                        log("木製の小箱がある。固く閉ざされている...何かでこじ開けられそうだ。");
                    }
                }
            }
        ]
    },
    'diningRoom': {
        description: "食堂。腐った果物の臭いが充満している。",
        visual: "url('bg_dining_1767493771644.png')",
        interactables: [
            {
                text: "<< Back",
                style: { bottom: '5%', left: '45%', width: '10%', height: '5%', background: 'rgba(0,0,0,0.7)', textAlign: 'center', color: 'white', borderRadius: '5px' },
                action: () => changeScene('mainHall')
            },
            {
                text: "Kitchen",
                style: { top: '30%', left: '70%', width: '15%', height: '40%', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: '#ccc', display: 'flex', justifyContent: 'center', alignItems: 'center' },
                action: () => changeScene('kitchen')
            }
        ]
    },
    'kitchen': {
        description: "厨房。何かが腐ったような、鉄錆のような臭い...",
        visual: "url('bg_kitchen_1767493786460.png')",
        interactables: [
            {
                text: "<< Back",
                style: { bottom: '5%', left: '45%', width: '10%', height: '5%', background: 'rgba(0,0,0,0.7)', textAlign: 'center', color: 'white', borderRadius: '5px' },
                action: () => changeScene('diningRoom')
            },
            {
                // This interactable is only visible if !hasKnife
                condition: () => !state.flags.hasKnife,
                id: 'knife',
                style: {
                    top: '60%', left: '50%', width: '150px', height: '150px',
                    backgroundImage: "url('item_knife_1767493802089.png')",
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    cursor: 'pointer'
                },
                action: () => {
                    log("血塗れのナイフを手に入れた。");
                    inventoryAdd('Bloody Knife');
                    state.flags.hasKnife = true;
                    changeScene('kitchen'); // Refresh to hide knife
                }
            }
        ]
    }
};

function changeScene(sceneName) {
    state.currentScene = sceneName;
    const scene = scenes[sceneName];

    // Update Description
    log(scene.description);

    // Update Visuals
    const visual = document.getElementById('visual-content');
    visual.style.background = scene.visual;

    // Clear Interactables
    const layer = document.getElementById('interactables-layer');
    layer.innerHTML = '';

    // Create Interactables
    scene.interactables.forEach(item => {
        // Check condition if exists
        if (item.condition && !item.condition()) return;

        const el = document.createElement('div');
        el.className = 'interactable';
        if (item.id) el.id = item.id;
        if (item.text) el.innerText = item.text;

        Object.assign(el.style, item.style);

        el.addEventListener('click', (e) => {
            e.stopPropagation();
            item.action();
        });

        layer.appendChild(el);
    });
}

// Start Game
changeScene('start');
