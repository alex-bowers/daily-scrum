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

const { todos, loading, fetchTodos, addTodo, updateTodo, removeTodo, reorderTodos, carryOver, handleAdded, handleUpdated, handleDeleted, handleReordered } =
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

async function submitAdd() {
    const trimmed = newText.value.trim()
    if (!trimmed) return
    newText.value = ''
    await addTodo(selectedDate.value, trimmed)
}

async function submitCarryOver() {
    await carryOver(selectedDate.value)
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

        <button
            v-if="!isPast"
            type="button"
            class="todo-list__carry-btn"
            :disabled="loading"
            :aria-label="`Carry over from last active day for ${username}`"
            @click="submitCarryOver"
        >
            Carry over from last active day
        </button>

        <form v-if="!isPast" class="todo-list__form" @submit.prevent="submitAdd">
            <label :for="`todo-input-${username}`" class="visually-hidden">Add a todo for {{ username }}</label>
            <input
                :id="`todo-input-${username}`"
                v-model="newText"
                class="todo-list__input"
                placeholder="Add a todo…"
                maxlength="500"
            />
            <button type="submit" class="todo-list__add-btn">Add</button>
        </form>
    </div>
</template>
