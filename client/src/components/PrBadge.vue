<script setup>
import { computed } from 'vue'

const props = defineProps({
    count: {
        type: Number,
        required: true,
    },
    org: {
        type: String,
        default: '',
    },
    username: {
        type: String,
        default: '',
    },
})

const searchUrl = computed(() => {
    const q = encodeURIComponent(`org:${props.org} is:pr is:open review-requested:${props.username} -label:"on hold"`)
    return `https://github.com/search?q=${q}&type=pullrequests`
})
</script>

<template>
    <a
        :href="searchUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="pr-badge"
        :aria-label="`${count} pull request${count !== 1 ? 's' : ''} to review for ${username} (opens in new tab)`"
        :class="{
            'pr-badge--neutral': count <= 1,
            'pr-badge--amber': count >= 2 && count <= 3,
            'pr-badge--red': count >= 4,
        }"
        @click.stop
    >
        {{ count }} PR{{ count !== 1 ? 's' : '' }} to review
    </a>
</template>
