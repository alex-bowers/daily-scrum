import { ref } from 'vue'

export function useTodos(username) {
    const todos = ref([])
    const loading = ref(false)

    async function fetchTodos(date) {
        loading.value = true
        try {
            const res = await fetch(`/api/todos/${encodeURIComponent(username)}/${date}`)
            todos.value = await res.json()
        } finally {
            loading.value = false
        }
    }

    async function addTodo(date, text) {
        const res = await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, date, text }),
        })
        if (!res.ok) throw new Error('Failed to add todo')
    }

    async function updateTodo(id, fields) {
        const res = await fetch(`/api/todos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fields),
        })
        if (!res.ok) throw new Error('Failed to update todo')
    }

    async function removeTodo(id) {
        const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete todo')
    }

    async function reorderTodos(items) {
        const res = await fetch('/api/todos/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items }),
        })
        if (!res.ok) throw new Error('Failed to reorder todos')
    }

    async function carryOver(toDate) {
        const res = await fetch('/api/todos/carry-over', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, toDate }),
        })
        if (!res.ok) throw new Error('Failed to carry over todos')
        return res.json()
    }

    function handleAdded(todo) {
        if (todo.username !== username) return
        if (!todos.value.find((t) => t.id === todo.id)) {
            todos.value.push(todo)
        }
    }

    function handleUpdated(todo) {
        if (todo.username !== username) return
        const i = todos.value.findIndex((t) => t.id === todo.id)
        if (i !== -1) todos.value[i] = todo
    }

    function handleDeleted({ id }) {
        todos.value = todos.value.filter((t) => t.id !== id)
    }

    function handleReordered({ items }) {
        const orderMap = new Map(items.map(({ id, sort_order }) => [id, sort_order]))
        const relevant = todos.value.some((t) => orderMap.has(t.id))
        if (!relevant) return
        todos.value = [...todos.value].sort((a, b) => {
            const oa = orderMap.has(a.id) ? orderMap.get(a.id) : a.sort_order
            const ob = orderMap.has(b.id) ? orderMap.get(b.id) : b.sort_order
            return oa - ob
        })
    }

    return {
        todos,
        loading,
        fetchTodos,
        addTodo,
        updateTodo,
        removeTodo,
        reorderTodos,
        carryOver,
        handleAdded,
        handleUpdated,
        handleDeleted,
        handleReordered,
    }
}
