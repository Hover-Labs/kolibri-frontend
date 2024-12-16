<template>
  <div class="farming">
    <div class="columns is-centered is-gapless">
      <div class="column is-half-desktop">
        <div class="notification is-warning">
          <p class="title has-text-centered">These Farms Are Deprecated!</p>
          <p>
            New farms can be found at <a rel="noopener" target="_blank" href="https://quipuswap.com/farming">https://quipuswap.com/farming</a>, with a much better interface! Please withdraw your liquidity and migrate it to the new pool/s.
          </p>
        </div>
      </div>
    </div>
    <div v-if="!$store.isTestnet && !$store.isSandbox && $store.currentBlockHeight !== null" class="columns is-centered is-gapless">
      <div class="column is-half-desktop">
        <div v-if="$store.currentBlockHeight <= 1589248" class="notification is-warning">
          <strong>Please note!</strong><br> Mainnet currently uses 1 min block times, so farms are currently emitting at <strong>50%</strong> of their planned schedule until the <a target="_blank" rel="noopener" href="https://tzstats.com/election/29"><strong>Granada proposal</strong></a> goes live. Once live, farm emissions will double from their current drip rate (lasting ~1 year)
        </div>
        <div v-else-if="$store.currentBlockHeight < 1609408" class="notification is-primary">
          With the passing of the <a target="_blank" rel="noopener" href="https://tzstats.com/election/29"><strong>Granada proposal</strong></a>, Mainnet has just switched to 30s block times 🥳! The farm rewards are now <strong>doubled</strong> from their previous drip rate thanks to the upgrade!
        </div>
      </div>
    </div>
    <div v-if="$store.isSandbox" class="columns is-centered is-gapless">
      <div class="column is-half-desktop">
        <div class="notification is-primary has-text-centered">
          <b>🤑 Sandbox block times are ~4s, so farms will emit at a very high rate! 🤑</b>
        </div>
      </div>
    </div>
    <div class="columns is-centered is-gapless farms">
      <div class="column is-three-quarters-desktop">
        <div v-if="$store.wallet !== null" class="buttons is-centered">
          <button @click="claimAll" :disabled="!isDoneGettingClaimableRewards || networkSending || totalClaimable.isLessThan(0.005)" :class="{'is-loading': !isDoneGettingClaimableRewards || networkSending}" class="button is-info is-medium has-text-weight-bold">🧑‍🌾 Claim All {{ totalClaimable.dividedBy(Math.pow(10, 18)).toFixed(2) }} kDAO</button>
        </div>

        <farm
          v-for="(contract, pairName) in $store.farmContracts"
          :key="pairName"
          :contract="contract"
          :pair-name="pairName"
          :global-sending="networkSending"
          @new-estimated-rewards="updateClaimableRewards($event)"
          @initialized="addContractHoldings($event)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Mixins from "@/mixins";
import Farm from "@/components/Farm.vue";
import BigNumber from "bignumber.js";
import emitter from "@/bus";

export default {
  name: 'Farming',
  mixins: [Mixins],
  async created(){
    if (this.$store.walletPKH !== null){
      this.$nextTick(this.updatekDAOHoldings)
    } else {
      emitter.on('wallet-connected', this.updatekDAOHoldings)
    }
    emitter.on('refresh-kdao-holdings', this.updatekDAOHoldings)
  },
  data(){
    return {
      globalClaimableRewards: {},
      networkSending: false
    }
  },
  components: {
    Farm
  },
  computed: {
     isDoneGettingClaimableRewards(){
       const farmCount = Object.keys(this.$store.farmContracts).length
       const rewardInfoCount = Object.keys(this.globalClaimableRewards).length

       return farmCount === rewardInfoCount
     },
     totalClaimable(){
       let total = new BigNumber(0)
       for (const rewardInfo of Object.values(this.globalClaimableRewards)){
         total = total.plus(rewardInfo.claimable)
       }
       return total
     }
  },
  methods: {
    async updateClaimableRewards({contract, estimatedRewards}){
      console.log('Updating claimable rewards for contract:', contract, estimatedRewards);
      if (this.globalClaimableRewards[contract] === undefined){ return }
      this.$set(
        this.globalClaimableRewards[contract],
        'claimable',
        estimatedRewards
      )
    },
    async claimAll(){
      this.networkSending = true
      try {
        let batch = await this.$store.tezosToolkit.wallet.batch([])

        for (const rewardInfo of Object.values(this.globalClaimableRewards)){
          if (rewardInfo.claimable.dividedBy(Math.pow(10, 18)).isGreaterThan(0.005)) {
            batch = batch.withContractCall(rewardInfo.contract.methods.claim(null))
          }
        }

        const sendResult = await batch.send()

        emitter.emit('tx-submitted', sendResult)

        await sendResult.confirmation(1)

        this.globalClaimableRewards = {}
        emitter.emit('refresh-farms')
      } catch (e) {
        console.error(e)
      } finally {
        this.networkSending = false
        emitter.emit('tx-finished')
      }
    },
    addContractHoldings(contractHoldingsInfo){
      console.log('Adding contract holdings:', contractHoldingsInfo);
      this.globalClaimableRewards[contractHoldingsInfo.contractAddress] = contractHoldingsInfo
    },
    async updatekDAOHoldings(){
      this.$store.kdaoHoldings = null
      const kDAOToken = await this.$store.tezosToolkit.wallet.at(this.$store.daoToken)
      const kDAOStorage = await kDAOToken.storage()
      this.$store.kdaoHoldings = await kDAOStorage.balances.get(this.$store.walletPKH)
    }
  }
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';
  .farming{
    min-height: calc(100vh - 4rem - 5px);
    background: $light-grey;
    position: relative;
    z-index: 39;
    .columns{
      &:first-child{
        padding-top: 2.5rem;
      }
      .box{
        background: $primary;
        color: white;
      }
    }
    .farms{
      padding-bottom: 3rem;
    }
  }
</style>
