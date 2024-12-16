<template>
  <transition
      enter-active-class="animate__animated animate__fadeIn"
      leave-active-class="animate__animated animate__fadeOut"
  >
    <div :class="{'is-active': opened}" class="modal modal-component">
      <div @click="close()" class="modal-background"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <h2 class="modal-card-title">Set Baker</h2>
        </header>
        <section class="modal-card-body is-paddingless">
          <div class="box">
            <div class="content" v-if="ovenData.baker">
              <strong>Current:</strong>

              <baker-info
                  :baker-address="ovenData.baker"
              />

            </div>
            <div class="content" v-else>
              <strong>Current:</strong>
              <br>
              You currently don't have a baker set for this Oven. <b><a target="_blank" rel="noopener" href="https://www.tessellatedgeometry.com/">Tessellated Geometry</a></b>
              (<b><a @click="bakerAddress = $store.NETWORK_CONTRACTS.KOLIBRI_BAKER">{{ truncateChars($store.NETWORK_CONTRACTS.KOLIBRI_BAKER, 18) }}</a></b>)
              is the preferred baker for Kolibri ovens, and a portion of Baking income from oven delegations is used to to support Kolibri's development.
              <br><br>
              If you'd like a different baker, please set one below. You can always change the baker for your oven at any time in the future, by selecting the baker next to the "DELEGATED BAKER" field in your oven.
            </div>
            <div class="content">
              <strong>New Baker:</strong>
              <div class="field">
                <p class="control">
                  <input v-model="bakerAddress" class="input" type="text" placeholder="">
                </p>
              </div>

              <baker-info
                  :baker-address="bakerAddress"
              />
            </div>

          </div>
        </section>
        <footer class="modal-card-foot is-justify-content-flex-end">
          <button
              :disabled="!validBakerAddress"
              @click="setBaker"
              :class="{'is-loading': networkLoading}"
              class="button is-primary"
          >
            <strong>Set New Baker</strong>
          </button>
        </footer>
      </div>
      <button @click="close()" class="modal-close is-large" aria-label="close"></button>
    </div>
  </transition>
</template>

<script>
import Mixins from "@/mixins"
import BakerInfo from "@/components/BakerInfo.vue";
import emitter from "@/bus";

export default {
  name: 'OvenDelegateModal',
  mixins: [Mixins],
  props: {
    opened: {
      type: Boolean
    },
    ovenAddress: {
      type: String
    }
  },
  async created(){
    await this.fetchBakerInfoIfNecessary()
    if(this.$store.ownedOvens[this.ovenAddress].baker === null){
      this.bakerAddress = this.$store.NETWORK_CONTRACTS.KOLIBRI_BAKER
    }
  },
  data: function () {
    return {
      bakerAddress: null,
      networkLoading: false,
      tgBaker: this.$store.NETWORK_CONTRACTS.KOLIBRI_BAKER
    }
  },
  watch: {
    opened(val){
      if (val) {
        document.documentElement.classList.add('disable-scroll')
      } else {
        document.documentElement.classList.remove('disable-scroll')
      }
    }
  },
  methods: {
    close(){
      this.$emit('close-requested')
      this.bakerAddress = null
      this.networkLoading = false
    },
    async setBaker(){
      try{
        this.networkLoading = true
        let setBakerResult = await this.ovenClient(this.ovenAddress).setBaker(this.bakerAddress)
        emitter.emit("oven-tx-submitted", setBakerResult, this.ovenAddress, 'set baker')
        this.close()
      } catch (e) {
        this.handleWalletError(e, "Could not set baker", "There was an issue with the set baker request.")
      } finally {
        this.networkLoading = false
      }
    },
  },
  computed: {
    ovenData() {
      return this.$store.ownedOvens[this.ovenAddress]
    },
  },
  components: {
    BakerInfo
  },
}
</script>

<style type="text/scss" lang="scss">
@import '../assets/sass/globals';

.modal-component{
  .new-baker-info{
    margin-bottom: 1rem;
  }
}

</style>
