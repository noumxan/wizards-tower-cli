from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional, Callable, Union
from enum import Enum
from datetime import datetime

class Direction(Enum):
    NORTH = "north"
    SOUTH = "south"
    EAST = "east"
    WEST = "west"
    UP = "up"
    DOWN = "down"

class ItemType(Enum):
    SPELL = "spell"
    POTION = "potion"
    KEY = "key"
    TOME = "tome"
    SCROLL = "scroll"
    INGREDIENT = "ingredient"
    CRYSTAL = "crystal"
    MASTERY = "mastery"

class HazardType(Enum):
    ICE_SLIDE = "ice_slide"
    FREEZING_MIST = "freezing_mist"
    LIGHTNING_STRIKE = "lightning_strike"
    WIND_GUST = "wind_gust"
    SHADOW_TENDRILS = "shadow_tendrils"
    REALITY_SHIFT = "reality_shift"

class PuzzleType(Enum):
    FROST_RIDDLE = "frost_riddle"
    STORM_CONTROL = "storm_control"
    SHADOW_WEAVING = "shadow_weaving"
    BOOK_SEQUENCE = "book_sequence"
    HERB_COLLECTION = "herb_collection"
    POTION_BREWING = "potion_brewing"

class GuardianType(Enum):
    FROST_GUARDIAN = "frost_guardian"
    STORM_DRAKE = "storm_drake"
    SHADOW_SORCERER = "shadow_sorcerer"
    ARCHMAGE = "archmage"

@dataclass
class Hazard:
    type: HazardType
    damage: int
    message: str
    interval: Optional[int] = None  # For periodic hazards
    is_active: bool = False
    on_trigger: Optional[Callable[[], str]] = None

@dataclass
class Puzzle:
    type: PuzzleType
    required_items: List[str]
    alternate_solution: Optional[str] = None
    reward: str = ""
    on_solve: Optional[Callable[[str], str]] = None

@dataclass
class Guardian:
    name: str
    type: GuardianType
    health: int
    attack: int
    defense: int
    special_ability: str
    on_defeat: Callable[[], str]
    ai: Optional['GuardianAI'] = None

@dataclass
class GuardianAI:
    type: str = "pursuit"
    range: int = 3
    on_pursue: Optional[Callable[[str], str]] = None
    current_path: List[str] = field(default_factory=list)

@dataclass
class Room:
    id: str
    name: str
    description: str
    exits: Dict[Direction, str]
    items: List[str] = field(default_factory=list)
    guardian: Optional[Guardian] = None
    puzzle: Optional[Puzzle] = None
    hazards: List[Hazard] = field(default_factory=list)
    on_enter: Optional[Callable[[], str]] = None

@dataclass
class Spell:
    id: str
    name: str
    mana_cost: int
    damage: Optional[int] = None
    defense: Optional[int] = None
    effect: Optional[str] = None
    description: str = ""
    on_use: Optional[Callable[[str], str]] = None

@dataclass
class Potion:
    id: str
    name: str
    effect: int
    description: str = ""
    on_use: Optional[Callable[[], str]] = None

@dataclass
class Item:
    id: str
    name: str
    type: ItemType
    description: str = ""
    on_use: Optional[Callable[[str], str]] = None

@dataclass
class Mastery:
    id: str
    name: str
    type: ItemType = ItemType.MASTERY
    description: str = ""
    on_acquire: Optional[Callable[[], str]] = None

@dataclass
class Player:
    current_room: str
    inventory: List[str] = field(default_factory=list)
    health: int = 100
    mana: int = 100
    flags: Set[str] = field(default_factory=set)
    spells: Set[str] = field(default_factory=lambda: {"fireball"})
    masteries: Set[str] = field(default_factory=set)
    last_save: Optional[datetime] = None

@dataclass
class GameState:
    player: Player
    rooms: Dict[str, Room]
    items: Dict[str, Union[Item, Spell, Potion, Mastery]]
    commands: Dict[str, Callable]
    active_hazards: Set[str] = field(default_factory=set)
    guardian_positions: Dict[str, str] = field(default_factory=dict)

@dataclass
class SaveData:
    player: Player
    timestamp: datetime
    version: str = "1.0"

# Command handler type definitions
CommandHandler = Callable[[str, Optional[str]], str]
CommandMap = Dict[str, CommandHandler]

# Example usage:
"""
# Creating a hazard
ice_slide = Hazard(
    type=HazardType.ICE_SLIDE,
    damage=10,
    message="The floor is slick with ice!",
    on_trigger=lambda: "You slip on the ice and take damage!" if not player.masteries.contains("ice") else "Your ice mastery protects you."
)

# Creating a guardian with AI
frost_guardian = Guardian(
    name="Frost Guardian",
    type=GuardianType.FROST_GUARDIAN,
    health=250,
    attack=35,
    defense=30,
    special_ability="frost_nova",
    on_defeat=lambda: "The Frost Guardian shatters!",
    ai=GuardianAI(
        type="pursuit",
        range=3,
        on_pursue=lambda target: find_path_to_player("frost_chamber", target)[0]
    )
)

# Creating a room with all features
frost_chamber = Room(
    id="frost_chamber",
    name="Frost Chamber",
    description="A vast chamber of ice and snow...",
    exits={
        Direction.DOWN: "summit",
        Direction.EAST: "ice_library",
        Direction.UP: "storm_peak"
    },
    items=["frost_crystal"],
    hazards=[ice_slide],
    guardian=frost_guardian,
    puzzle=Puzzle(
        type=PuzzleType.FROST_RIDDLE,
        required_items=["frost_crystal"],
        alternate_solution="ice_mastery",
        reward="ice_lance_spell"
    )
)

# Creating a new spell
ice_lance = Spell(
    id="ice_lance",
    name="Ice Lance Spell",
    mana_cost=15,
    damage=20,
    effect="slow",
    description="Launches a spear of ice that damages and slows the target."
)

# Creating a game state
game_state = GameState(
    player=Player(current_room="entrance"),
    rooms={"frost_chamber": frost_chamber},
    items={"ice_lance": ice_lance},
    commands={}
)
""" 