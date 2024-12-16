<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  useFloating, 
  autoUpdate, 
  offset, 
  flip, 
  shift 
} from '@floating-ui/vue'

const props = defineProps({
  placement: {
    type: String,
    default: 'top'
  }
})

const referenceEl = ref(null)
const floatingEl = ref(null)
const isOpen = ref(false)

const { floatingStyles } = useFloating(
  referenceEl, 
  floatingEl, 
  {
    placement: props.placement,
    middleware: [
      offset(10),
      flip(),
      shift()
    ],
    whileElementsMounted: autoUpdate
  }
)

const togglePopover = (event) => {
  event.stopPropagation()
  isOpen.value = !isOpen.value
}

const handleClickOutside = (event) => {
  if (
    referenceEl.value && 
    floatingEl.value && 
    !referenceEl.value.contains(event.target) && 
    !floatingEl.value.contains(event.target)
  ) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="popover-wrapper">
    <span 
      ref="referenceEl"
      @click="togglePopover"
      class="popover-trigger"
    >
      <slot name="trigger">
        <span>(?)</span>
      </slot>
    </span>

    <Teleport to="body">
      <div 
        v-if="isOpen"
        ref="floatingEl"
        :style="floatingStyles"
        class="popover-content"
      >
        <slot>
          <div>No content provided</div>
        </slot>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.popover-wrapper {
  display: inline-block;
}

.popover-trigger {
  cursor: pointer;
}

.popover-content {
  background-color: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  max-width: 250px;
  z-index: 50;
}
</style>

<!-- <script>
import { usePopperjs } from 'vue-use-popperjs'

export default {
  name: 'Popover',
  props: ['popupTitle', 'popupContent', 'disabled', 'extraClasses'],
  mounted(){
    const { reference, popper } = this.$refs
    usePopper(reference, popper, {
      placement: 'bottom'
    })
  },
  data(){
    return {
    }
  },
  methods: {

  }
}
</script> -->

<!-- <style type="text/scss" lang="scss">
@import '../assets/sass/globals';
.popper{
  color: $grey-dark;
}
</style> -->
