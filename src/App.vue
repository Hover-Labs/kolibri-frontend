<template>
  <div>
    <portal-target name="manage-modal" />
    <portal-target name="delegate-modal" />
    <portal-target name="new-oven-modal" />
    <portal-target name="project-info-modal" />

    <pending-tx-info />

    <options />

    <sandbox-override v-if="$store.isSandbox"/>
    <navbar />
    <keep-alive>
      <router-view :key="$route.name"></router-view>
    </keep-alive>
    <hover-labs-footer />
  </div>
</template>

<script>
import Navbar from "@/components/Navbar";
import axios from "axios";
import BigNumber from "bignumber.js";
import SandboxOverride from "@/components/SandboxOverrides";
import Options from "@/components/Options";
import PendingTxInfo from "@/components/PendingTransactionInfo";
import _ from 'lodash'
import {Network} from "@hover-labs/kolibri-js";

import Mixins from './mixins'
import HoverLabsFooter from "@/components/HoverLabsFooter";

export default {
  name: 'App',
  mixins: [Mixins],
  components: {
    HoverLabsFooter,
    PendingTxInfo,
    Options,
    SandboxOverride,
    Navbar
  },
  data(){
    return {
      updatePriceInfoTimer: null,
      updateAllOvenDataTimer: null,
    }
  },
  async mounted(){
    await Promise.all([
      this.updateBlockHeight(),
      this.updateMinterData(),
      this.updatePriceInfo(),
      this.updateAllOvenData(),
      this.loadDAOStorage()
    ])
    this.$store.simpleStabilityFee = await this.$store.stableCoinClient.getSimpleStabilityFee()
    this.updatePriceInfoTimer = setInterval(this.updatePriceInfo, 60 * 1000) // Go grab oracle data every minute
    this.updateAllOvenDataTimer = setInterval(this.updateAllOvenData, 60 * 1000) // Go grab all oven data every minute
  },
  methods:{
    async loadDAOStorage(){
      const contract = await this.$store.tezosToolkit.contract.at(this.$store.NETWORK_CONTRACTS.DAO)
      this.$store.daoStorage = await contract.storage()
    },
    async updateMinterData(){
      const contract = await this.$store.tezosToolkit.contract.at(this.$store.NETWORK_CONTRACTS.MINTER)

      const minterStorage = await contract.storage()
      const mantissa = new BigNumber(10).pow(18)
      this.$store.stabilityFee = minterStorage.stabilityFee
        .dividedBy(mantissa)
        .plus(1)
        .pow(365 * 24 * 60)
        .minus(1)
        .times(mantissa)

      this.$store.collateralRate = minterStorage.collateralizationPercentage;
      this.$store.privateLiquidationThreshold = minterStorage.privateOwnerLiquidationThreshold || null;
    },
    async updateAllOvenData(){
      try {
        const response = await axios.get(`https://kolibri-data.s3.amazonaws.com/${this.$store.network}/oven-data.json`)

        this.$store.allOvensData = response.data.allOvenData.map((oven) => {
          const ovenData = {}

          // Coerce back into bignumbers
          ovenData.balance = new BigNumber(oven.balance)
          ovenData.borrowedTokens = new BigNumber(oven.borrowedTokens)
          ovenData.stabilityFee = new BigNumber(oven.stabilityFees)
          ovenData.outstandingTokens = new BigNumber(oven.outstandingTokens)

          return Object.assign(ovenData, {
            ovenAddress: oven.ovenAddress,
            ovenOwner: oven.ovenOwner,
            baker: oven.baker
          })
        })
      } catch (e){
        // If we're in the sandbox, just manually resolve these data
        if (this.$store.network === Network.Sandbox){
          this.$log("Manually resolving ovens...")
          // Clear this if we're manually resolving to show loader
          this.$store.balanceData = null
          this.$store.allOvensData = await this.manuallyResolveOvens()
          this.$store.balanceData = this.manuallyCalculateBalanceData()
        }

        clearInterval(this.updateAllOvenDataTimer)
        console.error(e)
      }
    },
    async manuallyResolveOvens(){
      // If no data exists, fall back on manual resolution/calculation
      const ovens = await this.$store.stableCoinClient.getAllOvens()
      return await Promise.all(
        ovens.map(async (oven) => {
          const ovenClient = this.$store.getOvenClient(this.$store.$wallet, oven.ovenAddress)

          const keys = [
            'baker',
            'balance',
            'borrowedTokens',
            'stabilityFee',
            'isLiquidated'
          ]

          const values = await Promise.all([
            ovenClient.getBaker(),
            ovenClient.getBalance(),
            ovenClient.getBorrowedTokens(),
            ovenClient.getStabilityFees(this.calculateSandboxStabFeeTime()),
            ovenClient.isLiquidated(),
          ])

          const ovenData = _.zipObject(keys, values)
          ovenData.outstandingTokens = ovenData.borrowedTokens.plus(ovenData.stabilityFee)

          return Object.assign(oven, ovenData)
        })
      )
    },
    manuallyCalculateBalanceData() {
      return {
        totalBalance: _(this.$store.allOvensData).reduce((acc, oven) => {
          return oven.balance.plus(acc)
        }, 0),
        totalTokens: _(this.$store.allOvensData).reduce((acc, oven) => {
          return oven.outstandingTokens.plus(acc)
        }, 0).dividedBy(Math.pow(10, 18))
      }
    },
    updatePriceInfo(){
      this.$store.harbingerClient.getPriceData()
          .then((priceData) => {
            this.$store.priceData = priceData;
          })
    },
    async updateBlockHeight(){
      const currentBlock = await this.$store.tezosToolkit.rpc.getBlock()
      this.$store.currentBlockHeight = currentBlock.header.level
      setTimeout(this.updateBlockHeight, this.$store.network === Network.Sandbox ? 4 * 1000 : 10 * 1000)
    },
  }
}
</script>

<style type="text/scss" lang="scss">
  @import './assets/sass/globals';
  @import '~bulma/bulma';
  @import '~animate.css/animate.css';
  @import '~vue-popperjs/dist/vue-popper.css';
  @import '~@sweetalert2/theme-bulma/bulma.scss';
  @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;700&display=fallback');

  // For our modal
  html.disable-scroll {
    overflow: hidden;
  }

  .popper{
    box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1), 0 0px 0 1px rgba(10, 10, 10, 0.02);
    text-align: left;
    padding: 1rem;
    text-transform: initial;
    .popper__arrow{
      border-color: transparent transparent #ebebeb transparent !important;
    }
  }
  .swal2-content{
    pre{
      margin-top: 1rem;
    }
  }
  .swal2-confirm{
    background-color: #3EBD93;
  }

  .loader-wrapper{
    padding: 1rem;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .loader{
    &.left-spaced{
      margin-left: 0.5rem;
    }
    &.is-large{
      width: 3rem;
      height: 3rem;
    }
    &.is-medium{
      width: 2rem;
      height: 2rem;
    }
    &.is-primary{
      border: 2px solid #3EBD93;
      border-right-color: transparent;
      border-top-color: transparent;
    }
    &.is-white{
      border: 2px solid $white;
      border-right-color: transparent;
      border-top-color: transparent;
    }
  }
  .price-has-popover {
    cursor: pointer;
    border-bottom: 1px solid $primary;
  }
</style>
