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
const STORAGE_DIR = path.dirname(STORAGE_PATH);

// Инициализация файла, если он не существует
function ensureStorage(): void {
  try {
    if (!fs.existsSync(STORAGE_PATH)) {
      const defaultData: DataSchema = { notes: [] };
      fs.writeFileSync(STORAGE_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
    }
  } catch (e) {
    // Если даже при создании базы данных возникла ошибка, лучше сообщить пользователю
    console.error('Ошибка инициализации хранилища:', e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

/**
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 */

// Генерация короткого ID (используем crypto для большей уникальности, если доступен, иначе fallback)
function generateId(length: number = 7): string {
  // Fallback implementation compatible with the original logic but slightly optimized
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const arr = new Uint32Array(length);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(arr);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[arr[i] % chars.length];
    }
    return result;
  }

  // Original fallback
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Чтение данных из файла
function readData(): DataSchema {
  try {
    ensureStorage();
    const content = fs.readFileSync(STORAGE_PATH, 'utf-8');
    if (!content.trim()) {
      // Если файл пустой, возвращаем дефолт и предупреждаем
      console.warn('Файл хранилища пуст. Создана новая база данных.');
      return { notes: [] };
    }
    return JSON.parse(content);
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error('Ошибка: файл хранилища поврежден. Пожалуйста, восстановите его из бэкапа.');
      process.exit(1);
    }
    // Другие ошибки IO
    console.error('Ошибка чтения хранилища:', e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

// Запись данных в файл
function writeData(data: DataSchema): void {
  try {
    // Обеспечиваем наличие директории на случай если STORAGE_DIR изменился или удален
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Ошибка записи в хранилище:', e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

/**
 * ПАРСЕР АРГУМЕНТОВ И ДИАГНОСТИКА
 */

// Вспомогательная функция для безопасного разрешения пути
function resolveSafePath(userPath: string, allowCreate: boolean = true): string {
  const resolved = path.resolve(userPath);

  // Блокировка выхода за пределы домашней директории или текущей директории (опционально)
  // Для импорта/экспорта часто полезно сохранять в Home, но запрещаем системные папки
  if (resolved.startsWith(os.homedir()) || resolved.startsWith('.')) {
    // Разрешаем
  } else {
    // Можно усилить контроль, запрещая запись в корень и системные папки
    // const systemPaths = ['/etc', '/usr', 'C:\\Windows'];
    // if (systemPaths.some(p => resolved.startsWith(p))) {
    //    throw new Error('Запись в эту директорию запрещена правилами безопасности.');
    // }
  }

  return resolved;
}

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
    // Исправление логики фильтрации: ИЛИ для тегов (более интуитивно), 
    // но оставим И как в оригинале, если это было требованием. 
    // Оригинал: every(t => n.tags.includes(t)) - требует ВСЕХ тегов.
    // Оставим оригинальную логику, так как она валидна для поиска пересечений.
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
  const lowerQuery = query.toLowerCase();
  const results = data.notes.filter(n =>
    n.text.toLowerCase().includes(lowerQuery) ||
    n.tags.some(t => t.toLowerCase().includes(lowerQuery))
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
  if (!note) {
    console.error(`Ошибка: заметка с ID "${id}" не найдена.`);
    process.exit(1);
    return; // Достижимо только если exit не сработает
  }

  note.done = done;
  writeData(data);
  console.log(`✅ Статус заметки "${id}" изменен на ${done ? 'выполнено' : 'в работе'}`);
}

function deleteNote(id: string): void {
  const data = readData();
  const originalLength = data.notes.length;
  data.notes = data.notes.filter(n => n.id !== id);

  if (data.notes.length === originalLength) {
    console.error(`Ошибка: заметка с ID "${id}" не найдена.`);
    process.exit(1);
    return;
  }

  writeData(data);
  console.log(`🗑 Заметка "${id}" удалена.`);
}

function showStats(): void {
  const data = readData();
  const total = data.notes.length;
  const done = data.notes.filter(n => n.done).length;
  const undone = total - done;

  console.log('📊 Статистика:');
  console.log(`   Всего заметок:     ${total}`);
  console.log(`   Выполнено:         ${done}`);
  console.log(`   В работе:          ${undone}`);

  // Группировка по тегам
  const tagCounts: Record<string, number> = {};
  data.notes.forEach(n => {
    n.tags.forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  if (Object.keys(tagCounts).length > 0) {
    console.log('   Популярные теги:');
    Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([tag, count]) => console.log(`     #${tag}: ${count}`));
  } else {
    console.log('   Тегов пока нет.');
  }
}

function exportData(destPath: string): void {
  const resolvedPath = resolveSafePath(destPath);

  // Проверка на запись в корень или системные директории (базовая защита)
  const systemPaths = ['/etc', '/usr', 'C:\\Windows', 'C:\\Program Files'];
  const home = os.homedir().replace(/\\/g, '/').toLowerCase();
  const resolvedLower = resolvedPath.replace(/\\/g, '/').toLowerCase();

  // Разрешаем запись в Home и текущую директорию
  const isSafe = resolvedLower.startsWith(home) || resolvedLower.startsWith('.') || resolvedLower.startsWith(process.cwd().replace(/\\/g, '/'));

  if (!isSafe) {
    console.error('Ошибка: экспорт в системные папки запрещен для безопасности.');
    process.exit(1);
    return;
  }

  const data = readData();
  try {
    fs.writeFileSync(resolvedPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`💾 Данные экспортированы в: ${resolvedPath}`);
  } catch (e) {
    console.error('Ошибка записи файла:', e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

function importData(importPath: string): void {
  const resolvedPath = resolveSafePath(importPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`Ошибка: файл для импорта не найден: ${resolvedPath}`);
    process.exit(1);
    return;
  }

  try {
    const importContent = fs.readFileSync(resolvedPath, 'utf-8');
    const imported: DataSchema = JSON.parse(importContent);

    // Валидация структуры импортируемых данных
    if (!Array.isArray(imported.notes)) {
      throw new Error('Неверный формат файла импорта: ожидается массив notes.');
    }

    const current = readData();

    let mergedCount = 0;
    imported.notes.forEach(impNote => {
      if (!current.notes.some(n => n.id === impNote.id)) {
        current.notes.push(impNote);
        mergedCount++;
      }
    });

    writeData(current);
    console.log(`📥 Импорт завершен. Добавлено новых заметок: ${mergedCount}`);
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error('Ошибка: импортируемый файл содержит невалидный JSON.');
    } else {
      console.error('Ошибка при импорте:', e instanceof Error ? e.message : e);
    }
    process.exit(1);
  }
}

/**
 * ГЛАВНАЯ ФУНКЦИЯ С ОБРАБОТКОЙ ОШИБОК
 */

function main(): void {
  try {
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
          console.error('Используйте: cnote add "Текст заметки"');
          process.exit(1);
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
          process.exit(1);
          return;
        }
        searchNotes(args[1]);
        break;
      }

      case 'done':
      case 'undone':
      case 'delete': {
        const id = args[1];
        if (!id) {
          console.error(`Ошибка: укажите ID заметки для команды '${command}'.`);
          console.error('Используйте формат: cnote ${command} <7-символьный ID>');
          process.exit(1);
          return;
        }
        // Валидация формата ID (длина 7 символов, допустимые символы)
        const idRegex = /^[A-Za-z0-9]{7}$/;
        if (!idRegex.test(id)) {
          console.error(`Ошибка: ID "${id}" имеет неверный формат. Ожидается 7 символов (буквы и цифры).`);
          process.exit(1);
          return;
        }

        if (command === 'delete') {
          deleteNote(id);
        } else {
          const isDone = command === 'done';
          setStatus(id, isDone);
        }
        break;
      }

      case 'stats':
        showStats();
        break;

      case 'export':
        if (!args[1]) {
          console.error('Ошибка: укажите путь для экспорта.');
          process.exit(1);
          return;
        }
        exportData(args[1]);
        break;

      case 'import':
        if (!args[1]) {
          console.error('Ошибка: укажите путь для импорта.');
          process.exit(1);
          return;
        }
        importData(args[1]);
        break;

      default:
        console.log(`Неизвестная команда: ${command}`);
        console.log('Используйте "cnote help" для просмотра списка команд.');
        process.exit(1);
    }
  } catch (e) {
// Глобальный перехват ошибок