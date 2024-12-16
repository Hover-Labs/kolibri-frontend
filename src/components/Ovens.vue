<template>
  <section class="section ovens">
    <portal to="manage-modal">
      <oven-manage-modal
          v-if="modal.manage.opened"
          @close-requested="closeManageModal"
          @change-page="modal.manage.requestedPage = $event"
          :current-page="modal.manage.requestedPage"
          :ovenAddress="modal.manage.ovenAddress"
          :opened="modal.manage.opened" />
    </portal>

    <portal to="delegate-modal">
      <oven-delegate-modal
          v-if="modal.delegate.opened"
          @close-requested="closeDelegateModal"
          :ovenAddress="modal.delegate.ovenAddress"
          :opened="modal.delegate.opened" />
    </portal>

    <portal to="new-oven-modal">
      <new-oven-modal
          v-if="modal.newOven.opened"
          @close-requested="modal.newOven.opened = false"
      />
    </portal>

    <div class="columns">
      <div class="column is-10 is-offset-1">
        <div v-if="$store.ownedOvens === null" class="ovens-are-loading loader-wrapper">
          <div class="loader is-primary is-large"></div>
        </div>
        <div v-else class="oven-info">
          <div class="buttons is-centered">
            <button @click="modal.newOven.opened = true" class="button is-primary is-large has-text-weight-bold">Create New Oven</button>
          </div>
          <div v-if="$store.ownedOvens !== null">
            <oven
                @modal-open-requested="openManageModal"
                @show-delegate-modal="openDeleagateModal"
                :oven-address="oven[0]"
                v-for="oven in sortedOvens"
                :key="oven[0]" />
          </div>

          <div class="config-options">
            <div class="control">
              <label class="checkbox">
                <input v-model="hideLiquidatedOvens" type="checkbox">
                Hide Liquidated Ovens?
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { reactive } from 'vue';
import Mixins from '@/mixins'
import Oven from "@/components/Oven.vue"
import OvenManageModal from "@/components/OvenManageModal.vue"

import _ from 'lodash'
import OvenDelegateModal from "@/components/OvenDelegateModal.vue";
import NewOvenModal from "@/components/NewOvenModal.vue";
import emitter from "@/bus";

export default {
  name: 'Ovens',
  mixins: [Mixins],
  async created(){
    await this.updateOvens()
    emitter.on('refresh-all-ovens', async () => {
      this.$store.ownedOvens =  null
      await this.updateOvens()
    })
  },
  data() {
    return {
      hideLiquidatedOvens: true,
      modal: {
        manage: {
          opened: false,
          requestedPage: null,
          ovenAddress: null
        },
        delegate: {
          opened: false,
          ovenAddress: null
        },
        newOven: {
          opened: false,
        }
      },
    }
  },
  computed: {
    sortedOvens(){
      return _(this.$store.ownedOvens)
          .toPairs()
          .reject((oven) => {
            if (this.hideLiquidatedOvens){
              return oven[1] && oven[1].isLiquidated
            }
            return false
          })
          .orderBy(
              (oven) => {
                if (oven[1] && oven[1].isLiquidated) {
                  return -1
                }
                return oven[1] !== null ? parseInt(oven[1].balance) : 0
              },
              'desc'
          )
          .value()
    }
  },
  methods: {
    async updateOvens(){
      let ownedOvens = (await this.$store.stableCoinClient.ovensOwnedByAddress(this.$store.walletPKH))
          .reduce((acc, ovenAddress) => {
            acc[ovenAddress] = null
            return acc
          }, {})
      this.$store.ownedOvens = reactive(ownedOvens)

      // In electron land we listen for this event to know to start doing integration stuff
      window.dispatchEvent(new CustomEvent('owned-ovens', {detail: {ownedOvens}}))
    },
    openDeleagateModal(ovenAddress){
      this.modal.delegate.opened = true
      this.modal.delegate.ovenAddress = ovenAddress
    },
    openManageModal(page, ovenAddress){
      this.modal.manage.ovenAddress = ovenAddress
      this.modal.manage.requestedPage = page
      this.modal.manage.opened = true
    },
    closeDelegateModal(){
      this.modal.delegate.opened = false
      this.modal.delegate.ovenAddress = null
    },
    closeManageModal(){
      this.modal.manage.opened = false
      this.modal.manage.ovenAddress = null
      this.modal.manage.requestedPage = null
    },
  },
  beforeUnmount() {
    emitter.off('refresh-all-ovens')
  },
  components: {
    OvenDelegateModal,
    Oven,
    OvenManageModal,
    NewOvenModal
  },
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';
  .ovens {
    background: $light-grey;
    padding: 0 1.5rem 2rem;
    .config-options{
      text-align: center;
      padding-top: 3rem;
    }
    .ovens-are-loading{
      padding: 4.25rem;
    }
    .panel-block{
      background: white;
    }
    .panel-heading{
      font-size: 1.5rem;
    }
    .oven-info{

    }
  }
</style>
