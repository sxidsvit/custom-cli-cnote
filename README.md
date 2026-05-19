# cnote — CLI tool for managing local notes

`cnote` is a minimalist and convenient command-line interface (CLI) written in **Node.js** and **TypeScript**, which allows you to quickly create, view, search, and structure your local notes using tags directly from your terminal.

All data is securely stored in JSON format in your home directory, and the built-in interactive argument diagnostics system visually demonstrates how Node.js processes user input.

---

## 🚀 Features

- **Autonomy**: All notes are saved locally to `~/.cnote.json`. No cloud or third-party databases required.
- **Quick Access**: Unique short identifiers (7-character random IDs) allow you to easily manage specific records.
- **Tag System**: Ability to assign multiple tags to notes and flexibly filter the list.
- **Analytics**: Built-in command to view detailed statistics of your notes database.
- **Import & Export**: Easy backup of your data to any external JSON file and "smart" import (merging without ID duplicates).
- **Visual Diagnostics**: A beautiful, colored debug block on every run that shows the `process.argv` structure to help learn command-line mechanics from the inside.

---

## 📋 Note Structure

Each note has a strict TypeScript structure:

```typescript
interface Note {
  id: string // Short ID (7 characters, generated randomly)
  text: string // Your note's content
  tags: string[] // Array of tags, e.g., ["studies", "node"]
  createdAt: string // ISO string of the note creation date
  done: boolean // Note completion status (true/false)
}
```

---

## 🛠️ Environment Requirements

- **Node.js** version 16.x or higher.
- **npm** version 8.x or higher.

---

## 📦 Installation and Build

To run the project locally or prepare it for system-wide usage:

### 1. Install Dependencies

Clone the repository (or copy the files into a folder) and run the installer:

```bash
npm install
```

### 2. Build the Project

Compile the TypeScript source code into optimized JavaScript code inside the `dist` folder:

```bash
npm run build
```

### 3. Register Global System Command

Link the utility to your operating system to invoke it with the short `cnote` command from anywhere:

```bash
npm link
```

> ⚠️ **Important for Windows Users:** After running `npm link`, completely close your terminal window (or VS Code) and open it again for the system to update the environment paths and recognize the command.

---

## 💻 Commands and Usage Examples

Every command is executed using the pattern: `cnote <command> [arguments]`.

### 1. Add a Note (`cnote add`)

```bash
cnote add "<note text>" [--tag <tag>] [--tag <tag>]
```

**Example:**

```bash
cnote add "Prepare for the interview" --tag work --tag studies
```

### 2. View Note List (`cnote list`)

Displays saved notes with support for filtering by tags, completed, and uncompleted tasks.

```bash
# Show absolutely all notes
cnote list

# Filter only completed tasks
cnote list --done

# Filter only uncompleted tasks
cnote list --undone

# Filter by one or multiple tags simultaneously
cnote list --tag work --tag studies
```

### 3. Full-Text Search (`cnote search`)

Searches for matches in the note text or associated tag names (case-insensitive).

```bash
cnote search "<search query>"
```

**Example:**

```bash
cnote search "interv"
```

### 4. Mark as Completed (`cnote done`)

```bash
cnote done <note_id>
```

**Example:**

```bash
cnote done aB3dEfg
```

### 5. Unmark Completion (`cnote undone`)

```bash
cnote undone <note_id>
```

### 6. Delete a Note (`cnote delete`)

```bash
cnote delete <note_id>
```

### 7. Database Statistics (`cnote stats`)

Displays detailed info about your notes (total count, completed, in progress, unique tags).

```bash
cnote stats
```

### 8. Backup and Export (`cnote export`)

```bash
cnote export <path_to_file.json>
```

**Example:**

```bash
cnote export backup.json
```

### 9. Merge and Import Data (`cnote import`)

Loads data from a JSON backup. Notes with IDs that do not exist in your current database will be carefully appended (current local data remains intact).

```bash
cnote import <path_to_file.json>
```

---

## 🔬 How Argument Diagnostics Works (Educational)

On every execution of any command, a diagnostics block will appear in the console:

```text
=== ARGUMENT DIAGNOSTICS ===
Full process.argv array:
[
  'C:\\Program Files\\nodejs\\node.exe',
  'E:\\custom-cli\\dist\\cnote.js',
  'add',
  'Buy some milk',
  '--tag',
  'grocery'
]
...
```

It demonstrates visually how Node.js reads your input. System paths are trimmed using the `process.argv.slice(2)` method, and the remaining arguments are processed by the parser to route commands and flags.

---

## 🛠 Automating Analysis and Development with Continue

The `cnote` project supports integration with the **Continue** extension for VS Code. This allows you to automate code checking, bug hunting, and refactoring using local LLMs (via Ollama).

### Using Skills

You can use pre-prepared instructions for analyzing the project. All available skills are stored in the `.continue/skills/` folder.

#### How to run an analysis:

To run any skill (e.g., checking for bugs), use the universal command `/run-skill` in the Continue chat:

1. Open the Continue chat (`Ctrl + L`).

2. Type the command: `/run-skill`.

3. Type `@` and select the skill file you want to apply (e.g., `@.continue/skills/check-bugs.md`).

4. Type `@` again and select the code file you want to analyze (e.g., `@cnote.ts`).

5. Press **Enter**.

The model will automatically read your instructions from the `.md` file and apply them to the selected code.

### Adding Custom Project Rules

In the root of the project, there is a `PROJECT_RULES.md` file. It contains coding standards and typing rules for `cnote`.

To ensure the agent always follows these rules, use them in your prompts:

```
/ask @PROJECT_RULES.md Analyze this code for compliance with project standards.
```

This ensures the AI adheres to the strict typing and error-handling logic described in the `cnote` rules.
