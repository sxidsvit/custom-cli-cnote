#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
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
function generateId(length = 7) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
// Чтение данных из файла
function readData() {
    try {
        const content = fs.readFileSync(STORAGE_PATH, 'utf-8');
        return JSON.parse(content);
    }
    catch (e) {
        return { notes: [] };
    }
}
// Запись данных в файл
function writeData(data) {
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2));
}
/**
 * РЕАЛИЗАЦИЯ КОМАНД
 */
function addNote(text, tags) {
    const data = readData();
    const newNote = {
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
function listNotes(filterTags, showDone, showUndone) {
    const data = readData();
    let filtered = data.notes;
    if (filterTags.length > 0) {
        filtered = filtered.filter(n => filterTags.every(t => n.tags.includes(t)));
    }
    if (showDone && !showUndone) {
        filtered = filtered.filter(n => n.done);
    }
    else if (showUndone && !showDone) {
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
function searchNotes(query) {
    const data = readData();
    const results = data.notes.filter(n => n.text.toLowerCase().includes(query.toLowerCase()) ||
        n.tags.some(t => t.toLowerCase().includes(query.toLowerCase())));
    if (results.length === 0) {
        console.log(`Ничего не найдено по запросу: "${query}"`);
        return;
    }
    results.forEach(n => {
        console.log(`${n.done ? '[X]' : '[ ]'} ${n.id}: ${n.text}`);
    });
}
function setStatus(id, done) {
    const data = readData();
    const note = data.notes.find(n => n.id === id);
    if (note) {
        note.done = done;
        writeData(data);
        console.log(`Статус заметки ${id} обновлен.`);
    }
    else {
        console.error(`Ошибка: Заметка с ID ${id} не найдена.`);
    }
}
function deleteNote(id) {
    const data = readData();
    const initialLength = data.notes.length;
    data.notes = data.notes.filter(n => n.id !== id);
    if (data.notes.length < initialLength) {
        writeData(data);
        console.log(`Заметка ${id} удалена.`);
    }
    else {
        console.error(`Ошибка: Заметка с ID ${id} не найдена.`);
    }
}
function showStats() {
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
function exportData(exportPath) {
    const data = readData();
    try {
        fs.writeFileSync(path.resolve(exportPath), JSON.stringify(data, null, 2));
        console.log(`Данные успешно экспортированы в: ${exportPath}`);
    }
    catch (e) {
        console.error('Ошибка при экспорте:', e);
    }
}
function importData(importPath) {
    try {
        const importContent = fs.readFileSync(path.resolve(importPath), 'utf-8');
        const imported = JSON.parse(importContent);
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
    }
    catch (e) {
        console.error('Ошибка при импорте:', e);
    }
}
/**
 * ПАРСЕР АРГУМЕНТОВ И ДИАГНОСТИКА
 */
function main() {
    // --- БЛОК О Т Л А Д К И ---
    // console.log('\x1b[33m%s\x1b[0m', '=== ДИАГНОСТИКА АРГУМЕНТОВ ===');
    // console.log('Полный массив process.argv:');
    // console.dir(process.argv);
    // console.log('\nРазбор аргументов по индексам:');
    // process.argv.forEach((value, index) => {
    //   let description = '';
    //   if (index === 0) description = '<- Путь к Node.js';
    //   if (index === 1) description = '<- Путь к исполняемому файлу';
    //   if (index === 2) description = '<- Команда (command)';
    //   if (index > 2) description = `<- Доп. аргумент №${index - 2}`;
    //   console.log(`  Индекс [${index}]: "${value}" ${description}`);
    // });
    // console.log('\x1b[33m%s\x1b[0m', '==============================\n');
    // --- КОНЕЦ БЛОКА ОТЛАДКИ ---
    const args = process.argv.slice(2);
    const command = args[0];
    if (!command) {
        console.log('Использование: cnote <command> [args]');
        return;
    }
    switch (command) {
        case 'add': {
            const text = args[1];
            if (!text) {
                console.error('Ошибка: текст заметки обязателен.');
                return;
            }
            const tags = [];
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
            const tags = [];
            let done = false;
            let undone = false;
            for (let i = 1; i < args.length; i++) {
                if (args[i] === '--tag' && args[i + 1]) {
                    tags.push(args[i + 1]);
                    i++;
                }
                else if (args[i] === '--done')
                    done = true;
                else if (args[i] === '--undone')
                    undone = true;
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
            if (!args[1])
                return;
            setStatus(args[1], true);
            break;
        case 'undone':
            if (!args[1])
                return;
            setStatus(args[1], false);
            break;
        case 'delete':
            if (!args[1])
                return;
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
    }
}
main();
