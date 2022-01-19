<template>
  <div class="recent-activity box is-flex is-align-items-center">
    <p class="title timestamp-title is-6 is-marginless"><a target="_blank" rel="noopener" :href="tzktLinkTx(tx.hash)">
      {{ formatMoment(now, tx.timestamp) }} ago <span class="help"> {{ tx.timestamp }} </span></a>
    </p>
    <span class="action" v-if="tx.parameter.entrypoint === 'deposit'">
      📈 Deposited <b>{{ formatNumber(parseInt(tx.parameter.value) / 1e18, 2) }} kUSD</b> for
      <span v-if="resolvedData !== null"><b>{{ formatNumber(resolvedData.parameter.value.value / 1e36, 2) }} KSR</b></span>
      <span v-else class="loader is-inline-flex"></span>
    </span>
    <span class="action" v-else-if="tx.parameter.entrypoint === 'redeem'">
      📉 Redeemed <b>{{ formatNumber(parseInt(tx.parameter.value) / 1e36, 2) }} KSR</b> for
      <span v-if="resolvedData !== null"><b>{{ formatNumber(resolvedData.parameter.value.value / 1e18, 2) }} kUSD</b></span>
      <span v-else class="loader is-inline-flex"></span>
    </span>
    <span v-else>Unknown entrypoint! {{ tx.parameter.entrypoint }}</span>
  </div>
</template>

<script>
import _ from 'lodash';
import Mixins from "@/mixins";
import axios from "axios";

export default {
  name: "RecentActivityEntry",
  props: ["tx", "now"],
  mixins: [Mixins],
  async created() {
    if (this.tx.parameter.entrypoint === 'redeem'){
      if (this.tzktAPILink() !== null){
        // https://api.granadanet.tzkt.io/#operation/Operations_GetByHash
        this.resolvedData = _.find(
          (await axios.get(`${this.tzktAPILink()}/v1/operations/${this.tx.hash}`)).data,
          (tx) => {
            return tx.parameter.entrypoint === 'transfer' &&
                   tx.parameter.value.to === this.$store.walletPKH &&
                   tx.parameter.value.from === this.$store.NETWORK_CONTRACTS.SAVINGS_POOL
          }
        )
      }
    }
    else if (this.tx.parameter.entrypoint === 'deposit'){
      if (this.tzktAPILink() !== null){
        // https://api.granadanet.tzkt.io/#operation/Operations_GetByHash
        this.resolvedData = _.find(
          (await axios.get(`${this.tzktAPILink()}/v1/operations/${this.tx.hash}`)).data,
          (tx) => {
            return tx.parameter.entrypoint === 'mint' &&
              tx.parameter.value.address === this.$store.walletPKH
          }
        )
      }
    }
  },
  methods: {
  },
  data() {
    return {
      resolvedData: null
    };
  },
  computed: {

  },
  components: {

  },
};
</script>

<style type="text/scss" lang="scss">
@import "../assets/sass/globals";

.recent-activity{
  .action{
    margin-left: 1rem;
    .loader{
      vertical-align: middle;
    }
  }
}
</style>
