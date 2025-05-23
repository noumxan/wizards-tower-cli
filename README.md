# Wizard's Tower Trial - Python CLI Version

A command-line interface (CLI) version of the Wizard's Tower Trial game, implemented in Python using functional programming principles.

## Features

- Text-based adventure game with a rich command system
- Player movement and interaction with items
- Combat system with spells and guardians
- Puzzle-solving mechanics
- Save/load game functionality
- Guardian AI with different behavior patterns
- Hint system to help players progress

## Requirements

- Python 3.8 or higher
- Required packages (install using `pip install -r requirements.txt`):
  - typing-extensions
  - pathlib
  - colorama (for cross-platform terminal colors)

## Installation

1. Clone this repository or download the source code
2. Navigate to the game directory
3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Game

To start a new game:
```bash
python main.py
```

### Available Commands

- Movement:
  - `go [direction]` or `move [direction]` (north, south, east, west, up, down)
  - `look` or `examine` (to look around or examine items)
  
- Interaction:
  - `take [item]` (to pick up items)
  - `use [item]` (to use items from inventory)
  - `cast [spell] [target]` (to cast spells at targets)
  
- Information:
  - `inventory` or `inv` (to view inventory)
  - `status` (to check health, mana, and current room)
  - `hint` (to get a hint about what to do next)
  
- Game Commands:
  - `save` (to save the game)
  - `load` (to load a saved game)
  - `quit` or `exit` (to exit the game)
  - `help` (to show available commands)

## Running Tests

To run the test suite:
```bash
python -m unittest test_game.py
```

## Game Structure

- `main.py`: Main game loop and CLI interface
- `game_data.py`: Core data structures and models
- `game_engine.py`: Game logic and state management
- `test_game.py`: Unit tests for game mechanics

## Original Game

This is a CLI conversion of the original Wizard's Tower Trial game, which was implemented using HTML, CSS, and JavaScript. The original files are preserved in the repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 