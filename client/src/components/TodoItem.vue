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

// Match markdown links [text](url) and plain URLs
const MARKDOWN_LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g
const URL_RE = /https?:\/\/[^\s<>"]+/g

const renderedText = computed(() => {
    let text = props.todo.text

    // Escape HTML first
    text = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

    // Replace markdown-style links [text](url) with HTML links
    text = text.replace(MARKDOWN_LINK_RE, (match, linkText, url) => {
        // Make sure to escape the link text but not the URL
        const escapedText = linkText
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${escapedText}</a>`
    })

    // Replace any remaining plain URLs (that weren't part of markdown links)
    // We need to be careful not to replace URLs that are already in href attributes
    const parts = text.split(/(<a[^>]*>.*?<\/a>)/g)
    text = parts.map((part, index) => {
        // Skip parts that are already links (odd indices after split)
        if (part.startsWith('<a ')) {
            return part
        }
        // Replace plain URLs in text parts
        return part.replace(URL_RE, (url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
        })
    }).join('')

    return text
})

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
            const text = editText.value
            editText.value = text.substring(0, start) + result + text.substring(end)

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
            const text = editText.value
            editText.value = text.substring(0, start) + plainText + text.substring(end)

            setTimeout(() => {
                input.selectionStart = input.selectionEnd = start + plainText.length
            }, 0)
        }
    }
    // If no HTML data, let the default paste behavior handle plain text
}

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
            :aria-label="`Mark as ${todo.completed ? 'incomplete' : 'complete'}: ${todo.text}`"
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
            :aria-label="`Edit todo: ${todo.text}`"
            @paste="handlePaste"
            @blur="commitEdit"
            @keyup.enter="commitEdit"
            @keyup.escape="cancelEdit"
        />

        <button
            v-if="!readonly && !editing"
            class="todo-item__edit-btn"
            @click="startEdit"
            :aria-label="`Edit: ${todo.text}`"
        >
            <span aria-hidden="true">✎</span>
        </button>

        <button
            v-if="!readonly"
            class="todo-item__delete"
            @click="emit('remove', todo.id)"
            :aria-label="`Delete: ${todo.text}`"
        >
            &times;
        </button>
    </li>
</template>