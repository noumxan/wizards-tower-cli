import os
import sys
from typing import Optional, Callable, List, Tuple
from functools import partial
from dataclasses import dataclass
from game_data import GameState, load_game_data, save_game_state, load_game_state, Result
from game_engine import process_command, update_guardians

# Pure functions for terminal operations
def clear_screen() -> None:
    """Clear the terminal screen."""
    os.system('cls' if os.name == 'nt' else 'clear')

def print_message(message: str) -> None:
    """Print a message to the terminal."""
    print(message)

# Pure functions for game messages
def get_welcome_message() -> str:
    """Get the welcome message."""
    return """
    🧙 Welcome to the Wizard's Tower Trial! 🧙
    
    You are an apprentice wizard seeking to master the arcane arts.
    Your journey begins at the entrance of an ancient wizard's tower.
    Solve puzzles, defeat guardians, and learn powerful spells to become the tower's master.
    
    Type 'help' for a list of commands.
    Type 'quit' to exit the game.
    """

def get_help_message() -> str:
    """Get the help message."""
    return """
    Available Commands:
    ------------------
    Movement:
        go north/south/east/west/up/down
        move, walk, run (synonyms for go)
    
    Interaction:
        look, examine [object]
        take [item]
        use [item] [on target]
        cast [spell] [target]
    
    Information:
        inventory (or bag, items)
        status (or health, mana)
        hint
    
    Game:
        save
        load
        quit
    
    Examples:
        go north
        take tome_basic
        use health_potion
        cast fireball guardian
        look
        examine tome_basic
    """

def get_victory_message() -> str:
    """Get the victory message."""
    return """
    🎉 Congratulations! 🎉
    
    You have defeated the Archmage and become the new master of the tower!
    Your journey to master the arcane arts is complete.
    
    Thank you for playing the Wizard's Tower Trial!
    """

def get_game_over_message() -> str:
    """Get the game over message."""
    return "\nYou have been defeated! Game over."

# Pure functions for game state display
def format_room_display(state: GameState) -> str:
    """Format the current room display."""
    current_room = state.get_current_room()
    messages = [
        f"\n{current_room.name}",
        "=" * len(current_room.name),
        current_room.description
    ]
    
    if current_room.items:
        messages.extend([
            "\nItems here:",
            *[f"- {state.items[item_id].name}" for item_id in current_room.items]
        ])
    
    messages.extend([
        "\nExits:",
        *[f"- {direction.value}: {state.rooms[room_id].name}"
          for direction, room_id in current_room.exits.items()]
    ])
    
    if current_room.guardian:
        messages.extend([
            f"\nA {current_room.guardian.name} blocks your path!",
            f"Health: {current_room.guardian.health}"
        ])
    
    return "\n".join(messages)

# Pure functions for game state management
def get_save_filename() -> str:
    """Get the save filename from user input."""
    filename = input("Enter save filename (default: save.json): ").strip()
    if not filename:
        return "save.json"
    return filename if filename.endswith('.json') else f"{filename}.json"

def handle_save(state: GameState) -> Result[None]:
    """Handle saving the game."""
    filename = get_save_filename()
    result = save_game_state(state, filename)
    if result.error:
        print_message(f"Error saving game: {result.error}")
    else:
        print_message(f"Game saved to {filename}")
    return result

def handle_load() -> Result[GameState]:
    """Handle loading the game."""
    filename = get_save_filename()
    result = load_game_state(filename)
    if result.error:
        print_message(f"Error loading game: {result.error}")
    elif result.value:
        print_message(f"Game loaded from {filename}")
    else:
        print_message("No save file found.")
    return result

# Pure functions for game flow control
def is_game_over(state: GameState) -> bool:
    """Check if the game is over."""
    return state.player.health <= 0

def is_victory(state: GameState) -> bool:
    """Check if the player has won."""
    return (state.player.current_room == "tower_crown" and
            state.has_game_flag("archmage_defeated"))

def handle_special_command(command: str, state: GameState) -> Optional[Tuple[GameState, bool]]:
    """Handle special game commands."""
    if command.lower() in ('quit', 'exit'):
        if input("Save game before quitting? (y/n) ").lower() == 'y':
            handle_save(state)
        return state, True
    
    elif command.lower() == 'help':
        print_message(get_help_message())
        return state, False
    
    elif command.lower() == 'save':
        handle_save(state)
        return state, False
    
    elif command.lower() == 'load':
        result = handle_load()
        if result.value:
            return result.value, False
    
    return None

def process_game_turn(state: GameState, command: str) -> Tuple[GameState, bool]:
    """Process a single game turn."""
    # Handle special commands
    special_result = handle_special_command(command, state)
    if special_result:
        return special_result
    
    # Process regular command
    new_state, response = process_command(state, command)
    print_message(f"\n{response}")
    
    # Update guardians
    new_state = update_guardians(new_state)
    
    # Check game state
    if is_game_over(new_state):
        print_message(get_game_over_message())
        return new_state, True
    
    if is_victory(new_state):
        print_message(get_victory_message())
        return new_state, True
    
    return new_state, False

def game_loop(initial_state: GameState) -> None:
    """Main game loop using functional style."""
    def loop(state: GameState) -> None:
        # Display current room
        print_message(format_room_display(state))
        
        try:
            command = input("\nWhat will you do? ").strip()
        except (KeyboardInterrupt, EOFError):
            print_message("\nGame interrupted. Saving...")
            handle_save(state)
            return
        
        new_state, should_exit = process_game_turn(state, command)
        if not should_exit:
            loop(new_state)
    
    loop(initial_state)

def initialize_game() -> Result[GameState]:
    """Initialize or load the game state."""
    # Load game data
    game_data = load_game_data()
    if game_data.error:
        return Result.failure(f"Error loading game data: {game_data.error}")
    
    rooms, items, spells = game_data.value
    
    # Get initial state
    while True:
        choice = input("Start new game (n) or load saved game (l)? ").lower()
        if choice == 'l':
            result = handle_load()
            if result.value:
                return result
        elif choice == 'n':
            return Result.success(GameState.new_game(rooms, items, spells))
        else:
            print_message("Invalid choice. Please enter 'n' or 'l'.")

def main() -> None:
    """Main entry point using functional style."""
    clear_screen()
    print_message(get_welcome_message())
    
    # Initialize game
    result = initialize_game()
    if result.error:
        print_message(result.error)
        sys.exit(1)
    
    # Start game loop
    game_loop(result.value)

if __name__ == '__main__':
    main() 