<script setup>
import { ref } from 'vue'
import PrBadge from './PrBadge.vue'
import TodoList from './TodoList.vue'

const props = defineProps({
    username: {
        type: String,
        required: true,
    },
    org: {
        type: String,
        default: '',
    },
    prCount: {
        type: Number,
        default: null,
    },
    wsHandlers: {
        type: Object,
        required: true,
    },
})

const expanded = ref(true)
</script>

<template>
    <div class="card" :class="{ 'card--expanded': expanded }">
        <button class="card__header" @click="expanded = !expanded">
            <span class="card__username">{{ username }}</span>
            <PrBadge v-if="prCount !== null" :count="prCount" :org="org" :username="username" />
            <span class="card__chevron" aria-hidden="true">{{ expanded ? '▲' : '▼' }}</span>
        </button>

        <div v-if="expanded" class="card__body">
            <TodoList :username="username" :wsHandlers="wsHandlers" />
        </div>
    </div>
</template>
