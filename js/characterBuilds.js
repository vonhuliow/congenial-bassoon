
// Character Builds Mod - Randomly spawn as different character archetypes
(function() {
    'use strict';
    
    console.log('%cCharacter Builds mod loading...', 'color: #ff6b35');
    
    // Wait for game to be ready
    if (typeof m === 'undefined' || typeof tech === 'undefined' || typeof b === 'undefined') {
        setTimeout(arguments.callee, 100);
        return;
    }
    
    const characterBuilds = [
        {
            name: "Berserker",
            description: "High damage melee fighter with life steal",
            color: { hue: 0, sat: 80, light: 50 },
            field: 3, // plasma torch
            guns: ["sword", "battle axe"],
            tech: ["vampirism", "glass cannon", "explosive resurrection"]
        },
        {
            name: "Assassin",
            description: "Fast, stealthy fighter with critical strikes",
            color: { hue: 270, sat: 70, light: 40 },
            field: 2, // metamaterial cloaking
            guns: ["katana", "shadow rapier"],
            tech: ["metastable", "night vision", "ramming speed"]
        },
        {
            name: "Paladin",
            description: "Tanky warrior with defensive abilities",
            color: { hue: 45, sat: 85, light: 55 },
            field: 6, // perfect diamagnetism
            guns: ["celestial halberd", "battle axe"],
            tech: ["field boost", "armor plating", "regeneration"]
        },
        {
            name: "Mage",
            description: "Energy-based attacks with high field power",
            color: { hue: 200, sat: 90, light: 60 },
            field: 9, // time dilation
            guns: ["plasma cannon", "railgun"],
            tech: ["field emitter", "overcharge", "capacitor"]
        },
        {
            name: "Archer",
            description: "Long-range specialist with precision",
            color: { hue: 120, sat: 60, light: 50 },
            field: 5, // negative mass
            guns: ["energy bow", "railgun"],
            tech: ["scope", "precognition", "lightweight"]
        },
        {
            name: "Reaper",
            description: "Dark scythe wielder with soul harvest",
            color: { hue: 290, sat: 75, light: 35 },
            field: 10, // wormhole
            guns: ["scythe", "chain-scythe"],
            tech: ["vampirism", "undying", "supernova"]
        },
        {
            name: "Warrior",
            description: "Balanced melee fighter",
            color: { hue: 30, sat: 70, light: 50 },
            field: 1, // pilot wave
            guns: ["spear", "tri-trident"],
            tech: ["spring", "collision recoil", "stim pack"]
        },
        {
            name: "Elementalist",
            description: "Wields multiple elemental powers",
            color: { hue: 180, sat: 80, light: 55 },
            field: 4, // molecular assembler
            guns: ["excaliblaze", "raijin edge"],
            tech: ["trigonometry", "harmonics", "conservation of energy"]
        },
        {
            name: "Brawler",
            description: "Close combat specialist with raw power",
            color: { hue: 15, sat: 85, light: 45 },
            field: 3, // plasma torch
            guns: ["dual gauntlets", "pink blossom hammer"],
            tech: ["mass driver", "ramming speed", "cellular respiration"]
        },
        {
            name: "Necromancer",
            description: "Summons the dead to fight",
            color: { hue: 150, sat: 30, light: 40 },
            field: 7, // standing wave
            guns: ["reaper's blossom", "scythe"],
            tech: ["zombie", "horde", "plague"]
        }
    ];
    
    // Store original spawn function
    const originalPlayerSpawn = m.spawn;
    
    // Override player spawn to apply random build
    m.spawn = function() {
        originalPlayerSpawn.call(this);
        
        // Only apply build at the start of a new game
        if (level.levelsCleared === 0 && !build.isExperimentRun) {
            const build = characterBuilds[Math.floor(Math.random() * characterBuilds.length)];
            applyCharacterBuild(build);
        }
    };
    
    function applyCharacterBuild(build) {
        console.log(`%cSpawning as: ${build.name}`, 'color: #ff6b35; font-weight: bold;');
        console.log(`%c${build.description}`, 'color: #888');
        
        // Set player color
        m.color = build.color;
        m.setFillColors();
        
        // Set field
        if (build.field !== undefined && m.fieldUpgrades[build.field]) {
            m.setField(build.field);
        }
        
        // Give guns
        if (build.guns && build.guns.length > 0) {
            for (let gunName of build.guns) {
                for (let i = 0; i < b.guns.length; i++) {
                    if (b.guns[i].name.toLowerCase() === gunName.toLowerCase()) {
                        b.giveGuns(i);
                        break;
                    }
                }
            }
        }
        
        // Give tech
        if (build.tech && build.tech.length > 0) {
            for (let techName of build.tech) {
                for (let i = 0; i < tech.tech.length; i++) {
                    if (tech.tech[i].name.toLowerCase() === techName.toLowerCase() && tech.tech[i].allowed()) {
                        tech.giveTech(i);
                        break;
                    }
                }
            }
        }
        
        // Show build info in console
        setTimeout(() => {
            simulation.inGameConsole(`<span style="color:#ff6b35;font-weight:bold;">Character: ${build.name}</span>`);
            simulation.inGameConsole(`<span style="color:#888;">${build.description}</span>`);
        }, 100);
        
        // Update UI
        simulation.makeGunHUD();
        simulation.updateTechHUD();
    }
    
    // Add manual build selector (optional - can be triggered with a specific key)
    window.selectCharacterBuild = function(index) {
        if (index >= 0 && index < characterBuilds.length) {
            applyCharacterBuild(characterBuilds[index]);
        }
    };
    
    // List all builds in console for reference
    console.log('%cAvailable Character Builds:', 'color: #ff6b35; font-weight: bold;');
    characterBuilds.forEach((build, index) => {
        console.log(`%c${index}: ${build.name} - ${build.description}`, 'color: #888');
    });
    
    console.log('%cCharacter Builds mod loaded!', 'color: #ff6b35');
    console.log('%cYou will spawn as a random character build each game!', 'color: #0f0');
})();
