from dataclasses import dataclass, field, replace
from typing import Dict, List, Set, Optional, Callable, Any, TypeVar, Generic
from enum import Enum
import json
from pathlib import Path
from functools import reduce
from operator import or_

# Type variables for generic functions
T = TypeVar('T')
S = TypeVar('S')

class ItemType(Enum):
    SPELL = "spell"
    POTION = "potion"
    KEY = "key"
    TOME = "tome"
    SCROLL = "scroll"
    CRYSTAL = "crystal"
    ESSENCE = "essence"

class Direction(Enum):
    NORTH = "north"
    SOUTH = "south"
    EAST = "east"
    WEST = "west"
    UP = "up"
    DOWN = "down"

# Generic Result type for functional error handling
@dataclass(frozen=True)
class Result(Generic[T]):
    value: Optional[T] = None
    error: Optional[str] = None

    @classmethod
    def success(cls, value: T) -> 'Result[T]':
        return cls(value=value)

    @classmethod
    def failure(cls, error: str) -> 'Result[T]':
        return cls(error=error)

    def map(self, f: Callable[[T], S]) -> 'Result[S]':
        if self.error:
            return Result.failure(self.error)
        return Result.success(f(self.value))

    def bind(self, f: Callable[[T], 'Result[S]']) -> 'Result[S]':
        if self.error:
            return Result.failure(self.error)
        return f(self.value)

# Pure function to create a Result from a computation
def safe_call(f: Callable[..., T], *args, **kwargs) -> Result[T]:
    try:
        return Result.success(f(*args, **kwargs))
    except Exception as e:
        return Result.failure(str(e))

@dataclass(frozen=True)
class Spell:
    id: str
    name: str
    type: ItemType = ItemType.SPELL
    mana_cost: int = 0
    damage: int = 0
    defense: int = 0
    effect: Optional[str] = None
    description: str = ""

    def can_cast(self, mana: int) -> bool:
        return mana >= self.mana_cost

    def calculate_damage(self, target_defense: int) -> int:
        return max(1, self.damage - target_defense)

@dataclass(frozen=True)
class Item:
    id: str
    name: str
    type: ItemType
    effect: Optional[int] = None
    description: str = ""

    def apply_effect(self, current_value: int, max_value: int) -> int:
        if self.effect is None:
            return current_value
        return min(max_value, current_value + self.effect)

@dataclass(frozen=True)
class Guardian:
    name: str
    health: int
    attack: int
    defense: int
    special_ability: Optional[str] = None
    ai_type: str = "pursuit"
    ai_range: int = 3

    def is_alive(self) -> bool:
        return self.health > 0

    def take_damage(self, damage: int) -> 'Guardian':
        return replace(self, health=max(0, self.health - damage))

@dataclass(frozen=True)
class Hazard:
    type: str
    damage: int
    message: str
    interval: Optional[int] = None

    def is_active(self) -> bool:
        return self.interval is None

@dataclass(frozen=True)
class Puzzle:
    type: str
    required_items: List[str]
    reward: str
    alternate_solution: Optional[str] = None

    def can_solve(self, inventory: List[str]) -> bool:
        return all(item in inventory for item in self.required_items)

@dataclass(frozen=True)
class Room:
    id: str
    name: str
    description: str
    exits: Dict[Direction, str]
    items: List[str] = field(default_factory=list)
    guardian: Optional[Guardian] = None
    hazards: List[Hazard] = field(default_factory=list)
    puzzle: Optional[Puzzle] = None

    def get_active_hazards(self) -> List[Hazard]:
        return list(filter(lambda h: h.is_active(), self.hazards))

    def has_exit(self, direction: Direction) -> bool:
        return direction in self.exits

    def get_exit(self, direction: Direction) -> Optional[str]:
        return self.exits.get(direction)

@dataclass(frozen=True)
class Player:
    current_room: str
    inventory: List[str] = field(default_factory=list)
    health: int = 100
    mana: int = 100
    flags: Set[str] = field(default_factory=set)
    spells: Set[str] = field(default_factory=lambda: {"fireball"})

    def has_item(self, item_id: str) -> bool:
        return item_id in self.inventory

    def knows_spell(self, spell_id: str) -> bool:
        return spell_id in self.spells

    def has_flag(self, flag: str) -> bool:
        return flag in self.flags

    def add_item(self, item_id: str) -> 'Player':
        return replace(self, inventory=self.inventory + [item_id])

    def remove_item(self, item_id: str) -> 'Player':
        return replace(self, inventory=[i for i in self.inventory if i != item_id])

    def add_spell(self, spell_id: str) -> 'Player':
        return replace(self, spells=self.spells | {spell_id})

    def add_flag(self, flag: str) -> 'Player':
        return replace(self, flags=self.flags | {flag})

    def update_health(self, new_health: int) -> 'Player':
        return replace(self, health=max(0, min(100, new_health)))

    def update_mana(self, new_mana: int) -> 'Player':
        return replace(self, mana=max(0, min(100, new_mana)))

@dataclass(frozen=True)
class GameState:
    player: Player
    rooms: Dict[str, Room]
    items: Dict[str, Item]
    spells: Dict[str, Spell]
    visited_rooms: Set[str] = field(default_factory=set)
    game_flags: Set[str] = field(default_factory=set)

    @classmethod
    def new_game(cls, rooms: Dict[str, Room], items: Dict[str, Item], spells: Dict[str, Spell]) -> 'GameState':
        """Create a new game state with initial values."""
        initial_player = Player(
            current_room="entrance",
            inventory=[],
            health=100,
            mana=100,
            flags=set(),
            spells={"fireball"}
        )
        return cls(
            player=initial_player,
            rooms=rooms,
            items=items,
            spells=spells,
            visited_rooms={"entrance"},
            game_flags=set()
        )

    def get_current_room(self) -> Room:
        return self.rooms[self.player.current_room]

    def get_item(self, item_id: str) -> Optional[Item]:
        return self.items.get(item_id)

    def get_spell(self, spell_id: str) -> Optional[Spell]:
        return self.spells.get(spell_id)

    def is_room_visited(self, room_id: str) -> bool:
        return room_id in self.visited_rooms

    def has_game_flag(self, flag: str) -> bool:
        return flag in self.game_flags

    def to_dict(self) -> dict:
        """Convert game state to a dictionary for saving."""
        return {
            "player": {
                "current_room": self.player.current_room,
                "inventory": list(self.player.inventory),
                "health": self.player.health,
                "mana": self.player.mana,
                "flags": list(self.player.flags),
                "spells": list(self.player.spells)
            },
            "visited_rooms": list(self.visited_rooms),
            "game_flags": list(self.game_flags)
        }

    @classmethod
    def from_dict(cls, data: dict, rooms: Dict[str, Room], 
                  items: Dict[str, Item], spells: Dict[str, Spell]) -> 'GameState':
        """Create a game state from a saved dictionary."""
        player = Player(
            current_room=data["player"]["current_room"],
            inventory=data["player"]["inventory"],
            health=data["player"]["health"],
            mana=data["player"]["mana"],
            flags=set(data["player"]["flags"]),
            spells=set(data["player"]["spells"])
        )
        return cls(
            player=player,
            rooms=rooms,
            items=items,
            spells=spells,
            visited_rooms=set(data["visited_rooms"]),
            game_flags=set(data["game_flags"])
        )

# Pure functions for game data operations
def load_json_file(path: Path) -> Result[dict]:
    return safe_call(lambda: json.loads(path.read_text()))

def parse_room(data: dict) -> Room:
    """Parse a room dictionary into a Room instance."""
    guardian_data = data.get("guardian")
    guardian = None if guardian_data is None else Guardian(**guardian_data)
    
    hazards = [Hazard(**h) for h in data.get("hazards", [])]
    
    puzzle_data = data.get("puzzle")
    puzzle = None if puzzle_data is None else Puzzle(**puzzle_data)
    
    exits = {Direction(k): v for k, v in data["exits"].items()}
    
    return Room(
        id=data["id"],
        name=data["name"],
        description=data["description"],
        exits=exits,
        items=data.get("items", []),
        guardian=guardian,
        hazards=hazards,
        puzzle=puzzle
    )

def parse_item(data: dict) -> Item:
    """Parse an item dictionary into an Item instance."""
    return Item(
        id=data["id"],
        name=data["name"],
        type=ItemType(data["type"]),
        effect=data.get("effect"),
        description=data["description"]
    )

def parse_spell(data: dict) -> Spell:
    """Parse a spell dictionary into a Spell instance."""
    return Spell(
        id=data["id"],
        name=data["name"],
        type=ItemType(data["type"]),
        mana_cost=data["mana_cost"],
        damage=data["damage"],
        defense=data["defense"],
        effect=data.get("effect"),
        description=data["description"]
    )

def load_game_data() -> Result[tuple[Dict[str, Room], Dict[str, Item], Dict[str, Spell]]]:
    """Load the game's static data (rooms, items, spells) from JSON files."""
    data_dir = Path("data")
    
    def load_and_parse_rooms() -> Result[Dict[str, Room]]:
        return (load_json_file(data_dir / "rooms.json")
                .map(lambda data: {k: parse_room(v) for k, v in data.items()}))
    
    def load_and_parse_items() -> Result[Dict[str, Item]]:
        return (load_json_file(data_dir / "items.json")
                .map(lambda data: {k: parse_item(v) for k, v in data.items()}))
    
    def load_and_parse_spells() -> Result[Dict[str, Spell]]:
        return (load_json_file(data_dir / "spells.json")
                .map(lambda data: {k: parse_spell(v) for k, v in data.items()}))
    
    # Use functional composition to load and parse all data
    return (load_and_parse_rooms()
            .bind(lambda rooms: load_and_parse_items()
                  .bind(lambda items: load_and_parse_spells()
                        .map(lambda spells: (rooms, items, spells)))))

def save_game_state(state: GameState, filename: str = "save.json") -> Result[None]:
    """Save the current game state to a file."""
    return safe_call(lambda: Path(filename).write_text(
        json.dumps(state.to_dict(), indent=2)
    ))

def load_game_state(filename: str = "save.json") -> Result[GameState]:
    """Load a game state from a file."""
    return (load_json_file(Path(filename))
            .bind(lambda data: load_game_data()
                  .map(lambda game_data: GameState.from_dict(data, *game_data)))) 