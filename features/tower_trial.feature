Feature: Tower Trial - A Text-Based Wizard Adventure
  As a player
  I want to explore a magical tower
  So that I can become a master wizard

  Background:
    Given I am a novice wizard
    And I am standing at the tower entrance
    And I have 100 health points
    And I have 100 mana points
    And I know the fireball spell

  # Movement Scenarios
  Scenario: Moving between rooms
    When I go north
    Then I should enter the Grand Lobby
    And I should see the lobby's description
    And I should be able to go up to the library
    And I should be able to go south to return to the entrance

  Scenario: Attempting invalid movement
    When I try to go west from the entrance
    Then I should be told I cannot go that way
    And I should remain in the entrance

  # Combat Scenarios
  Scenario: Engaging a guardian in combat
    Given I am in the Grand Lobby
    And I encounter the Guardian of the Gate
    When I cast fireball at the guardian
    Then the guardian should take damage
    And my mana should decrease by 20
    When the guardian attacks me
    Then my health should decrease
    When I defeat the guardian
    Then I should receive a victory message
    And the path upward should be revealed

  # Puzzle Scenarios
  Scenario: Solving the library puzzle
    Given I am in the Arcane Library
    And I have the basic spell tome
    And I have the advanced spell tome
    When I use the basic spell tome
    And I use the advanced spell tome
    Then I should learn the teleport spell
    And the sanctum door should be unlocked

  Scenario: Collecting herbs in the garden
    Given I am in the Enchanted Garden
    And I find a rare herb
    And I find a common herb
    When I combine the herbs
    Then I should learn the shield spell
    And the puzzle should be marked as solved

  # Inventory Management
  Scenario: Managing inventory
    Given I am in a room with items
    When I take a health potion
    Then it should be added to my inventory
    When I use the health potion
    Then my health should increase by 30
    And the potion should be removed from my inventory

  # Spell Learning and Usage
  Scenario: Learning new spells
    Given I find a spell scroll
    When I use the spell scroll
    Then I should learn a new spell
    And the spell should be added to my known spells
    When I cast the new spell
    Then it should have the appropriate effect
    And my mana should decrease by the spell's cost

  # Progress Tracking
  Scenario: Tracking game progress
    Given I have defeated several guardians
    And I have solved several puzzles
    When I check my status
    Then I should see my current health and mana
    And I should see my current location
    And I should see my inventory
    And I should see my known spells

  # Floor Progression
  Scenario: Advancing through tower floors
    Given I have cleared the first floor
    When I reach the laboratory
    Then I should find new puzzles and guardians
    And I should discover more powerful spells
    When I reach the summit
    Then I should face the Tower Master
    And defeating the master should complete my trial

  # Advanced Floor Scenarios
  Scenario: Exploring the Frost Chamber
    Given I have reached the sixth floor
    When I enter the Frost Chamber
    Then I should see ice hazards
    And I should encounter the Frost Guardian
    When I solve the frost riddle
    Then I should learn the Ice Lance spell
    And I should gain ice mastery
    When I defeat the Frost Guardian
    Then the path to the Storm Peak should be revealed

  Scenario: Mastering the Storm Peak
    Given I have reached the seventh floor
    When I enter the Storm Peak
    Then I should see lightning hazards
    And I should encounter the Storm Drake
    When I master the winds
    Then I should learn the Arcane Mirror spell
    And I should gain wind mastery
    When I defeat the Storm Drake
    Then the path to the Shadow Realm should be revealed

  Scenario: Navigating the Shadow Realm
    Given I have reached the eighth floor
    When I enter the Shadow Realm
    Then I should see shadow hazards
    And I should encounter the Shadow Sorcerer
    When I master shadow weaving
    Then I should learn the Soul Drain spell
    And I should gain shadow mastery
    When I defeat the Shadow Sorcerer
    Then the path to the Tower Crown should be revealed

  # Hazard and Dodge Scenarios
  Scenario: Dodging environmental hazards
    Given I am in a room with active hazards
    When a hazard is triggered
    Then I should see a warning message
    When I use the dodge command
    Then I should avoid the hazard
    And my health should not decrease
    When I fail to dodge
    Then I should take damage
    And I should see a damage message

  Scenario: Using environmental mastery
    Given I have gained ice mastery
    When I enter a room with ice hazards
    Then I should navigate safely
    And I should not take damage
    Given I have gained wind mastery
    When I enter a room with wind hazards
    Then I should navigate safely
    And I should not take damage
    Given I have gained shadow mastery
    When I enter a room with shadow hazards
    Then I should navigate safely
    And I should not take damage

  # Save and Load Scenarios
  Scenario: Using quicksave and quickload
    Given I have made significant progress
    When I use the quicksave command
    Then my game state should be saved
    And I should see a save confirmation
    When I make changes to my game state
    And I use the quickload command
    Then my previous game state should be restored
    And I should see a load confirmation
    And my progress should be maintained

  # Boss AI Scenarios
  Scenario: Guardian pursuit behavior
    Given I am in a room connected to a guardian's room
    When the guardian detects me
    Then it should calculate a path to my location
    And it should move towards me
    When I move to a different room
    Then the guardian should recalculate its path
    And it should continue pursuing me
    When I defeat the guardian
    Then it should stop pursuing me

  # New Spell Scenarios
  Scenario: Using Ice Lance
    Given I know the Ice Lance spell
    When I cast it at a guardian
    Then the guardian should take 20 damage
    And the guardian should be slowed
    And my mana should decrease by 15
    When 30 seconds pass
    Then the slow effect should wear off

  Scenario: Using Arcane Mirror
    Given I know the Arcane Mirror spell
    When I cast it
    Then my mana should decrease by 25
    And I should gain a damage-absorbing shield
    When I take damage
    Then the shield should absorb up to 30 damage
    And my health should not decrease

  Scenario: Using Soul Drain
    Given I know the Soul Drain spell
    When I cast it at a guardian
    Then the guardian should take 50 damage
    And my health should increase by 25
    And my mana should decrease by 40

  # Branching Puzzle Scenarios
  Scenario: Solving puzzles through different methods
    Given I am in a room with a branching puzzle
    When I solve it through the primary method
    Then I should receive the standard reward
    And I should gain the associated mastery
    When I solve it through the alternate method
    Then I should receive the same reward
    And I should gain the associated mastery
    And I should unlock alternate paths

  # HUD and UI Scenarios
  Scenario: Viewing game status
    Given I am playing the game
    Then I should see my health bar
    And I should see my mana bar
    And I should see my current location
    And I should see my inventory
    When my health or mana changes
    Then the respective bars should update
    When I gain or lose items
    Then my inventory display should update
    When I learn new spells
    Then my spell list should update 