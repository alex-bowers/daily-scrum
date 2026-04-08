<script setup>
import { ref, nextTick, computed } from 'vue'

const props = defineProps({
    todo: {
        type: Object,
        required: true,
    },
    readonly: {
        type: Boolean,
        default: false,
    },
    draggable: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['toggle', 'edit', 'remove', 'dragstart', 'dragend', 'dragover'])

const editing = ref(false)
const editText = ref('')
const inputEl = ref(null)

const URL_RE = /https?:\/\/[^\s<>"]+/g

const renderedText = computed(() => {
    const escaped = props.todo.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    return escaped.replace(URL_RE, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`)
})

async function startEdit() {
    if (props.readonly) return
    editText.value = props.todo.text
    editing.value = true
    await nextTick()
    inputEl.value?.focus()
}

function commitEdit() {
    const trimmed = editText.value.trim()
    if (trimmed && trimmed !== props.todo.text) {
        emit('edit', props.todo.id, trimmed)
    }
    editing.value = false
}

function cancelEdit() {
    editing.value = false
}
</script>

<template>
    <li
        class="todo-item"
        :class="{ 'todo-item--done': todo.completed }"
        :draggable="draggable"
        @dragstart="emit('dragstart', $event)"
        @dragend="emit('dragend', $event)"
        @dragover="emit('dragover', $event)"
    >
        <span v-if="draggable" class="todo-item__drag-handle" aria-hidden="true">⠿</span>

        <input
            v-if="!readonly"
            type="checkbox"
            :checked="todo.completed"
            @change="emit('toggle', todo.id, !todo.completed)"
            class="todo-item__checkbox"
        />
        <span v-if="readonly" class="todo-item__checkbox-placeholder" />

        <span v-if="!editing" class="todo-item__text" @dblclick="startEdit" v-html="renderedText" />
        <input
            v-else
            ref="inputEl"
            v-model="editText"
            class="todo-item__edit-input"
            @blur="commitEdit"
            @keyup.enter="commitEdit"
            @keyup.escape="cancelEdit"
        />

        <button
            v-if="!readonly"
            class="todo-item__delete"
            @click="emit('remove', todo.id)"
            aria-label="Delete todo"
        >
            &times;
        </button>
    </li>
</template>
