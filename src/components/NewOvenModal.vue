<template>
  <transition
      enter-active-class="animate__animated animate__fadeIn"
      leave-active-class="animate__animated animate__fadeOut"
  >
    <div class="modal modal-component new-oven-modal is-active">
      <div @click="close" class="modal-background"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <h1 class="modal-card-title">Create New Oven</h1>
          <button @click="close" class="delete" aria-label="close"></button>
        </header>
        <section :class="{'showing-overlay': sendingTransactions}" class="modal-card-body is-paddingless">
          <div v-if="sendingTransactions" class="summary-overlay">
            <div class="container animate__animated animate__fadeInRight">
              <h1 class="title">Hold tight!<br>We're creating your oven.</h1>
              <div class="step">
                <p class="has-text-primary">
                  1. Creating Oven
                  <template v-if="pendingCreateOvenTx !== null">
                    (<a target="_blank" rel="noopener" :href="tzktLinkTx(pendingCreateOvenTx)" class="has-text-primary">{{ truncateChars(pendingCreateOvenTx, 18) }}</a>)
                  </template>
                </p>
                <div v-if="createdOven"><img class="check" src="../assets/check.svg" /></div>
                <div v-else class="loader is-primary"></div>
              </div>
              <div v-if="selectedDelegate !== this.$store.defaultOvenBaker && selectedDelegate !== null && selectedDelegate !== ''" class="step">
                <p
                    :class="{'has-text-grey-light': !createdOven, 'has-text-primary': createdOven}"
                >
                  2. Delegating Oven...
                  <template v-if="pendingSetBakerTx !== null">
                    (<a target="_blank" rel="noopener" :href="tzktLinkTx(pendingSetBakerTx)" class="has-text-primary">{{ truncateChars(pendingSetBakerTx, 18) }}</a>)
                  </template>
                </p>
                <div v-if="createdOven" class="loader is-primary"></div>
              </div>
            </div>
          </div>
          <div v-if="!sendingTransactions" class="submission-form">
            <p>
              You'll need to (optionally) set a baker for your Oven.

              <br>

              <span v-if="$store.NETWORK_CONTRACTS.KOLIBRI_BAKER !== null">
                <br>
                <b><a target="_blank" rel="noopener" href="https://www.tessellatedgeometry.com/">Tessellated Geometry</a></b>
                (<b><a @click="selectedDelegate = $store.NETWORK_CONTRACTS.KOLIBRI_BAKER">{{ truncateChars($store.NETWORK_CONTRACTS.KOLIBRI_BAKER, 18) }}</a></b>)
                is the preferred baker for Kolibri ovens, and a portion of Baking income from oven delegations is used to to support Kolibri's development. If you'd like a different baker, please set one below.
                <br>
              </span>

              <br>
              You can always change the baker for your oven at any time in the future, by selecting the baker next to the "DELEGATED BAKER" field in your oven.
            </p>
            <hr>

            <div class="field">
              <label class="label">Delegate Oven Funds To</label>
              <div class="control">
                <input class="input" type="text" v-model="selectedDelegate">
              </div>
            </div>

            <baker-info v-if="selectedDelegate !== null && !sendingTransactions" :baker-address="selectedDelegate" />
          </div>
        </section>
        <footer class="modal-card-foot is-justify-content-flex-end">
          <button @click="close" class="button">Cancel</button>
          <button
              :disabled="sendingTransactions || !validBakerAddress(selectedDelegate)"
              :class="{'is-loading': sendingTransactions}"
              @click="createNewOven"
              class="button is-primary"
          >
            Create Oven
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script>
import Mixins from "@/mixins"
import _ from "lodash";
import BakerInfo from "@/components/BakerInfo.vue";
import emitter from "@/bus";

export default {
  name: 'NewOvenModal',
  mixins: [Mixins],
  async created(){
    await this.fetchBakerInfoIfNecessary()
  },
  data: function () {
    return {
      selectedDelegate: this.$store.NETWORK_CONTRACTS.KOLIBRI_BAKER,
      sendingTransactions: false,
      createdOven: false,
      pendingCreateOvenTx: null,
      pendingSetBakerTx: null,
    }
  },
  watch: {
  },
  methods: {
    close(){
      if (!this.shouldAllowClose){ return false }

      this.createdOven = false
      this.sendingTransactions = false
      this.pendingCreateOvenTx = null
      this.pendingSetBakerTx = null
      this.$emit('close-requested')
    },
    async createNewOven(){
      try{
        document.querySelector('.modal-card-body').scrollTop = 0

        this.sendingTransactions = true

        const walletCopy = _.defaultsDeep({}, this.$store.wallet)

        this.$log("Creating oven...")
        let result = await this.$store.stableCoinClient.deployOven(walletCopy)

        this.pendingCreateOvenTx = result.opHash

        this.$log("Pending hash -", result.opHash)

        await result.confirmation(1)

        const ovenCreationResults = await result.operationResults()

        const creationResult = _.find(ovenCreationResults, (result) => {
          return result.kind === 'transaction'
        })

        const ovenAddress = _.find(creationResult.metadata.internal_operation_results, (operation) => {
          return operation.kind === "origination"
        }).result.originated_contracts[0]

        this.createdOven = true

        if (this.$store.ownedOvens === null) {
          this.$set(this.$store, 'ownedOvens', {})
        }

        this.$set(this.$store.ownedOvens, ovenAddress, null)
        this.$set(this.$store, 'ovenCount', this.$store.ovenCount + 1)

        // If we have to set a different delegate, go set a delegate
        if (this.selectedDelegate !== this.$store.defaultOvenBaker &&
            this.selectedDelegate !== null &&
            this.selectedDelegate !== ''){
          result = await this.ovenClient(ovenAddress).setBaker(this.selectedDelegate)
          emitter.emit("oven-tx-submitted", result, ovenAddress, 'set baker')
        }

        this.createdOven = false
        this.sendingTransactions = false
        this.close()
      } catch(err) {
        this.sendingTransactions = false
        this.handleWalletError(err, "Unable To Create Oven", "We were unable to create your Oven!")
      }
    }
  },
  computed: {
    shouldAllowClose(){
      return !this.sendingTransactions
    }
  },
  components: {
    BakerInfo
    // BakerInfo
  },
}
</script>

<style type="text/scss" lang="scss">
@import '../assets/sass/globals';

.modal-component{
  .submission-form{
    padding: 1.5rem;
  }
  .modal-card-body.showing-overlay{
    overflow: hidden;
  }
  .summary-overlay{
    width: 100%;
    //height: 100%;
    justify-content: center;
    display: flex;
    align-items: center;
    &>.container{
      padding: 3rem;
      .step{
        display: flex;
        align-items: center;
        margin-bottom: .25rem;
        a{
          border-bottom: 1px solid $primary;
        }
        .loader, .check{
          margin-left: .5rem;
        }
        .check{
          max-height: 1rem;
        }
      }
    }
  }
}

</style>
