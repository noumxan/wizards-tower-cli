// Game state and data structure for Tower Trial
const gameData = {
    // Player state
    player: {
        currentRoom: 'entrance',
        inventory: [],
        health: 100,
        mana: 100,
        flags: new Set(), // Game progress flags
        spells: new Set(['fireball']) // Starting spell
    },

    // Room definitions
    rooms: {
        // Ground Floor
        entrance: {
            id: 'entrance',
            name: 'Tower Entrance',
            description: 'A grand stone archway marks the entrance to the ancient wizard\'s tower. The air hums with magical energy.',
            exits: {
                north: 'lobby',
                east: 'garden'
            },
            items: ['tome_basic'],
            onEnter: () => {
                if (!gameData.player.flags.has('first_entry')) {
                    gameData.player.flags.add('first_entry');
                    return 'Welcome to the Tower Trial, young wizard. Your journey to master the arcane arts begins here.';
                }
                return '';
            },
            onLook: () => {
                const outputDiv = document.getElementById('output');
                if (!outputDiv) return;
                const hint = document.createElement('div');
                hint.innerHTML = `<span style='color:#76ff7a;'>You notice a tome on a pedestal. Try <b>take tome_basic</b>.</span>`;
                outputDiv.appendChild(hint);
            }
        },
        lobby: {
            id: 'lobby',
            name: 'Grand Lobby',
            description: 'A circular chamber with a high ceiling. Magical torches cast an ethereal light on the stone walls.',
            exits: {
                south: 'entrance',
                up: 'library'
            },
            items: ['health_potion'],
            guardian: {
                name: 'Guardian of the Gate',
                health: 50,
                attack: 10,
                defense: 5,
                onDefeat: () => {
                    gameData.player.flags.add('lobby_cleared');
                    return 'The guardian\'s form dissipates, revealing a shimmering portal leading upward.';
                }
            },
            onEnter: () => {
                if (!gameData.player.flags.has('lobby_intro')) {
                    gameData.player.flags.add('lobby_intro');
                    showCutscene([
                        {text: `<span style='color:#f0a500;'>A spectral guardian materializes, blocking your path.</span>`, className: 'message-info', delay: 1500},
                        {text: `"Only those who prove their might may pass!"`, className: 'message-success', delay: 2000},
                        {text: `<span style='color:#82aaff;'>Hint: Try <b>cast fireball guardian</b> to attack.</span>`, className: 'message-info', delay: 1800}
                    ]);
                    return '';
                }
                return '';
            },
            onLook: () => {
                const outputDiv = document.getElementById('output');
                if (!outputDiv) return;
                const hint = document.createElement('div');
                hint.innerHTML = `<span style='color:#76ff7a;'>Hint: If you see a guardian, try <b>cast fireball guardian</b>. If you need healing, <b>take health_potion</b> and <b>use health_potion</b>.</span>`;
                outputDiv.appendChild(hint);
            }
        },
        garden: {
            id: 'garden',
            name: 'Enchanted Garden',
            description: 'A mystical garden where plants glow with magical energy. Some seem to move on their own.',
            exits: {
                west: 'entrance',
                north: 'herbarium'
            },
            items: ['mana_potion', 'herb_rare'],
            puzzle: {
                type: 'herb_collection',
                required: ['herb_rare', 'herb_common'],
                reward: 'shield_spell',
                onSolve: () => {
                    gameData.player.flags.add('garden_puzzle_solved');
                    return 'The herbs combine to form a magical shield spell!';
                }
            }
        },

        // First Floor
        library: {
            id: 'library',
            name: 'Arcane Library',
            description: 'Towering bookshelves line the walls, filled with ancient tomes and scrolls. The air is thick with the smell of old paper and magic.',
            exits: {
                down: 'lobby',
                east: 'study',
                up: 'laboratory'
            },
            items: ['spell_scroll', 'tome_advanced'],
            puzzle: {
                type: 'book_sequence',
                required: ['tome_basic', 'tome_advanced'],
                reward: 'teleport_spell',
                onSolve: () => {
                    gameData.player.flags.add('library_puzzle_solved');
                    return 'The tomes align, revealing the secrets of teleportation!';
                }
            },
            onEnter: () => {
                if (!gameData.player.flags.has('library_intro')) {
                    gameData.player.flags.add('library_intro');
                    showCutscene([
                        {text: `<span style='color:#f0a500;'>The air tingles with arcane energy as you enter the library.</span>`, className: 'message-info', delay: 1500},
                        {text: `A whisper: "Knowledge is the key. Seek the scroll and tomes."`, className: 'message-success', delay: 2000},
                        {text: `<span style='color:#82aaff;'>Hint: <b>take spell_scroll</b> and <b>take tome_advanced</b>. Then <b>use spell_scroll</b> to learn a new spell.</span>`, className: 'message-info', delay: 1800}
                    ]);
                    return '';
                }
                return '';
            },
            onLook: () => {
                const outputDiv = document.getElementById('output');
                if (!outputDiv) return;
                const hint = document.createElement('div');
                hint.className = 'hint-message';
                hint.innerHTML = `Hint: Try <b>take spell_scroll</b> and <b>take tome_advanced</b>, then <b>use spell_scroll</b> to learn a new spell. After that, <b>use tome_basic</b> and <b>use tome_advanced</b> to solve the puzzle!`;
                outputDiv.appendChild(hint);
            }
        },
        study: {
            id: 'study',
            name: 'Wizard\'s Study',
            description: 'A cozy room with a large desk covered in magical implements and half-finished experiments.',
            exits: {
                west: 'library'
            },
            items: ['mana_crystal'],
            guardian: {
                name: 'Arcane Apprentice',
                health: 75,
                attack: 15,
                defense: 8,
                onDefeat: () => {
                    gameData.player.flags.add('study_cleared');
                    return 'The apprentice yields, revealing a hidden compartment in the desk.';
                }
            }
        },

        // Second Floor
        laboratory: {
            id: 'laboratory',
            name: 'Alchemical Laboratory',
            description: 'Bubbling potions and strange apparatus fill this room. The air crackles with magical energy.',
            exits: {
                down: 'library',
                north: 'observatory',
                up: 'sanctum'
            },
            items: ['potion_rare', 'alchemical_ingredient'],
            puzzle: {
                type: 'potion_brewing',
                required: ['potion_rare', 'alchemical_ingredient'],
                reward: 'invisibility_spell',
                onSolve: () => {
                    gameData.player.flags.add('lab_puzzle_solved');
                    return 'The potion transforms into a spell of invisibility!';
                }
            }
        },
        observatory: {
            id: 'observatory',
            name: 'Celestial Observatory',
            description: 'A domed room with a crystal ceiling showing the stars. Magical orreries float in the air.',
            exits: {
                south: 'laboratory'
            },
            items: ['star_chart'],
            guardian: {
                name: 'Celestial Guardian',
                health: 100,
                attack: 20,
                defense: 15,
                onDefeat: () => {
                    gameData.player.flags.add('observatory_cleared');
                    return 'The stars align, revealing a path to the upper floors.';
                }
            }
        },

        // Third Floor
        sanctum: {
            id: 'sanctum',
            name: 'Inner Sanctum',
            description: 'A circular chamber with runes carved into the floor. The air shimmers with powerful magic.',
            exits: {
                down: 'laboratory',
                east: 'archive',
                up: 'nexus'
            },
            items: ['ancient_scroll'],
            puzzle: {
                type: 'rune_sequence',
                required: ['ancient_scroll'],
                reward: 'lightning_spell',
                onSolve: () => {
                    gameData.player.flags.add('sanctum_puzzle_solved');
                    return 'The runes glow brightly, granting you the power of lightning!';
                }
            }
        },
        archive: {
            id: 'archive',
            name: 'Forbidden Archive',
            description: 'Restricted tomes and dangerous artifacts line the walls. A magical barrier protects the most powerful items.',
            exits: {
                west: 'sanctum'
            },
            items: ['forbidden_tome'],
            guardian: {
                name: 'Archive Keeper',
                health: 125,
                attack: 25,
                defense: 20,
                onDefeat: () => {
                    gameData.player.flags.add('archive_cleared');
                    return 'The barrier falls, revealing the most powerful spells in the archive.';
                }
            }
        },

        // Fourth Floor
        nexus: {
            id: 'nexus',
            name: 'Magical Nexus',
            description: 'A room where ley lines converge. Raw magical energy flows through the air like visible currents.',
            exits: {
                down: 'sanctum',
                north: 'ritual_chamber',
                up: 'summit'
            },
            items: ['ley_crystal'],
            puzzle: {
                type: 'energy_harnessing',
                required: ['ley_crystal'],
                reward: 'time_stop_spell',
                onSolve: () => {
                    gameData.player.flags.add('nexus_puzzle_solved');
                    return 'You learn to manipulate the flow of time itself!';
                }
            }
        },
        ritual_chamber: {
            id: 'ritual_chamber',
            name: 'Ritual Chamber',
            description: 'A large circular room with a pentagram etched into the floor. Magical circles glow with power.',
            exits: {
                south: 'nexus'
            },
            items: ['ritual_components'],
            guardian: {
                name: 'Ritual Master',
                health: 150,
                attack: 30,
                defense: 25,
                onDefeat: () => {
                    gameData.player.flags.add('ritual_cleared');
                    return 'The ritual master\'s defeat reveals the path to the tower\'s summit.';
                }
            }
        },

        // Fifth Floor
        summit: {
            id: 'summit',
            name: 'Tower Summit',
            description: 'The highest point of the tower. The entire magical realm spreads out below you.',
            exits: {
                down: 'nexus'
            },
            items: ['master_spellbook'],
            guardian: {
                name: 'Tower Master',
                health: 200,
                attack: 40,
                defense: 35,
                onDefeat: () => {
                    gameData.player.flags.add('tower_master_defeated');
                    return 'You have proven yourself worthy of the tower\'s secrets!';
                }
            }
        },

        // Sixth Floor
        frost_chamber: {
            id: 'frost_chamber',
            name: 'Frost Chamber',
            description: 'A vast chamber of ice and snow. Crystalline formations grow from the walls, and the air is bitterly cold.',
            exits: {
                down: 'summit',
                east: 'ice_library',
                up: 'storm_peak'
            },
            items: ['frost_crystal'],
            hazards: [{
                type: 'ice_slide',
                damage: 10,
                message: 'The floor is slick with ice!',
                onTrigger: () => {
                    if (!gameData.player.flags.has('ice_mastery')) {
                        gameData.player.health -= 10;
                        return 'You slip on the ice and take damage!';
                    }
                    return 'Your ice mastery allows you to navigate safely.';
                }
            }],
            puzzle: {
                type: 'frost_riddle',
                required: ['frost_crystal'],
                alternate_solution: 'ice_mastery',
                reward: 'ice_lance_spell',
                onSolve: (method) => {
                    if (method === 'riddle') {
                        gameData.player.flags.add('frost_riddle_solved');
                        return 'The ice crystal resonates with your answer, granting you the Ice Lance spell!';
                    } else {
                        gameData.player.flags.add('ice_mastery');
                        return 'You master the ice, learning to channel its power into the Ice Lance spell!';
                    }
                }
            },
            guardian: {
                name: 'Frost Guardian',
                health: 250,
                attack: 35,
                defense: 30,
                special_ability: 'frost_nova',
                onDefeat: () => {
                    gameData.player.flags.add('frost_guardian_defeated');
                    return 'The Frost Guardian shatters, revealing a path to the Storm Peak.';
                },
                ai: {
                    type: 'pursuit',
                    range: 3,
                    onPursue: (playerRoom) => {
                        // BFS pathfinding to player
                        const path = findPathToPlayer('frost_chamber', playerRoom);
                        return path[0]; // Next room to move to
                    }
                }
            }
        },
        ice_library: {
            id: 'ice_library',
            name: 'Frozen Archive',
            description: 'Ancient tomes preserved in ice. The knowledge within is perfectly preserved, waiting to be thawed.',
            exits: {
                west: 'frost_chamber'
            },
            items: ['frozen_scroll'],
            hazards: [{
                type: 'freezing_mist',
                damage: 5,
                interval: 30, // seconds
                message: 'A freezing mist rolls through the room!',
                onTrigger: () => {
                    if (!gameData.player.flags.has('ice_mastery')) {
                        gameData.player.health -= 5;
                        return 'The freezing mist damages you!';
                    }
                    return 'Your ice mastery protects you from the mist.';
                }
            }]
        },

        // Seventh Floor
        storm_peak: {
            id: 'storm_peak',
            name: 'Storm Peak',
            description: 'A platform high in the clouds. Lightning crackles through the air, and powerful winds buffet the area.',
            exits: {
                down: 'frost_chamber',
                north: 'wind_temple',
                up: 'shadow_realm'
            },
            items: ['storm_crystal'],
            hazards: [{
                type: 'lightning_strike',
                damage: 15,
                message: 'Lightning strikes nearby!',
                onTrigger: () => {
                    if (gameData.player.flags.has('shield_active')) {
                        return 'Your shield protects you from the lightning!';
                    }
                    gameData.player.health -= 15;
                    return 'You are struck by lightning!';
                }
            }],
            puzzle: {
                type: 'storm_control',
                required: ['storm_crystal'],
                alternate_solution: 'wind_mastery',
                reward: 'arcane_mirror_spell',
                onSolve: (method) => {
                    if (method === 'control') {
                        gameData.player.flags.add('storm_control_solved');
                        return 'You learn to channel the storm\'s power into the Arcane Mirror spell!';
                    } else {
                        gameData.player.flags.add('wind_mastery');
                        return 'Your mastery of the winds grants you the Arcane Mirror spell!';
                    }
                }
            },
            guardian: {
                name: 'Storm Drake',
                health: 300,
                attack: 40,
                defense: 35,
                special_ability: 'thunder_breath',
                onDefeat: () => {
                    gameData.player.flags.add('storm_drake_defeated');
                    return 'The Storm Drake falls, revealing a portal to the Shadow Realm.';
                },
                ai: {
                    type: 'pursuit',
                    range: 4,
                    onPursue: (playerRoom) => {
                        const path = findPathToPlayer('storm_peak', playerRoom);
                        return path[0];
                    }
                }
            }
        },
        wind_temple: {
            id: 'wind_temple',
            name: 'Temple of Winds',
            description: 'A circular temple where the winds howl through ancient pillars. The air is charged with magical energy.',
            exits: {
                south: 'storm_peak'
            },
            items: ['wind_scroll'],
            hazards: [{
                type: 'wind_gust',
                damage: 8,
                message: 'A powerful wind gust threatens to knock you over!',
                onTrigger: () => {
                    if (gameData.player.flags.has('wind_mastery')) {
                        return 'You ride the wind gust safely!';
                    }
                    gameData.player.health -= 8;
                    return 'The wind gust knocks you off balance!';
                }
            }]
        },

        // Eighth Floor
        shadow_realm: {
            id: 'shadow_realm',
            name: 'Shadow Realm',
            description: 'A dark dimension where shadows come alive. The very air seems to drain your energy.',
            exits: {
                down: 'storm_peak',
                east: 'void_chamber',
                up: 'tower_crown'
            },
            items: ['shadow_essence'],
            hazards: [{
                type: 'shadow_tendrils',
                damage: 12,
                message: 'Shadow tendrils reach for you!',
                onTrigger: () => {
                    if (gameData.player.flags.has('shadow_mastery')) {
                        return 'You phase through the shadows harmlessly!';
                    }
                    gameData.player.health -= 12;
                    return 'The shadow tendrils drain your life force!';
                }
            }],
            puzzle: {
                type: 'shadow_weaving',
                required: ['shadow_essence'],
                alternate_solution: 'shadow_mastery',
                reward: 'soul_drain_spell',
                onSolve: (method) => {
                    if (method === 'weaving') {
                        gameData.player.flags.add('shadow_weaving_solved');
                        return 'You master the art of shadow weaving, learning the Soul Drain spell!';
                    } else {
                        gameData.player.flags.add('shadow_mastery');
                        return 'Your mastery of shadows grants you the Soul Drain spell!';
                    }
                }
            },
            guardian: {
                name: 'Shadow Sorcerer',
                health: 350,
                attack: 45,
                defense: 40,
                special_ability: 'void_blast',
                onDefeat: () => {
                    gameData.player.flags.add('shadow_sorcerer_defeated');
                    return 'The Shadow Sorcerer dissipates, revealing the path to the Tower Crown.';
                },
                ai: {
                    type: 'pursuit',
                    range: 5,
                    onPursue: (playerRoom) => {
                        const path = findPathToPlayer('shadow_realm', playerRoom);
                        return path[0];
                    }
                }
            }
        },
        void_chamber: {
            id: 'void_chamber',
            name: 'Chamber of the Void',
            description: 'A place where reality itself seems to unravel. Strange energies pulse through the darkness.',
            exits: {
                west: 'shadow_realm'
            },
            items: ['void_crystal'],
            hazards: [{
                type: 'reality_shift',
                damage: 20,
                message: 'Reality shifts around you!',
                onTrigger: () => {
                    if (gameData.player.flags.has('shadow_mastery')) {
                        return 'You anchor yourself in the void!';
                    }
                    gameData.player.health -= 20;
                    return 'The shifting reality damages your essence!';
                }
            }]
        },

        // Final Floor
        tower_crown: {
            id: 'tower_crown',
            name: 'Tower Crown',
            description: 'The ultimate chamber of the tower. Here, all magical energies converge in a dazzling display of power.',
            exits: {
                down: 'shadow_realm'
            },
            items: ['crown_of_magic'],
            guardian: {
                name: 'Archmage',
                health: 400,
                attack: 50,
                defense: 45,
                special_ability: 'arcane_apocalypse',
                onDefeat: () => {
                    gameData.player.flags.add('archmage_defeated');
                    return 'You have become the new master of the tower!';
                },
                ai: {
                    type: 'pursuit',
                    range: 6,
                    onPursue: (playerRoom) => {
                        const path = findPathToPlayer('tower_crown', playerRoom);
                        return path[0];
                    }
                }
            }
        }
    },

    // Item definitions
    items: {
        // Spells
        fireball: {
            id: 'fireball',
            name: 'Fireball Spell',
            type: 'spell',
            manaCost: 20,
            damage: 30,
            description: 'A basic offensive spell that launches a ball of fire.',
            onUse: (target) => {
                if (gameData.player.mana >= 20) {
                    gameData.player.mana -= 20;
                    return `You cast Fireball at ${target}!`;
                }
                return 'Not enough mana!';
            }
        },
        shield: {
            id: 'shield',
            name: 'Shield Spell',
            type: 'spell',
            manaCost: 15,
            defense: 20,
            description: 'Creates a magical barrier that reduces incoming damage.',
            onUse: () => {
                if (gameData.player.mana >= 15) {
                    gameData.player.mana -= 15;
                    gameData.player.flags.add('shield_active');
                    return 'You cast Shield!';
                }
                return 'Not enough mana!';
            }
        },
        teleport: {
            id: 'teleport',
            name: 'Teleport Spell',
            type: 'spell',
            manaCost: 30,
            description: 'Instantly transports you to a previously visited room.',
            onUse: (targetRoom) => {
                if (gameData.player.mana >= 30 && gameData.rooms[targetRoom]) {
                    gameData.player.mana -= 30;
                    gameData.player.currentRoom = targetRoom;
                    return `You teleport to ${gameData.rooms[targetRoom].name}!`;
                }
                return 'Invalid target or not enough mana!';
            }
        },

        // Potions
        health_potion: {
            id: 'health_potion',
            name: 'Health Potion',
            type: 'potion',
            effect: 30,
            description: 'Restores 30 health points.',
            onUse: () => {
                gameData.player.health = Math.min(100, gameData.player.health + 30);
                return 'You feel revitalized!';
            }
        },
        mana_potion: {
            id: 'mana_potion',
            name: 'Mana Potion',
            type: 'potion',
            effect: 30,
            description: 'Restores 30 mana points.',
            onUse: () => {
                gameData.player.mana = Math.min(100, gameData.player.mana + 30);
                return 'Your magical energy is restored!';
            }
        },

        // Keys and Tools
        tower_key: {
            id: 'tower_key',
            name: 'Tower Key',
            type: 'key',
            description: 'A magical key that can unlock certain doors in the tower.',
            onUse: (target) => {
                if (target === 'sanctum_door' && gameData.player.flags.has('library_puzzle_solved')) {
                    gameData.player.flags.add('sanctum_unlocked');
                    return 'The door to the Inner Sanctum unlocks!';
                }
                return 'This key doesn\'t fit here.';
            }
        },

        // Tomes and Scrolls
        tome_basic: {
            id: 'tome_basic',
            name: 'Basic Spell Tome',
            type: 'tome',
            description: 'A beginner\'s guide to basic spells.',
            onUse: () => {
                gameData.player.spells.add('fireball');
                return 'You learn the Fireball spell!';
            }
        },
        spell_scroll: {
            id: 'spell_scroll',
            name: 'Mysterious Scroll',
            type: 'scroll',
            description: 'An ancient scroll containing magical knowledge.',
            onUse: () => {
                gameData.player.spells.add('shield');
                return 'You learn the Shield spell!';
            }
        },

        // New Spells
        ice_lance: {
            id: 'ice_lance',
            name: 'Ice Lance Spell',
            type: 'spell',
            manaCost: 15,
            damage: 20,
            effect: 'slow',
            description: 'Launches a spear of ice that damages and slows the target.',
            onUse: (target) => {
                if (gameData.player.mana >= 15) {
                    gameData.player.mana -= 15;
                    if (target === 'guardian') {
                        const guardian = gameData.rooms[gameData.player.currentRoom].guardian;
                        if (guardian) {
                            guardian.defense -= 5; // Slow effect
                            setTimeout(() => {
                                guardian.defense += 5; // Effect wears off
                            }, 30000); // 30 seconds
                        }
                    }
                    return `You cast Ice Lance at ${target}!`;
                }
                return 'Not enough mana!';
            }
        },
        arcane_mirror: {
            id: 'arcane_mirror',
            name: 'Arcane Mirror Spell',
            type: 'spell',
            manaCost: 25,
            defense: 30,
            description: 'Creates a mirror that absorbs the next 30 damage.',
            onUse: () => {
                if (gameData.player.mana >= 25) {
                    gameData.player.mana -= 25;
                    gameData.player.flags.add('arcane_mirror_active');
                    return 'You cast Arcane Mirror!';
                }
                return 'Not enough mana!';
            }
        },
        soul_drain: {
            id: 'soul_drain',
            name: 'Soul Drain Spell',
            type: 'spell',
            manaCost: 40,
            damage: 50,
            effect: 'life_steal',
            description: 'Drains the life force from your target, healing you for half the damage dealt.',
            onUse: (target) => {
                if (gameData.player.mana >= 40) {
                    gameData.player.mana -= 40;
                    if (target === 'guardian') {
                        const guardian = gameData.rooms[gameData.player.currentRoom].guardian;
                        if (guardian) {
                            guardian.health -= 50;
                            gameData.player.health = Math.min(100, gameData.player.health + 25);
                        }
                    }
                    return `You cast Soul Drain at ${target}!`;
                }
                return 'Not enough mana!';
            }
        }
    },

    // Command handlers
    commands: {
        go: (direction) => {
            const currentRoom = gameData.rooms[gameData.player.currentRoom];
            if (currentRoom.exits[direction]) {
                const nextRoom = currentRoom.exits[direction];
                gameData.player.currentRoom = nextRoom;
                const room = gameData.rooms[nextRoom];
                let message = `You enter ${room.name}.\n${room.description}`;
                
                if (room.onEnter) {
                    const enterMessage = room.onEnter();
                    if (enterMessage) message += '\n' + enterMessage;
                }
                
                return message;
            }
            return 'You cannot go that way.';
        },

        look: (target) => {
            const currentRoom = gameData.rooms[gameData.player.currentRoom];
            if (!target) {
                return `${currentRoom.name}\n${currentRoom.description}`;
            }
            
            const item = gameData.items[target];
            if (item) {
                return `${item.name}\n${item.description}`;
            }
            
            return 'You don\'t see that here.';
        },

        take: (itemId) => {
            const currentRoom = gameData.rooms[gameData.player.currentRoom];
            if (currentRoom.items.includes(itemId)) {
                gameData.player.inventory.push(itemId);
                currentRoom.items = currentRoom.items.filter(id => id !== itemId);
                return `You take the ${gameData.items[itemId].name}.`;
            }
            return 'You can\'t take that.';
        },

        use: (itemId, target) => {
            const item = gameData.items[itemId];
            if (!item) return 'You don\'t have that item.';
            
            if (item.onUse) {
                return item.onUse(target);
            }
            return 'You can\'t use that item.';
        },

        inventory: () => {
            if (gameData.player.inventory.length === 0) {
                return 'Your inventory is empty.';
            }
            return 'Inventory:\n' + gameData.player.inventory
                .map(id => gameData.items[id].name)
                .join('\n');
        },

        cast: (spellId, target) => {
            if (!gameData.player.spells.has(spellId)) {
                return 'You don\'t know that spell.';
            }
            const spell = gameData.items[spellId];
            if (spell && spell.onUse) {
                return spell.onUse(target);
            }
            return 'You can\'t cast that spell.';
        },

        status: () => {
            return `Health: ${gameData.player.health}/100\nMana: ${gameData.player.mana}/100\nCurrent Room: ${gameData.rooms[gameData.player.currentRoom].name}`;
        },

        quicksave: () => {
            const saveData = {
                player: {
                    ...gameData.player,
                    flags: Array.from(gameData.player.flags),
                    spells: Array.from(gameData.player.spells)
                },
                timestamp: Date.now()
            };
            localStorage.setItem('tower_trial_quicksave', JSON.stringify(saveData));
            return 'Game quicksaved!';
        },

        quickload: () => {
            const saveData = JSON.parse(localStorage.getItem('tower_trial_quicksave'));
            if (saveData) {
                gameData.player = {
                    ...saveData.player,
                    flags: new Set(saveData.player.flags),
                    spells: new Set(saveData.player.spells)
                };
                return 'Game quickloaded!';
            }
            return 'No quicksave found.';
        },

        dodge: () => {
            const currentRoom = gameData.rooms[gameData.player.currentRoom];
            if (currentRoom.hazards && currentRoom.hazards.some(h => h.isActive)) {
                const hazard = currentRoom.hazards.find(h => h.isActive);
                hazard.isActive = false;
                return 'You successfully dodge the hazard!';
            }
            return 'There is nothing to dodge.';
        },
        help: () => {
            return `\u2728 Objective: Ascend the wizard's tower, solve magical puzzles, defeat guardians, and master new spells to become the Tower's Archmage.\n\n\u2139 How to Play:\n- Movement: go north, go east, up, down, etc.\n- Look/Examine: look, examine [object]\n- Take/Use Items: take [item], use [item], use [item] on [target]\n- Cast Spells: cast [spell] [target]\n- Inventory/Status: inventory, status\n- Save/Load: quicksave, quickload\n- Dodge Hazards: dodge (when prompted)\n- Help: help (for command list)\n\nTip: Explore, experiment, and pay attention to room descriptions and items!`;
        },
        examine: (target) => gameData.commands.look(target),
        x: (target) => gameData.commands.look(target),
        hint: () => getUniversalHint()
    }
};

// Utility function for guardian AI pathfinding
function findPathToPlayer(startRoom, targetRoom) {
    const queue = [[startRoom]];
    const visited = new Set([startRoom]);

    while (queue.length > 0) {
        const path = queue.shift();
        const currentRoom = path[path.length - 1];

        if (currentRoom === targetRoom) {
            return path;
        }

        const room = gameData.rooms[currentRoom];
        for (const [direction, nextRoom] of Object.entries(room.exits)) {
            if (!visited.has(nextRoom)) {
                visited.add(nextRoom);
                queue.push([...path, nextRoom]);
            }
        }
    }

    return [startRoom]; // Fallback if no path found
}

// Enhanced onboarding cutscene and dialogue system
function showCutscene(messages, callback) {
    const outputDiv = document.getElementById('output');
    if (!outputDiv) return;
    outputDiv.innerHTML = '';
    let idx = 0;
    function next() {
        if (idx < messages.length) {
            const msg = document.createElement('div');
            msg.innerHTML = messages[idx].text;
            msg.className = messages[idx].className || 'message-default';
            outputDiv.appendChild(msg);
            outputDiv.scrollTop = outputDiv.scrollHeight;
            idx++;
            setTimeout(next, messages[idx-1].delay || 1800);
        } else if (callback) {
            callback();
        }
    }
    next();
}

// Only declare these once at the top of their override blocks
var origEntranceOnEnter = gameData.rooms.entrance.onEnter;
var origLobbyOnEnter = gameData.rooms.lobby.onEnter;
var origLibraryOnEnter = gameData.rooms.library.onEnter;
var origGardenOnEnter = gameData.rooms.garden ? gameData.rooms.garden.onEnter : undefined;

// When overriding, just assign (no var/let/const)
gameData.rooms.entrance.onEnter = function() {
    let output = '';
    if (!gameData.player.flags.has('intro_cutscene')) {
        gameData.player.flags.add('intro_cutscene');
        showCutscene([
            {text: `<div class='cutscene-message'>A mysterious voice echoes...<br><br><b>"Welcome, apprentice. The path to mastery lies ahead. Seek the tome, then proceed north."</b></div>`, delay: 2000},
            {text: `<div class='hint-message'>Hint: Type <b>look</b> to examine your surroundings.</div>`, delay: 1800}
        ], showWelcomeAndInstructions);
        return '';
    }
    if (origEntranceOnEnter) output = origEntranceOnEnter();
    showWelcomeAndInstructions();
    return output;
};
gameData.rooms.entrance.onLook = function() {
    const outputDiv = document.getElementById('output');
    if (!outputDiv) return;
    const hint = document.createElement('div');
    hint.className = 'hint-message';
    hint.innerHTML = `You notice a tome on a pedestal. Try <b>take tome_basic</b>.`;
    outputDiv.appendChild(hint);
};

gameData.rooms.lobby.onEnter = function() {
    if (!gameData.player.flags.has('lobby_intro')) {
        gameData.player.flags.add('lobby_intro');
        showCutscene([
            {text: `<div class='cutscene-message'>A spectral guardian materializes, blocking your path.<br><br><b>"Only those who prove their might may pass!"</b></div>`, delay: 2000},
            {text: `<div class='hint-message'>Hint: Try <b>cast fireball guardian</b> to attack. If you need healing, <b>take health_potion</b> and <b>use health_potion</b>.</div>`, delay: 1800}
        ]);
        return '';
    }
    if (origLobbyOnEnter) return origLobbyOnEnter();
    return '';
};
gameData.rooms.lobby.onLook = function() {
    const outputDiv = document.getElementById('output');
    if (!outputDiv) return;
    const hint = document.createElement('div');
    hint.className = 'hint-message';
    hint.innerHTML = `Hint: If you see a guardian, try <b>cast fireball guardian</b>. If you need healing, <b>take health_potion</b> and <b>use health_potion</b>.`;
    outputDiv.appendChild(hint);
};

gameData.rooms.library.onEnter = function() {
    if (!gameData.player.flags.has('library_intro')) {
        gameData.player.flags.add('library_intro');
        showCutscene([
            {text: `<div class='cutscene-message'>The air tingles with arcane energy as you enter the library.<br><br><b>A whisper: "Knowledge is the key. Seek the scroll and tomes."</b></div>`, delay: 2000},
            {text: `<div class='hint-message'>Hint: <b>take spell_scroll</b> and <b>take tome_advanced</b>. Then <b>use spell_scroll</b> to learn a new spell.</div>`, delay: 1800}
        ]);
        return '';
    }
    if (origLibraryOnEnter) return origLibraryOnEnter();
    return '';
};
gameData.rooms.library.onLook = function() {
    const outputDiv = document.getElementById('output');
    if (!outputDiv) return;
    const hint = document.createElement('div');
    hint.className = 'hint-message';
    hint.innerHTML = `Hint: Try <b>take spell_scroll</b> and <b>take tome_advanced</b>, then <b>use spell_scroll</b> to learn a new spell. After that, <b>use tome_basic</b> and <b>use tome_advanced</b> to solve the puzzle!`;
    outputDiv.appendChild(hint);
};

// Garden puzzle intro
if (gameData.rooms.garden) {
    gameData.rooms.garden.onEnter = function() {
        if (!gameData.player.flags.has('garden_intro')) {
            gameData.player.flags.add('garden_intro');
            showCutscene([
                {text: `<div class='cutscene-message'>The garden glows with magical energy. Strange herbs beckon.<br><br><b>"Combine the rare and common herbs to unlock a new power."</b></div>`, delay: 2000},
                {text: `<div class='hint-message'>Hint: <b>take herb_rare</b> and <b>take herb_common</b>, then <b>use herb_rare</b> and <b>use herb_common</b>.</div>`, delay: 1800}
            ]);
            return '';
        }
        if (origGardenOnEnter) return origGardenOnEnter();
        return '';
    };
    gameData.rooms.garden.onLook = function() {
        const outputDiv = document.getElementById('output');
        if (!outputDiv) return;
        const hint = document.createElement('div');
        hint.className = 'hint-message';
        hint.innerHTML = `Hint: Combine <b>herb_rare</b> and <b>herb_common</b> to solve the puzzle and learn a new spell.`;
        outputDiv.appendChild(hint);
    };
}

// Conversational feedback for commands
const origTake = gameData.commands.take;
gameData.commands.take = function(itemId) {
    const result = origTake(itemId);
    if (result.startsWith('You take')) {
        return result + '\n<div class="hint-message">Hint: Type <b>inventory</b> to see your items, or <b>use ' + itemId + '</b> to use it.</div>';
    }
    return result;
};

const origGo = gameData.commands.go;
gameData.commands.go = function(direction) {
    const result = origGo(direction);
    if (result.startsWith('You enter')) {
        return result + '\n<div class="hint-message">Hint: Type <b>look</b> to examine this new room.</div>';
    }
    return result;
};

const origCast = gameData.commands.cast;
gameData.commands.cast = function(spellId, target) {
    const result = origCast(spellId, target);
    if (result.startsWith('You cast')) {
        return result + '\n<div class="hint-message">Hint: If you defeat the guardian, try <b>go up</b> to continue your ascent.</div>';
    }
    return result;
};

const origUse = gameData.commands.use;
gameData.commands.use = function(itemId, target) {
    const result = origUse(itemId, target);
    if (result.startsWith('You learn')) {
        return result + '\n<div class="cutscene-message">A surge of magical knowledge fills your mind. Try <b>cast ' + itemId + '</b> to use your new spell!</div>';
    }
    if (result.startsWith('You feel revitalized!')) {
        return result + '\n<div class="hint-message">Hint: Your health is restored. Check your <b>status</b> if needed.</div>';
    }
    return result;
};

// Hazards, save/load, and status feedback
const origDodge = gameData.commands.dodge;
gameData.commands.dodge = function() {
    const result = origDodge();
    if (result.startsWith('You successfully dodge')) {
        return result + '\n<div class="hint-message">Hint: You avoided the hazard! Continue exploring.</div>';
    }
    return result;
};
const origQuicksave = gameData.commands.quicksave;
gameData.commands.quicksave = function() {
    return origQuicksave() + '\n<div class="message-info">Game progress saved!</div>';
};
const origQuickload = gameData.commands.quickload;
gameData.commands.quickload = function() {
    return origQuickload() + '\n<div class="message-info">Game progress loaded!</div>';
};
gameData.commands.status = function() {
    return `Health: ${gameData.player.health}/100\nMana: ${gameData.player.mana}/100\nCurrent Room: ${gameData.rooms[gameData.player.currentRoom].name}\n<div class='hint-message'>Hint: Use <b>inventory</b> to see your items, <b>spells</b> to see your spells.</div>`;
};

// Ensure processCommand is defined only once and assigned globally
if (typeof origProcessCommand === 'undefined') {
    var origProcessCommand = undefined;
}
if (typeof processCommand !== 'function') {
    function processCommand(input) {
        if (!input) {
            input = document.getElementById('commandInput').value.trim().toLowerCase();
        }
        if (!input) return;
        // Synonym mapping
        const synonyms = {
            'pick up': 'take', 'pickup': 'take', 'grab': 'take',
            'inspect': 'examine', 'check': 'look', 'view': 'look',
            'attack': 'cast', 'hit': 'cast', 'strike': 'cast',
            'move': 'go', 'walk': 'go', 'run': 'go',
            'bag': 'inventory', 'items': 'inventory',
            'save': 'quicksave', 'load': 'quickload',
            'protect': 'cast shield', 'heal': 'use health_potion',
            'drink': 'use', 'eat': 'use',
            'status': 'status', 'help': 'help', 'dodge': 'dodge',
            'look': 'look', 'examine': 'examine', 'x': 'x',
        };
        let command = input;
        for (const [syn, real] of Object.entries(synonyms)) {
            if (command.startsWith(syn + ' ')) {
                command = real + command.slice(syn.length);
                break;
            } else if (command === syn) {
                command = real;
                break;
            }
        }
        if (typeof origProcessCommand === 'function') {
            origProcessCommand(command);
        } else {
            // fallback: basic command handler
            const [action, ...args] = command.split(' ');
            const handler = gameData.commands[action];
            let result;
            if (handler) {
                result = handler(args.join(' '));
            } else {
                result = "I don't understand that command.";
            }
            const outputDiv = document.getElementById('output');
            if (outputDiv) {
                const messageElement = document.createElement('div');
                messageElement.innerHTML = result;
                outputDiv.appendChild(messageElement);
                outputDiv.scrollTop = outputDiv.scrollHeight;
            }
            const commandInput = document.getElementById('commandInput');
            if (commandInput) commandInput.value = '';
        }
    }
}
window.processCommand = processCommand;

// Export the game data
if (typeof module !== 'undefined' && module.exports) {
    module.exports = gameData;
}

// Add a function to show instructions and objectives
function showWelcomeAndInstructions() {
    const outputDiv = document.getElementById('output');
    if (!outputDiv) return;
    outputDiv.innerHTML = '';
    
    // Objective
    const obj = document.createElement('div');
    obj.innerHTML = `<span style="color:#f0a500;font-size:1.3em;font-family:'MedievalSharp',cursive;">Objective:</span> <span style="color:#fff;">Ascend the wizard's tower, solve magical puzzles, defeat guardians, and master new spells to become the Tower's Archmage.</span>`;
    obj.style.marginBottom = '16px';
    outputDiv.appendChild(obj);

    // Instructions
    const instr = document.createElement('div');
    instr.innerHTML = `
      <span style="color:#82aaff;font-size:1.1em;font-family:'MedievalSharp',cursive;">How to Play:</span><br>
      <ul style="color:#e0e0e0;line-height:1.7;margin:8px 0 0 0;padding-left:18px;">
        <li><b>Movement:</b> <code>go north</code>, <code>go east</code>, <code>up</code>, <code>down</code>, etc.</li>
        <li><b>Look/Examine:</b> <code>look</code>, <code>examine [object]</code></li>
        <li><b>Take/Use Items:</b> <code>take [item]</code>, <code>use [item]</code>, <code>use [item] on [target]</code></li>
        <li><b>Cast Spells:</b> <code>cast [spell] [target]</code></li>
        <li><b>Inventory/Status:</b> <code>inventory</code>, <code>status</code></li>
        <li><b>Save/Load:</b> <code>quicksave</code>, <code>quickload</code></li>
        <li><b>Dodge Hazards:</b> <code>dodge</code> (when prompted)</li>
        <li><b>Help:</b> <code>help</code> (for command list)</li>
      </ul>
      <div style="margin-top:10px;color:#76ff7a;font-size:1.05em;">Tip: Explore, experiment, and pay attention to room descriptions and items!</div>
    `;
    instr.style.marginBottom = '18px';
    outputDiv.appendChild(instr);

    // Visual effect: fade in
    outputDiv.style.opacity = 0;
    setTimeout(() => { outputDiv.style.transition = 'opacity 1.2s'; outputDiv.style.opacity = 1; }, 50);
}

// Show instructions/objective on load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', showWelcomeAndInstructions);
}

// Optionally, also show when entering the entrance for the first time
gameData.rooms.entrance.onEnter = function() {
    showWelcomeAndInstructions();
    if (origEntranceOnEnter) return origEntranceOnEnter();
    return '';
};

function updateStatusBars() {
    const healthPercent = (gameData.player.health / 100) * 100;
    const manaPercent = (gameData.player.mana / 100) * 100;
    const healthBar = document.querySelector('.health-bar .status-bar-fill');
    const manaBar = document.querySelector('.mana-bar .status-bar-fill');
    if (healthBar) healthBar.style.setProperty('--health-percent', `${healthPercent}%`);
    if (manaBar) manaBar.style.setProperty('--mana-percent', `${manaPercent}%`);
    const healthValue = document.getElementById('healthValue');
    const manaValue = document.getElementById('manaValue');
    if (healthValue) healthValue.textContent = `${gameData.player.health}/100`;
    if (manaValue) manaValue.textContent = `${gameData.player.mana}/100`;
}

// Call updateStatusBars after every command
const origProcessCommandForBars = processCommand;
processCommand = function(input) {
    origProcessCommandForBars(input);
    updateStatusBars();
};
window.processCommand = processCommand;

// Advanced Floor: Frost Chamber
if (gameData.rooms.frost_chamber) {
    var origFrostChamberOnEnter = gameData.rooms.frost_chamber.onEnter;
    gameData.rooms.frost_chamber.onEnter = function() {
        if (!gameData.player.flags.has('frost_chamber_intro')) {
            gameData.player.flags.add('frost_chamber_intro');
            showCutscene([
                {text: `<div class='cutscene-message'>You step into the Frost Chamber. The air bites with cold, and a crystalline guardian looms ahead.<br><br><b>"Only those who master the riddle of ice may pass!"</b></div>`, delay: 2000},
                {text: `<div class='hint-message'>Hint: Solve the frost riddle or gain ice mastery. Try <b>use frost_crystal</b> or <b>solve frost_riddle</b>.</div>`, delay: 1800}
            ]);
            return '';
        }
        if (origFrostChamberOnEnter) return origFrostChamberOnEnter();
        return '';
    };
    gameData.rooms.frost_chamber.onLook = function() {
        const outputDiv = document.getElementById('output');
        if (!outputDiv) return;
        const hint = document.createElement('div');
        hint.className = 'hint-message';
        hint.innerHTML = `Hint: Use <b>ice_lance</b> after learning it, or master the ice to progress.`;
        outputDiv.appendChild(hint);
    };
}

// Advanced Floor: Storm Peak
if (gameData.rooms.storm_peak) {
    var origStormPeakOnEnter = gameData.rooms.storm_peak.onEnter;
    gameData.rooms.storm_peak.onEnter = function() {
        if (!gameData.player.flags.has('storm_peak_intro')) {
            gameData.player.flags.add('storm_peak_intro');
            showCutscene([
                {text: `<div class='cutscene-message'>You ascend to the Storm Peak. Lightning crackles and a drake circles above.<br><br><b>"Master the winds or be struck down!"</b></div>`, delay: 2000},
                {text: `<div class='hint-message'>Hint: Use <b>arcane_mirror</b> to shield yourself, or solve the storm control puzzle.</div>`, delay: 1800}
            ]);
            return '';
        }
        if (origStormPeakOnEnter) return origStormPeakOnEnter();
        return '';
    };
    gameData.rooms.storm_peak.onLook = function() {
        const outputDiv = document.getElementById('output');
        if (!outputDiv) return;
        const hint = document.createElement('div');
        hint.className = 'hint-message';
        hint.innerHTML = `Hint: Defeat the Storm Drake or master the winds to continue.`;
        outputDiv.appendChild(hint);
    };
}

// Advanced Floor: Shadow Realm
if (gameData.rooms.shadow_realm) {
    var origShadowRealmOnEnter = gameData.rooms.shadow_realm.onEnter;
    gameData.rooms.shadow_realm.onEnter = function() {
        if (!gameData.player.flags.has('shadow_realm_intro')) {
            gameData.player.flags.add('shadow_realm_intro');
            showCutscene([
                {text: `<div class='cutscene-message'>You enter the Shadow Realm. Darkness swirls, and a sorcerer of shadows blocks your path.<br><br><b>"Only those who weave the shadows may survive!"</b></div>`, delay: 2000},
                {text: `<div class='hint-message'>Hint: Use <b>soul_drain</b> after learning it, or solve the shadow weaving puzzle.</div>`, delay: 1800}
            ]);
            return '';
        }
        if (origShadowRealmOnEnter) return origShadowRealmOnEnter();
        return '';
    };
    gameData.rooms.shadow_realm.onLook = function() {
        const outputDiv = document.getElementById('output');
        if (!outputDiv) return;
        const hint = document.createElement('div');
        hint.className = 'hint-message';
        hint.innerHTML = `Hint: Defeat the Shadow Sorcerer or master shadow weaving to continue.`;
        outputDiv.appendChild(hint);
    };
}

// Final Floor: Tower Crown
if (gameData.rooms.tower_crown) {
    var origTowerCrownOnEnter = gameData.rooms.tower_crown.onEnter;
    gameData.rooms.tower_crown.onEnter = function() {
        if (!gameData.player.flags.has('tower_crown_intro')) {
            gameData.player.flags.add('tower_crown_intro');
            showCutscene([
                {text: `<div class='cutscene-message'>You reach the Tower Crown. All magical energies converge here. The Archmage awaits.<br><br><b>"Prove yourself, or be unmade!"</b></div>`, delay: 2000},
                {text: `<div class='hint-message'>Hint: Use your most powerful spells and all your mastery to defeat the Archmage.</div>`, delay: 1800}
            ]);
            return '';
        }
        if (origTowerCrownOnEnter) return origTowerCrownOnEnter();
        return '';
    };
    gameData.rooms.tower_crown.onLook = function() {
        const outputDiv = document.getElementById('output');
        if (!outputDiv) return;
        const hint = document.createElement('div');
        hint.className = 'hint-message';
        hint.innerHTML = `Hint: This is the final challenge. Use everything you've learned!`;
        outputDiv.appendChild(hint);
    };
}

// Universal hint command
function getUniversalHint() {
    const room = gameData.rooms[gameData.player.currentRoom];
    // Library
    if (room.id === 'library') {
        if (!gameData.player.inventory.includes('spell_scroll')) {
            return 'Hint: Take the spell scroll with <b>take spell_scroll</b>.';
        } else if (!gameData.player.inventory.includes('tome_advanced')) {
            return 'Hint: Take the advanced tome with <b>take tome_advanced</b>.';
        } else if (!gameData.player.spells.has('shield')) {
            return 'Hint: Use the spell scroll with <b>use spell_scroll</b> to learn a new spell.';
        } else if (!gameData.player.flags.has('library_puzzle_solved')) {
            return 'Hint: Use <b>use tome_basic</b> and <b>use tome_advanced</b> to solve the puzzle!';
        } else {
            return 'Hint: You have solved the library puzzle! Try <b>go up</b> to continue your ascent.';
        }
    }
    // Lobby
    if (room.id === 'lobby') {
        if (room.guardian && !gameData.player.flags.has('lobby_cleared')) {
            return 'Hint: Cast fireball at the guardian with <b>cast fireball guardian</b>.';
        } else {
            return 'Hint: Try <b>go up</b> to reach the library.';
        }
    }
    // Entrance
    if (room.id === 'entrance') {
        if (!gameData.player.inventory.includes('tome_basic')) {
            return 'Hint: Take the basic spell tome with <b>take tome_basic</b>.';
        } else {
            return 'Hint: Try <b>go north</b> to enter the tower.';
        }
    }
    // Garden
    if (room.id === 'garden') {
        if (!gameData.player.inventory.includes('herb_rare')) {
            return 'Hint: Take the rare herb with <b>take herb_rare</b>.';
        } else if (!gameData.player.inventory.includes('herb_common')) {
            return 'Hint: Take the common herb with <b>take herb_common</b>.';
        } else if (!gameData.player.spells.has('shield')) {
            return 'Hint: Use the herbs to solve the puzzle and learn a new spell.';
        } else {
            return 'Hint: Try <b>go north</b> to continue exploring.';
        }
    }
    // Advanced floors
    if (room.id === 'frost_chamber') {
        if (!gameData.player.spells.has('ice_lance')) {
            return 'Hint: Solve the frost riddle or use <b>use frost_crystal</b> to gain ice mastery.';
        } else if (!gameData.player.flags.has('frost_guardian_defeated')) {
            return 'Hint: Use <b>cast ice_lance guardian</b> to defeat the Frost Guardian.';
        } else {
            return 'Hint: Try <b>go up</b> to reach the Storm Peak.';
        }
    }
    if (room.id === 'storm_peak') {
        if (!gameData.player.spells.has('arcane_mirror')) {
            return 'Hint: Solve the storm control puzzle or use <b>use storm_crystal</b> to gain wind mastery.';
        } else if (!gameData.player.flags.has('storm_drake_defeated')) {
            return 'Hint: Use <b>cast arcane_mirror</b> to shield yourself and defeat the Storm Drake.';
        } else {
            return 'Hint: Try <b>go up</b> to reach the Shadow Realm.';
        }
    }
    if (room.id === 'shadow_realm') {
        if (!gameData.player.spells.has('soul_drain')) {
            return 'Hint: Solve the shadow weaving puzzle or use <b>use shadow_essence</b> to gain shadow mastery.';
        } else if (!gameData.player.flags.has('shadow_sorcerer_defeated')) {
            return 'Hint: Use <b>cast soul_drain guardian</b> to defeat the Shadow Sorcerer.';
        } else {
            return 'Hint: Try <b>go up</b> to reach the Tower Crown.';
        }
    }
    if (room.id === 'tower_crown') {
        if (!gameData.player.flags.has('archmage_defeated')) {
            return 'Hint: Use your most powerful spells and all your mastery to defeat the Archmage.';
        } else {
            return 'Hint: Congratulations! You have completed the Tower Trial.';
        }
    }
    // Default
    return 'Hint: Explore, look around, and try using or taking items you find!';
}
gameData.commands.hint = () => getUniversalHint(); 
