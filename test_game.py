import unittest
from game_data import (
    GameState, Player, Room, Item, Spell, Direction,
    ItemType, Guardian, Hazard, Puzzle, Result
)
from game_engine import (
    move_player, look_around, take_item, use_item,
    cast_spell, show_inventory, show_status, get_hint,
    process_command, update_guardians
)

class TestGameEngine(unittest.TestCase):
    def setUp(self):
        """Set up test data."""
        # Create test items
        self.items = {
            "health_potion": Item(
                id="health_potion",
                name="Health Potion",
                type=ItemType.POTION,
                effect=30,
                description="A red potion that restores health."
            ),
            "tome_basic": Item(
                id="tome_basic",
                name="Basic Spell Tome",
                type=ItemType.TOME,
                effect=None,
                description="A basic spell tome."
            ),
            "tome_advanced": Item(
                id="tome_advanced",
                name="Advanced Spell Tome",
                type=ItemType.TOME,
                effect=None,
                description="An advanced spell tome."
            )
        }
        
        # Create test spells
        self.spells = {
            "fireball": Spell(
                id="fireball",
                name="Fireball",
                type=ItemType.SPELL,
                mana_cost=20,
                damage=25,
                defense=0,
                effect="A ball of fire.",
                description="A basic fire spell."
            ),
            "shield": Spell(
                id="shield",
                name="Shield",
                type=ItemType.SPELL,
                mana_cost=15,
                damage=0,
                defense=10,
                effect="A protective barrier.",
                description="A defensive spell."
            )
        }
        
        # Create test rooms
        self.rooms = {
            "entrance": Room(
                id="entrance",
                name="Tower Entrance",
                description="The entrance to the tower.",
                exits={Direction.NORTH: "lobby"},
                items=["tome_basic", "tome_advanced"],
                guardian=None,
                hazards=[],
                puzzle=None
            ),
            "lobby": Room(
                id="lobby",
                name="Grand Lobby",
                description="The grand lobby.",
                exits={Direction.SOUTH: "entrance"},
                items=["health_potion"],
                guardian=Guardian(
                    name="Guardian of the Gate",
                    health=50,
                    attack=10,
                    defense=5,
                    special_ability=None,
                    ai_type="pursuit",
                    ai_range=3
                ),
                hazards=[],
                puzzle=None
            )
        }
        
        # Create initial game state
        self.state = GameState.new_game(self.rooms, self.items, self.spells)
    
    def test_move_player(self):
        """Test player movement."""
        # Test valid movement
        new_state, message = move_player(self.state, "north")
        self.assertEqual(new_state.player.current_room, "lobby")
        self.assertIn("You enter", message)
        
        # Test invalid direction
        _, message = move_player(self.state, "invalid")
        self.assertIn("Invalid direction", message)
        
        # Test invalid movement
        _, message = move_player(self.state, "east")
        self.assertIn("cannot go that way", message)
    
    def test_look_around(self):
        """Test looking around."""
        # Test looking at current room
        _, message = look_around(self.state)
        self.assertIn("Tower Entrance", message)
        self.assertIn("Basic Spell Tome", message)
        
        # Test looking at specific item
        _, message = look_around(self.state, "tome_basic")
        self.assertIn("Basic Spell Tome", message)
        
        # Test looking at non-existent item
        _, message = look_around(self.state, "invalid")
        self.assertIn("don't see that", message)
    
    def test_take_item(self):
        """Test taking items."""
        # Test taking valid item
        new_state, message = take_item(self.state, "tome_basic")
        self.assertIn("tome_basic", new_state.player.inventory)
        self.assertIn("take", message)
        
        # Test taking non-existent item
        _, message = take_item(self.state, "invalid")
        self.assertIn("can't take", message)
        
        # Test taking item not in room
        _, message = take_item(self.state, "health_potion")
        self.assertIn("can't take", message)
    
    def test_use_item(self):
        """Test using items."""
        # Take an advanced tome first (which teaches shield spell)
        state, _ = take_item(self.state, "tome_advanced")
        
        # Test using tome - should learn shield spell
        new_state, message = use_item(state, "tome_advanced", None)
        self.assertIn("learn", message)
        self.assertIn("shield", new_state.player.spells)
        
        # Test using non-existent item
        _, message = use_item(state, "invalid")
        self.assertIn("don't have", message)
        
        # Move to lobby and take health potion
        state, _ = move_player(state, "north")
        state, _ = take_item(state, "health_potion")
        
        # Test using health potion
        new_state, message = use_item(state, "health_potion")
        self.assertEqual(new_state.player.health, 100)  # Max health
        self.assertIn("feel revitalized", message)
    
    def test_cast_spell(self):
        """Test spell casting."""
        # Move to room with guardian
        state, _ = move_player(self.state, "north")
        
        # Test casting fireball at guardian
        new_state, message = cast_spell(state, "fireball", "guardian")
        self.assertIn("hit", message)
        self.assertLess(new_state.rooms["lobby"].guardian.health, 50)
        
        # Test casting unknown spell
        _, message = cast_spell(state, "invalid", "guardian")
        self.assertIn("don't know", message)
        
        # Test casting without target
        _, message = cast_spell(state, "fireball")
        self.assertIn("target", message)
    
    def test_show_inventory(self):
        """Test inventory display."""
        # Test empty inventory
        _, message = show_inventory(self.state)
        self.assertIn("empty", message)
        
        # Test inventory with items
        state, _ = take_item(self.state, "tome_basic")
        _, message = show_inventory(state)
        self.assertIn("Basic Spell Tome", message)
    
    def test_show_status(self):
        """Test status display."""
        _, message = show_status(self.state)
        self.assertIn("Health: 100", message)
        self.assertIn("Mana: 100", message)
        self.assertIn("Fireball", message)
    
    def test_get_hint(self):
        """Test getting hints."""
        _, message = get_hint(self.state)
        self.assertIn("Hint:", message)
    
    def test_process_command(self):
        """Test command processing."""
        # Test valid command
        _, message = process_command(self.state, "look")
        self.assertIn("Tower Entrance", message)
        
        # Test invalid command
        _, message = process_command(self.state, "invalid")
        self.assertIn("don't understand", message)
        
        # Test command synonyms
        _, message = process_command(self.state, "move north")
        self.assertIn("You enter", message)
    
    def test_update_guardians(self):
        """Test guardian updates."""
        # Move to lobby
        state, _ = move_player(self.state, "north")
        
        # Update guardians
        new_state = update_guardians(state)
        self.assertIsNotNone(new_state.rooms["lobby"].guardian)

if __name__ == '__main__':
    unittest.main() 