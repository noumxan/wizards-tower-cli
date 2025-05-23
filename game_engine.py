from dataclasses import dataclass, replace
from typing import Dict, List, Set, Optional, Tuple, Callable, TypeVar, Generic
from functools import reduce, partial
from operator import or_, and_
from itertools import chain
from game_data import (
    GameState, Player, Room, Item, Spell, Direction,
    ItemType, Guardian, Hazard, Puzzle, Result
)

# Type aliases for clarity
T = TypeVar('T')
CommandResult = Tuple[GameState, str]
CommandHandler = Callable[[GameState, str], CommandResult]

# Pure functions for game state transformations
def update_player(state: GameState, player_update: Callable[[Player], Player]) -> GameState:
    """Apply a pure function to update the player state."""
    return replace(state, player=player_update(state.player))

def update_room(state: GameState, room_id: str, room_update: Callable[[Room], Room]) -> GameState:
    """Apply a pure function to update a room."""
    return replace(
        state,
        rooms={**state.rooms, room_id: room_update(state.rooms[room_id])}
    )

def update_game_flags(state: GameState, new_flags: Set[str]) -> GameState:
    """Add new game flags."""
    return replace(state, game_flags=state.game_flags | new_flags)

def update_visited_rooms(state: GameState, new_room: str) -> GameState:
    """Add a room to visited rooms."""
    return replace(state, visited_rooms=state.visited_rooms | {new_room})

# Pure functions for game mechanics
def validate_direction(direction: str) -> Result[Direction]:
    """Validate and convert a direction string to a Direction enum."""
    try:
        return Result.success(Direction(direction.lower()))
    except ValueError:
        return Result.failure("Invalid direction. Try: north, south, east, west, up, down.")

def can_move_to(state: GameState, direction: Direction) -> Result[str]:
    """Check if player can move in the given direction."""
    current_room = state.get_current_room()
    if not current_room.has_exit(direction):
        return Result.failure("You cannot go that way.")
    return Result.success(current_room.get_exit(direction))

def move_player(state: GameState, direction: str) -> CommandResult:
    """Move the player in the specified direction."""
    result = validate_direction(direction)
    if result.error:
        return state, result.error
    
    result = can_move_to(state, result.value)
    if result.error:
        return state, result.error
    
    next_room_id = result.value
    new_state = update_player(
        update_visited_rooms(state, next_room_id),
        lambda p: replace(p, current_room=next_room_id)
    )
    return new_state, format_room_entry(state.rooms[next_room_id], state)

def format_room_entry(room: Room, state: GameState) -> str:
    """Format the room entry message."""
    messages = [
        f"You enter {room.name}.",
        room.description
    ]
    
    if room.guardian and not state.is_room_visited(room.id):
        messages.append(f"A {room.guardian.name} blocks your path!")
    
    active_hazards = room.get_active_hazards()
    if active_hazards:
        messages.append(active_hazards[0].message)
    
    return "\n".join(messages)

def look_around(state: GameState, target: Optional[str] = None) -> CommandResult:
    """Look at the current room or examine a specific item."""
    if not target:
        return state, format_room_description(state.get_current_room(), state)
    
    item = state.get_item(target)
    if item:
        return state, f"{item.name}\n{item.description}"
    
    return state, "You don't see that here."

def format_room_description(room: Room, state: GameState) -> str:
    """Format the room description with items and exits."""
    messages = [
        f"{room.name}",
        room.description
    ]
    
    if room.items:
        messages.extend([
            "\nItems here:",
            *[f"- {state.items[item_id].name}" for item_id in room.items]
        ])
    
    messages.extend([
        "\nExits:",
        *[f"- {direction.value}: {state.rooms[room_id].name}"
          for direction, room_id in room.exits.items()]
    ])
    
    return "\n".join(messages)

def take_item(state: GameState, item_id: str) -> CommandResult:
    """Take an item from the current room."""
    current_room = state.get_current_room()
    
    if item_id not in current_room.items:
        return state, "You can't take that."
    
    item = state.get_item(item_id)
    if not item:
        return state, "That item doesn't exist."
    
    new_state = update_room(
        update_player(state, lambda p: p.add_item(item_id)),
        current_room.id,
        lambda r: replace(r, items=[i for i in r.items if i != item_id])
    )
    
    return new_state, f"You take the {item.name}."

def use_item(state: GameState, item_id: str, target: Optional[str] = None) -> CommandResult:
    """Use an item from inventory."""
    if not state.player.has_item(item_id):
        return state, "You don't have that item."
    
    item = state.get_item(item_id)
    if not item:
        return state, "That item doesn't exist."
    
    current_room = state.get_current_room()
    
    # Handle different item types using pattern matching
    if item.type == ItemType.POTION:
        if item_id == "health_potion":
            new_state = update_player(
                state,
                lambda p: p.update_health(item.apply_effect(p.health, 100))
            )
            return new_state, "You feel revitalized!"
        
        elif item_id == "mana_potion":
            new_state = update_player(
                state,
                lambda p: p.update_mana(item.apply_effect(p.mana, 100))
            )
            return new_state, "Your magical energy is restored!"
    
    elif item.type == ItemType.TOME:
        # Handle tome usage - no target needed
        if item_id == "tome_basic" and not state.player.knows_spell("fireball"):
            new_state = update_player(state, lambda p: p.add_spell("fireball"))
            return new_state, "You learn the Fireball spell!"
        
        elif item_id == "tome_advanced" and not state.player.knows_spell("shield"):
            new_state = update_player(state, lambda p: p.add_spell("shield"))
            return new_state, "You learn the Shield spell!"
        
        return state, "You already know the spells in this tome."
    
    # Handle puzzle items
    if current_room.puzzle and item_id in current_room.puzzle.required_items:
        if current_room.puzzle.can_solve(state.player.inventory):
            new_state = update_player(
                update_game_flags(state, {f"{current_room.id}_puzzle_solved"}),
                lambda p: p.add_spell(current_room.puzzle.reward)
            )
            return new_state, f"You solve the puzzle and learn the {current_room.puzzle.reward} spell!"
    
    return state, "You can't use that item here."

def cast_spell(state: GameState, spell_id: str, target: Optional[str] = None) -> CommandResult:
    """Cast a spell at a target."""
    if not state.player.knows_spell(spell_id):
        return state, "You don't know that spell."
    
    spell = state.get_spell(spell_id)
    if not spell:
        return state, "That spell doesn't exist."
    
    if not spell.can_cast(state.player.mana):
        return state, "Not enough mana!"
    
    current_room = state.get_current_room()
    
    if spell_id == "fireball":
        if not target or target != "guardian":
            return state, "You need to target a guardian!"
        
        if not current_room.guardian:
            return state, "There is no guardian here!"
        
        # Calculate damage and update guardian
        damage = spell.calculate_damage(current_room.guardian.defense)
        new_guardian = current_room.guardian.take_damage(damage)
        
        # Update game state
        new_state = update_player(
            state,
            lambda p: p.update_mana(p.mana - spell.mana_cost)
        )
        
        if not new_guardian.is_alive():
            # Guardian defeated
            new_state = update_game_flags(
                update_room(
                    new_state,
                    current_room.id,
                    lambda r: replace(r, guardian=None)
                ),
                {f"{current_room.id}_cleared"}
            )
            return new_state, f"You defeat the {current_room.guardian.name}!"
        else:
            # Guardian damaged
            new_state = update_room(
                new_state,
                current_room.id,
                lambda r: replace(r, guardian=new_guardian)
            )
            return new_state, f"You hit the {current_room.guardian.name} for {damage} damage!"
    
    elif spell_id == "shield":
        new_state = update_player(
            state,
            lambda p: p.add_flag("shield_active").update_mana(p.mana - spell.mana_cost)
        )
        return new_state, "You cast Shield!"
    
    return state, "You can't cast that spell here."

def show_inventory(state: GameState) -> CommandResult:
    """Show the player's inventory."""
    if not state.player.inventory:
        return state, "Your inventory is empty."
    
    items = [state.items[item_id].name for item_id in state.player.inventory]
    return state, "Inventory:\n" + "\n".join(f"- {item}" for item in items)

def show_status(state: GameState) -> CommandResult:
    """Show the player's status."""
    current_room = state.get_current_room()
    messages = [
        f"Health: {state.player.health}/100",
        f"Mana: {state.player.mana}/100",
        f"Current Room: {current_room.name}",
        "\nSpells Known:"
    ]
    
    spells = [state.spells[spell_id] for spell_id in state.player.spells]
    messages.extend(f"- {spell.name} (Cost: {spell.mana_cost} mana)" for spell in spells)
    
    return state, "\n".join(messages)

def get_hint(state: GameState) -> CommandResult:
    """Get a hint for the current room."""
    current_room = state.get_current_room()
    
    # Define hint rules as pure functions
    hint_rules = [
        # Library hints
        lambda: (
            current_room.id == "library" and
            not state.player.has_item("spell_scroll") and
            "Hint: Take the spell scroll with 'take spell_scroll'."
        ),
        lambda: (
            current_room.id == "library" and
            state.player.has_item("spell_scroll") and
            not state.player.has_item("tome_advanced") and
            "Hint: Take the advanced tome with 'take tome_advanced'."
        ),
        lambda: (
            current_room.id == "library" and
            state.player.has_item("tome_advanced") and
            not state.player.knows_spell("shield") and
            "Hint: Use the spell scroll with 'use spell_scroll' to learn a new spell."
        ),
        lambda: (
            current_room.id == "library" and
            state.player.knows_spell("shield") and
            not state.has_game_flag(f"{current_room.id}_puzzle_solved") and
            "Hint: Use 'use tome_basic' and 'use tome_advanced' to solve the puzzle!"
        ),
        lambda: (
            current_room.id == "library" and
            state.has_game_flag(f"{current_room.id}_puzzle_solved") and
            "Hint: You have solved the library puzzle! Try 'go up' to continue your ascent."
        ),
        
        # Lobby hints
        lambda: (
            current_room.id == "lobby" and
            current_room.guardian and
            not state.has_game_flag(f"{current_room.id}_cleared") and
            "Hint: Cast fireball at the guardian with 'cast fireball guardian'."
        ),
        lambda: (
            current_room.id == "lobby" and
            (not current_room.guardian or state.has_game_flag(f"{current_room.id}_cleared")) and
            "Hint: Try 'go up' to reach the library."
        ),
        
        # Entrance hints
        lambda: (
            current_room.id == "entrance" and
            not state.player.has_item("tome_basic") and
            "Hint: Take the basic spell tome with 'take tome_basic'."
        ),
        lambda: (
            current_room.id == "entrance" and
            state.player.has_item("tome_basic") and
            "Hint: Try 'go north' to enter the tower."
        ),
        
        # Default hint
        lambda: "Hint: Explore, look around, and try using or taking items you find!"
    ]
    
    # Find the first matching hint rule
    hint = next((rule() for rule in hint_rules if rule()), "No hint available.")
    return state, hint

# Command handler mapping using pure functions
COMMAND_HANDLERS: Dict[str, CommandHandler] = {
    "go": lambda state, args: move_player(state, args),
    "look": lambda state, args: look_around(state, args),
    "examine": lambda state, args: look_around(state, args),
    "take": lambda state, args: take_item(state, args),
    "use": lambda state, args: use_item(state, *args.split(" on ")),
    "cast": lambda state, args: cast_spell(state, *args.split()),
    "inventory": lambda state, _: show_inventory(state),
    "status": lambda state, _: show_status(state),
    "hint": lambda state, _: get_hint(state)
}

# Command synonyms using pure functions
COMMAND_SYNONYMS: Dict[str, str] = {
    "move": "go",
    "walk": "go",
    "run": "go",
    "inspect": "examine",
    "check": "look",
    "view": "look",
    "pick": "take",
    "grab": "take",
    "cast": "cast",
    "attack": "cast",
    "bag": "inventory",
    "items": "inventory",
    "health": "status",
    "mana": "status"
}

def process_command(state: GameState, command: str) -> CommandResult:
    """Process a game command and return the new state and response."""
    # Split command into action and arguments using pure functions
    parts = command.lower().strip().split(maxsplit=1)
    action = COMMAND_SYNONYMS.get(parts[0], parts[0])
    args = parts[1] if len(parts) > 1 else ""
    
    # Get command handler using pure function
    handler = COMMAND_HANDLERS.get(action)
    if not handler:
        return state, "I don't understand that command. Try 'help' for a list of commands."
    
    # Execute command
    return handler(state, args)

def find_path_to_player(
    start_room: str,
    target_room: str,
    rooms: Dict[str, Room]
) -> List[str]:
    """Find a path from start room to target room using functional BFS."""
    def get_next_rooms(path: List[str]) -> List[List[str]]:
        current = path[-1]
        if current == target_room:
            return [path]
        return [
            path + [next_room]
            for next_room in rooms[current].exits.values()
            if next_room not in path
        ]
    
    def bfs(queue: List[List[str]], visited: Set[str]) -> List[str]:
        if not queue:
            return [start_room]
        path = queue[0]
        if path[-1] == target_room:
            return path
        new_paths = get_next_rooms(path)
        new_visited = visited | {path[-1]}
        return bfs(queue[1:] + new_paths, new_visited)
    
    return bfs([[start_room]], {start_room})

def update_guardians(state: GameState) -> GameState:
    """Update guardian positions using functional transformations."""
    def should_move_guardian(room: Room) -> bool:
        return (room.guardian and
                room.guardian.ai_type == "pursuit" and
                room.id != state.player.current_room)
    
    def move_guardian(room: Room) -> Optional[Tuple[str, Room]]:
        if not should_move_guardian(room):
            return None
        
        path = find_path_to_player(room.id, state.player.current_room, state.rooms)
        if len(path) <= 1:
            return None
        
        next_room_id = path[1]
        next_room = state.rooms[next_room_id]
        return (
            (room.id, replace(room, guardian=None)),
            (next_room_id, replace(next_room, guardian=room.guardian))
        )
    
    # Collect all guardian movements
    movements = list(filter(None, map(move_guardian, state.rooms.values())))
    
    # Apply all movements to create new room state
    new_rooms = dict(state.rooms)
    for old_room, new_room in chain.from_iterable(movements):
        new_rooms[old_room] = new_room
    
    return replace(state, rooms=new_rooms) 