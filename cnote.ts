#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * ИНТЕРФЕЙСЫ И ТИПЫ
 */

interface Note {
  id: string;
  text: string;
  tags: string[];
  createdAt: string;
  done: boolean;
}

interface DataSchema {
  notes: Note[];
}

/**
 * КОНФИГУРАЦИЯ ХРАНИЛИЩА
 */
const STORAGE_PATH = path.join(os.homedir(), '.cnote.json');

// Инициализация файла, если он не существует
if (!fs.existsSync(STORAGE_PATH)) {
  fs.writeFileSync(STORAGE_PATH, JSON.stringify({ notes: [] }, null, 2));
}

/**
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 */

// Генерация короткого ID (аналог nanoid)
function generateId(length: number = 7): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Чтение данных из файла
function readData(): DataSchema {
  try {
    const content = fs.readFileSync(STORAGE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return { notes: [] };
  }
}

// Запись данных в файл
function writeData(data: DataSchema): void {
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2));
}

/**
 * РЕАЛИЗАЦИЯ КОМАНД
 */

function showHelp(): void {
  console.log(`
==================================================================
  cnote — CLI-утилита для управления локальными заметками 📝
==================================================================

Использование:
  cnote <команда> [аргументы]

Основной список команд:
  add "<текст>"     Добавить новую заметку.
                    Пример: cnote add "Купить молоко"
                    Можно указать теги: cnote add "Задачка" --tag работа --tag важная

  list              Показать все ваши заметки.
                    Флаги фильтрации:
                    --done      Только выполненные
                    --undone    Только невыполненные
                    --tag <имя> Фильтр по конкретному тегу (можно несколько)

  search "<текст>"  Полнотекстовый поиск по содержимому заметок и тегов.
                    Пример: cnote search "собеседование"

  done <id>         Отметить заметку как выполненную (id — 7 символов).
                    Пример: cnote done a1b2c3d

  undone <id>       Вернуть выполненную заметку обратно в работу.
                    Пример: cnote undone a1b2c3d

  delete <id>       Навсегда удалить заметку из базы данных.
                    Пример: cnote delete a1b2c3d

Управление данными и статистика:
  stats             Показать аналитику (всего заметок, сколько выполнено, теги).
  
  export <путь>     Сохранить резервную копию всех заметок в JSON-файл.
                    Пример: cnote export backup.json

  import <путь>     Загрузить заметки из бэкапа (существующие не затрутся).
                    Пример: cnote import backup.json

Справка:
  help              Показать это руководство пользователя.
==================================================================
  `);
}

function addNote(text: string, tags: string[]): void {
  const data = readData();
  const newNote: Note = {
    id: generateId(),
    text,
    tags,
    createdAt: new Date().toISOString(),
    done: false,
  };
  data.notes.push(newNote);
  writeData(data);
  console.log(`✅ Заметка добавлена! ID: ${newNote.id}`);
}

function listNotes(filterTags: string[], showDone?: boolean, showUndone?: boolean): void {
  const data = readData();
  let filtered = data.notes;

  if (filterTags.length > 0) {
    filtered = filtered.filter(n => filterTags.every(t => n.tags.includes(t)));
  }

  if (showDone && !showUndone) {
    filtered = filtered.filter(n => n.done);
  } else if (showUndone && !showDone) {
    filtered = filtered.filter(n => !n.done);
  }

  if (filtered.length === 0) {
    console.log('Заметок не найдено.');
    return;
  }

  filtered.forEach(n => {
    const status = n.done ? '[X]' : '[ ]';
    const tagsStr = n.tags.length > 0 ? ` #${n.tags.join(' #')}` : '';
    console.log(`${status} ${n.id} | ${n.text}${tagsStr} (${new Date(n.createdAt).toLocaleDateString()})`);
  });
}

function searchNotes(query: string): void {
  const data = readData();
  const results = data.notes.filter(n =>
    n.text.toLowerCase().includes(query.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  );

  if (results.length === 0) {
    console.log(`Ничего не найдено по запросу: "${query}"`);
    return;
  }

  results.forEach(n => {
    console.log(`${n.done ? '[X]' : '[ ]'} ${n.id}: ${n.text}`);
  });
}

function setStatus(id: string, done: boolean): void {
  const data = readData();
  const note = data.notes.find(n => n.id === id);
  if (note) {
    note.done = done;
    writeData(data);
    console.log(`Статус заметки ${id} обновлен.`);
  } else {
    console.error(`Ошибка: Заметка с ID ${id} не найдена.`);
  }
}

function deleteNote(id: string): void {
  const data = readData();
  const initialLength = data.notes.length;
  data.notes = data.notes.filter(n => n.id !== id);

  if (data.notes.length < initialLength) {
    writeData(data);
    console.log(`Заметка ${id} удалена.`);
  } else {
    console.error(`Ошибка: Заметка с ID ${id} не найдена.`);
  }
}

function showStats(): void {
  const data = readData();
  const total = data.notes.length;
  const doneCount = data.notes.filter(n => n.done).length;
  const undoneCount = total - doneCount;

  const allTags = data.notes.flatMap(n => n.tags);
  const uniqueTags = new Set(allTags);

  console.log('--- Статистика ---');
  console.log(`Всего заметок: ${total}`);
  console.log(`Выполнено:     ${doneCount}`);
  console.log(`В процессе:    ${undoneCount}`);
  console.log(`Уникальных тегов: ${uniqueTags.size}`);
}

function exportData(exportPath: string): void {
  const data = readData();
  try {
    fs.writeFileSync(path.resolve(exportPath), JSON.stringify(data, null, 2));
    console.log(`Данные успешно экспортированы в: ${exportPath}`);
  } catch (e) {
    console.error('Ошибка при экспорте:', e);
  }
}

function importData(importPath: string): void {
  try {
    const importContent = fs.readFileSync(path.resolve(importPath), 'utf-8');
    const imported: DataSchema = JSON.parse(importContent);
    const current = readData();

    let mergedCount = 0;
    imported.notes.forEach(impNote => {
      if (!current.notes.some(n => n.id === impNote.id)) {
        current.notes.push(impNote);
        mergedCount++;
      }
    });

    writeData(current);
    console.log(`Импорт завершен. Добавлено новых заметок: ${mergedCount}`);
  } catch (e) {
    console.error('Ошибка при импорте:', e);
  }
}

/**
 * ПАРСЕР АРГУМЕНТОВ И ДИАГНОСТИКА
 */

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    showHelp();
    return;
  }

  switch (command) {
    case 'help':
      showHelp();
      break;

    case 'add': {
      const text = args[1];
      if (!text) {
        console.error('Ошибка: текст заметки обязателен.');
        return;
      }
      const tags: string[] = [];
      for (let i = 2; i < args.length; i++) {
        if (args[i] === '--tag' && args[i + 1]) {
          tags.push(args[i + 1]);
          i++;
        }
      }
      addNote(text, tags);
      break;
    }

    case 'list': {
      const tags: string[] = [];
      let done = false;
      let undone = false;
      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--tag' && args[i + 1]) {
          tags.push(args[i + 1]);
          i++;
        } else if (args[i] === '--done') done = true;
        else if (args[i] === '--undone') undone = true;
      }
      listNotes(tags, done, undone);
      break;
    }

    case 'search': {
      if (!args[1]) {
        console.error('Ошибка: укажите поисковый запрос.');
        return;
      }
      searchNotes(args[1]);
      break;
    }

    case 'done':
      if (!args[1]) return;
      setStatus(args[1], true);
      break;

    case 'undone':
      if (!args[1]) return;
      setStatus(args[1], false);
      break;

    case 'delete':
      if (!args[1]) return;
      deleteNote(args[1]);
      break;

    case 'stats':
      showStats();
      break;

    case 'export':
      if (!args[1]) {
        console.error('Ошибка: укажите путь для экспорта.');
        return;
      }
      exportData(args[1]);
      break;

    case 'import':
      if (!args[1]) {
        console.error('Ошибка: укажите путь для импорта.');
        return;
      }
      importData(args[1]);
      break;

    default:
      console.log(`Неизвестная команда: ${command}`);
      console.log('Используйте "cnote help" для просмотра списка команд.');
  }
}

main();