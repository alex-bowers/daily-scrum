<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useTodos } from '../composables/useTodos.js'
import TodoItem from './TodoItem.vue'

const props = defineProps({
    username: {
        type: String,
        required: true,
    },
    wsHandlers: {
        type: Object,
        required: true,
    },
})

const today = new Date().toISOString().slice(0, 10)
const selectedDate = ref(today)
const isToday = computed(() => selectedDate.value === today)
const isPast = computed(() => selectedDate.value < today)
const newText = ref('')

const { todos, loading, fetchTodos, addTodo, updateTodo, removeTodo, reorderTodos, handleAdded, handleUpdated, handleDeleted, handleReordered } =
    useTodos(props.username)

const draggingId = ref(null)
let dragIndex = null

props.wsHandlers['todo:added'].push(handleAdded)
props.wsHandlers['todo:updated'].push(handleUpdated)
props.wsHandlers['todo:deleted'].push(handleDeleted)
props.wsHandlers['todo:reordered'].push((payload) => {
    // Ignore own broadcast during active drag.
    if (draggingId.value !== null) return
    handleReordered(payload)
})

watch(selectedDate, (date) => fetchTodos(date), { immediate: true })

function handlePaste(e) {
    const clipboardData = e.clipboardData || window.clipboardData

    // Try to get HTML data first (contains link information)
    const htmlData = clipboardData.getData('text/html')

    if (htmlData) {
        e.preventDefault()

        // Create a temporary element to parse the HTML
        const temp = document.createElement('div')
        temp.innerHTML = htmlData

        // Find all links in the HTML
        const links = temp.querySelectorAll('a')
        const linkMap = new Map()

        links.forEach(link => {
            const href = link.getAttribute('href')
            const text = link.textContent.trim()
            if (href && text) {
                // Store the link with a placeholder
                const placeholder = `__LINK_${linkMap.size}__`
                linkMap.set(placeholder, { text, href })
                link.replaceWith(document.createTextNode(placeholder))
            }
        })

        // Get the plain text content (now with placeholders)
        let result = temp.textContent || temp.innerText || ''

        // Replace placeholders with markdown links
        linkMap.forEach((linkData, placeholder) => {
            result = result.replace(placeholder, `[${linkData.text}](${linkData.href})`)
        })

        // If we got a result, use it; otherwise fall back to plain text
        if (result.trim()) {
            const input = e.target
            const start = input.selectionStart
            const end = input.selectionEnd
            const text = newText.value
            newText.value = text.substring(0, start) + result + text.substring(end)

            // Set cursor position after inserted text
            setTimeout(() => {
                input.selectionStart = input.selectionEnd = start + result.length
            }, 0)
        } else {
            // Fallback to plain text
            const plainText = clipboardData.getData('text/plain')
            const input = e.target
            const start = input.selectionStart
            const end = input.selectionEnd
            const text = newText.value
            newText.value = text.substring(0, start) + plainText + text.substring(end)

            setTimeout(() => {
                input.selectionStart = input.selectionEnd = start + plainText.length
            }, 0)
        }
    }
    // If no HTML data, let the default paste behavior handle plain text
}

async function submitAdd() {
    const trimmed = newText.value.trim()
    if (!trimmed) return
    newText.value = ''
    await addTodo(selectedDate.value, trimmed)
}

async function toggle(id, completed) {
    await updateTodo(id, { completed })
}

async function edit(id, text) {
    await updateTodo(id, { text })
}

async function remove(id) {
    await removeTodo(id)
}

function onDragStart(e, todo, index) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(todo.id))
    draggingId.value = todo.id
    dragIndex = index
}

function onDragOver(e, index) {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const items = [...todos.value]
    const [dragged] = items.splice(dragIndex, 1)
    items.splice(index, 0, dragged)
    todos.value = items
    dragIndex = index
}

async function onDragEnd() {
    if (draggingId.value === null) return
    draggingId.value = null
    dragIndex = null
    await reorderTodos(todos.value.map((t, i) => ({ id: t.id, sort_order: i })))
}

function prevDay() {
    const d = new Date(selectedDate.value)
    d.setDate(d.getDate() - 1)
    selectedDate.value = d.toISOString().slice(0, 10)
}

function nextDay() {
    const d = new Date(selectedDate.value)
    d.setDate(d.getDate() + 1)
    selectedDate.value = d.toISOString().slice(0, 10)
}
</script>

<template>
    <div class="todo-list">
        <div class="todo-list__nav">
            <button class="todo-list__nav-btn" @click="prevDay" aria-label="Previous day">&larr;</button>
            <span class="todo-list__date">{{ isToday ? 'Today' : selectedDate }}</span>
            <button class="todo-list__nav-btn" @click="nextDay" aria-label="Next day">&rarr;</button>
        </div>

        <p v-if="loading" class="todo-list__loading" role="status">Loading&hellip;</p>

        <ul v-else class="todo-list__items" :aria-label="`${username}'s todos`">
            <TodoItem
                v-for="(todo, index) in todos"
                :key="todo.id"
                :todo="todo"
                :draggable="!isPast"
                :class="{ 'todo-item--dragging': todo.id === draggingId }"
                @toggle="toggle"
                @edit="edit"
                @remove="remove"
                @dragstart="(e) => onDragStart(e, todo, index)"
                @dragover="(e) => onDragOver(e, index)"
                @dragend="onDragEnd"
            />
            <li v-if="todos.length === 0" class="todo-list__empty">No todos yet.</li>
        </ul>

        <form v-if="!isPast" class="todo-list__form" @submit.prevent="submitAdd">
            <label :for="`todo-input-${username}`" class="visually-hidden">Add a todo for {{ username }}</label>
            <input
                :id="`todo-input-${username}`"
                v-model="newText"
                class="todo-list__input"
                placeholder="Add a todo…"
                maxlength="500"
                @paste="handlePaste"
            />
            <button type="submit" class="todo-list__add-btn">Add</button>
        </form>
    </div>
</template>