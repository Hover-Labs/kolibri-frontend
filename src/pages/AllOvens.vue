<template>
  <section class="all-ovens hero is-fullheight is-align-items-center">
    <div
        v-if="$store.allOvensData !== null && $store.priceData !== null && activeVaults.length > 10"
        class="floating-paginator animate__animated animate__fadeInUp">
      <Paginator
          class="is-centered"
          :totalRecords="activeVaults.length"
          :rows="10"
          v-model="currentPage"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
      />
    </div>
    <div v-if="$store.allOvensData === null || $store.priceData === null" class="loading-wrapper">
      <div class="loader is-large is-primary"></div>
    </div>
    <div class="container oven-data is-fluid" v-else>
      <div class="columns is-centered is-gapless">
        <div class="column is-three-quarters box filters">
          <div class="paginator-widget">
            <div class="columns is-gapless">
              <div class="column has-text-centered">
                <label class="checkbox">
                  <input v-model="hideEmptyOvens" type="checkbox">
                  Hide Empty Ovens?
                </label>
              </div>
              <div class="column has-text-centered">
                <label class="checkbox">
                  <input v-model="hideLiquidatedOvens" type="checkbox">
                  Hide Liquidated Ovens?
                </label>
              </div>
              <div class="column has-text-centered">
                <label class="checkbox">
                  <input v-model="orderByValue" type="checkbox">
                  Order Ovens By Value?
                </label>
              </div>
            </div>
            <div class="is-flex is-justify-content-center search">
              <div class="field is-horizontal">
                <div class="field-label is-normal">
                  <label class="label">Search</label>
                </div>
                <div class="field-body">
                  <div class="field">
                    <div class="control">
                      <input v-model="searchTerm" class="input" type="text" placeholder="Any Contract or Wallet Address">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <public-oven
          :oven="oven"
          :key="oven.ovenAddress"
          @oven-liquidated="markOvenLiquidated"
          v-for="oven in currentChunk"
      />
    </div>
  </section>
</template>

<script>
import _ from 'lodash'
import PublicOven from "@/components/PublicOven.vue";
import { Pagination } from 'buefy';
import Paginator from 'primevue/paginator';
import Mixins from '../mixins';

export default {
  name: 'AllOvens',
  mixins: [Mixins],
  async mounted(){
    if (this.$route.query.page){
      this.currentPage = parseInt(this.$route.query.page)
    }
  },
  data(){
    return {
      ovensDataChunks: null,
      currentPage: 1,
      emptyOvens: {},
      hideEmptyOvens: true,
      hideLiquidatedOvens: true,
      orderByCollateralization: true,
      orderByValue: false,
      searchTerm: null,
      modals: {
        newOven: {
          opened: false
        }
      }
    }
  },
  watch: {
    '$route.query.page': function (page) {
      this.currentPage = page
    }
  },
  computed: {
    currentChunk(){
      return this.activeVaults[this.currentPage - 1]
    },
    activeVaults(){
      return _(this.$store.allOvensData)
                .reject((oven) => {
                  if (this.hideEmptyOvens) {
                    if (!this.hideLiquidatedOvens && oven.isLiquidated) {
                      return false
                    }
                    return oven.balance.isEqualTo(0)
                  }
                  return false
                })
                .reject((oven) => {
                  if (this.hideLiquidatedOvens) {
                    return oven.isLiquidated
                  }
                  return false
                })
                .sortBy((oven) => {
                  if (this.orderByCollateralization){
                    return -1 * parseFloat(this.collatoralizedRateForOven(oven))
                  }
                  return 0
                })
                .sortBy((oven) => {
                  if (this.orderByValue){
                    return oven.balance.times(-1).toNumber()
                  }
                  return 0
                })
                .sortBy((oven) => {
                  if (oven.isLiquidated){
                    return 1
                  }
                  return 0
                })
                .filter((oven) => {
                  if (this.searchTerm !== null && this.searchTerm.length > 0){
                    if (oven.baker && oven.baker.toLowerCase().includes(this.searchTerm.toLowerCase())){
                      return true
                    } else if (oven.ovenOwner.toLowerCase().includes(this.searchTerm.toLowerCase())){
                      return true
                    } else if (oven.ovenAddress.toLowerCase().includes(this.searchTerm.toLowerCase())){
                      return true
                    }
                    return false
                  }
                  return true
                })
                .chunk(10)
                .value()
    }
  },
  components: {
    PublicOven,
    Paginator,
  },
  methods: {
    markOvenLiquidated(ovenAddress){
      const ovenIndex = _.findIndex(this.$store.allOvensData, oven => oven.ovenAddress === ovenAddress)
      this.$store.allOvensData[ovenIndex].isLiquidated = true
    },
  }
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';
  .all-ovens{
    background: $light-grey;
    padding-bottom: 3rem;
    .floating-paginator{
      position: fixed;
      bottom: 0;
      z-index: 999;
      background: white;
      padding: .5rem;
      border-top-right-radius: 5px;
      border-top-left-radius: 5px;
    }
    .little-padding{
      padding-bottom: 0.5rem;
    }
    .oven-data{
      padding-top: 0 !important;
    }
    .paginator-widget{
      .paginator-list {
        flex-wrap: nowrap;
      }
      .column{
        padding: 1rem !important;
        padding-bottom: 0 !important;
      }
    }
    &.is-fullheight{
      min-height: calc(100vh - 4rem - 5px);
    }
    .hero-body{
      width: 85vw;
    }
    .loading-wrapper{
      width: 100%;
      height: calc(100vh - 4rem - 5px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container.oven-data{
      @include until($tablet){
        padding: .5rem;
      }
      @include from($desktop){
        padding: 2.5rem 5rem;
      }
    }
    .box.filters{
      margin-top: 1.5rem;
    }
    .search{
      margin: 1.5rem;
      .field{
        width: 50%;
        @include until($widescreen){
          width: 75%;
        }
        @include until($tablet){
          width: 100%;
          padding-bottom: 1rem;
        }
      }
    }
  }
</style>
