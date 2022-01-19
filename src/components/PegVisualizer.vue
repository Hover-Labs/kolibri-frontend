<template>
  <div class="peg-visualizer">
    <div v-if="$store.priceData === null || quipuData === null" class="loader-wrapper">
      <div class="loader is-medium"></div>
    </div>

    <div v-else>
      <div class="peg-bar">
        <div class="ticks">
          <div :key="n" v-for="n in 21" class="tick"></div>
        </div>
        <div :style="{opacity: currentPegPercent.isLessThan(0) ? 1 : 0}" class="negative-peg">
          <popover>
            <div slot="popup-content">
              <p>kUSD is currently <span>oversold</span> by <b>{{ currentPegPercent.abs().toFixed(2) }}%</b>, and trading at <b>~${{ currentkUSDPrice }}</b>.</p>
              <br>
              <p>To reach equilibrium, <b>{{ formatNumber(deltaForPeg.kUSD.toFixed(2)) }} kUSD</b> need to be bought for <b>{{ formatNumber(deltaForPeg.xtz.toFixed(2)) }} XTZ</b>.</p>
              <br>
              <p class="help">Please note: This is a <b>*spot price*</b>, not an average price.</p>
            </div>
            <div
              class="peg-progress"
              :class="[pegProgressClass, {full: Math.abs(currentPegPercent) * 10 >= 100}]"
              :style="{width: `${Math.min(Math.abs(currentPegPercent) * 10, 100)}%`}"
            >
              <div class="peg-indicator">
                <p class="heading">{{ currentPegPercent.toFixed(1) }}%</p>
              </div>
            </div>
          </popover>
        </div>
        <div :style="{opacity: currentPegPercent.isGreaterThan(0) ? 1 : 0}" class="positive-peg">
          <popover>
            <div slot="popup-content">
              <p>kUSD is currently <span>overbought</span> by <b>{{ currentPegPercent.abs().toFixed(2) }}%</b>, and trading at <b>~${{ currentkUSDPrice }}</b>.</p>
              <br>
              <p>To reach equilibrium, <b>{{ formatNumber(deltaForPeg.kUSD.abs().toFixed(2)) }} kUSD</b> need to be sold for <b>{{ formatNumber(deltaForPeg.xtz.abs().toFixed(2)) }} XTZ</b>.</p>
              <br>
              <p class="help">Please note: This is a <b>*spot price*</b>, not an average price.</p>
            </div>
            <div
              class="peg-progress"
              :class="[pegProgressClass, {full: Math.abs(currentPegPercent) * 10 >= 100}]"
              :style="{width: `${Math.min(Math.abs(currentPegPercent) * 10, 100)}%`}"
            >
              <div class="peg-indicator">
                <p class="heading">{{ currentPegPercent.toFixed(1) }}%</p>
              </div>
            </div>
          </popover>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BigNumber from "bignumber.js";
BigNumber.config({ POW_PRECISION: 18 })

import Popover from "@/components/Popover";
import Mixins from "@/mixins";

export default {
  name: "PegVisualizer",
  mixins: [Mixins],
  async created() {
    this.$log("PegVisualizer component created");
  },
  components: {
    Popover,
  },
  data() {
    return {
      quipuData: null,
      tempPegPercent: new BigNumber(7),
    }
  },
  methods: {

  },
  watch: {
    '$store.priceData': async function () {
      const quipuContract = await this.$store.tezosToolkit.contract.at(this.$store.NETWORK_CONTRACTS.DEXES.QUIPUSWAP.POOL)
      this.quipuData = await quipuContract.storage()
      this.$emit("peg-stats", {
        deltaForPeg: this.deltaForPeg,
        currentPegPercent: this.currentPegPercent,
        currentkUSDPrice: this.currentkUSDPrice,
        pegProgressClass: this.pegProgressClass,
      })
    }
  },
  computed: {
    deltaForPeg(){
      const tezPool = this.quipuData.storage.tez_pool
      const tokenPool = this.quipuData.storage.token_pool
      const invariant = tezPool.times(tokenPool)
      const kUSDMantissa = new BigNumber(10).pow(18)
      const tezMantissa = new BigNumber(10).pow(6)
      const conversionMantissa = new BigNumber(10).pow(12)

      const quipuPrice = tokenPool.dividedBy(tezPool).dividedBy(conversionMantissa)

      const harbingerPrice = this.$store.priceData.price.div(tezMantissa)

      const percentOff = new BigNumber(1).minus(harbingerPrice.dividedBy(quipuPrice))
      const halfPercentOff = percentOff.dividedBy(2)
      const kusdToRecv = tokenPool.times(halfPercentOff)

      const onePercentOff = new BigNumber("0.01").dividedBy(2)
      const pegDepth = tokenPool.times(onePercentOff)

      const updatedTokenPoolAmt = tokenPool.minus(kusdToRecv)
      const updatedTezPoolAmt = invariant.dividedBy(updatedTokenPoolAmt)

      const tezInput = updatedTezPoolAmt.minus(tezPool).dividedBy(tezMantissa)

      // const updatedQuipuPrice = updatedTokenPoolAmt.dividedBy(updatedTezPoolAmt).dividedBy(conversionMantissa)

      return {kUSD: kusdToRecv.dividedBy(kUSDMantissa), xtz: tezInput, pegDepth}
    },
    currentPegPercent(){
      const quipuPrice = this.quipuData.storage.token_pool.div(this.quipuData.storage.tez_pool).div(1e12)
      return this.$store.priceData.price.div(1e6).dividedBy(quipuPrice).minus(1).times(100)
    },
    currentkUSDPrice(){
      if (this.currentPegPercent.isNegative()){
        return new BigNumber(1).minus(this.currentPegPercent.div(100).abs()).toFixed(2)
      } else {
        return new BigNumber(1).plus(this.currentPegPercent.div(100).abs()).toFixed(2)
      }
    },
    pegProgressClass(){
      if (this.currentPegPercent.abs().isLessThanOrEqualTo(5)){
        return "green"
      } else if (this.currentPegPercent.abs().isLessThanOrEqualTo(7.5)) {
        return "yellow"
      } else {
        return "red"
      }
    }
  }
};
</script>

<style type="text/scss" lang="scss">
@import "../assets/sass/globals";
.peg-visualizer {
  width: 90%;
  .loader-wrapper{
    padding-bottom: 0;
    padding-top: 0;
  }
  .peg-bar{
    width: 100%;
    height: 0.75rem;
    border-radius: 5px;
    border: 1px solid #eee;
    position: relative;
    display: flex;
    align-items: center;
    .ticks{
      width: 100%;
      position: absolute;
      height: 0.25rem;
      display: flex;
      justify-content: space-between;
      top: 0;
      .tick:first-child, .tick:last-child{
        opacity: 0;
      }
      .tick{
        display: block;
        background: #eee;
        width: 1px;
        height: 0.65rem;
      }
    }
    .peg-progress{
      height: 100%;
      position: relative;
      transition: width 250ms ease;
      cursor: pointer;
      &.green{
        background: $primary;
      }
      &.yellow{
        background: $warning;
      }
      &.red{
        background: $danger;
      }
    }
    .negative-peg, .positive-peg{
      width: 50%;
      position: relative;
      height: 100%;
      > span{
        width: 100%;
        height: 100%;
      }
      .popper{
        width: 28rem;
      }
    }
    .negative-peg{
      display: flex;
      justify-content: flex-end;
      > span{
        display: flex;
        justify-content: flex-end;
      }
      .peg-progress.full{
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
      }
      .peg-indicator{
        position: absolute;
        left: 0;
        top: 0.75rem;
        p{
          margin-left: 0.5rem;
        }
        &::before{
          content: "";
          width: 0.4rem;
          height: 0.4rem;
          position: absolute;
          top: 0.4rem;
          left: -0.2rem;
          transform: rotate(45deg);
          border-left: 1px solid $grey-dark;
          border-top: 1px solid $grey-dark;
        }
      }
    }
    .positive-peg{
      display: flex;
      justify-content: flex-start;
      .peg-progress.full{
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
      }
      .peg-indicator{
        right: 0;
        position: absolute;
        top: 1rem;
        p{
          margin-right: 0.5rem;
        }
        &::after{
          content: "";
          width: 0.4rem;
          height: 0.4rem;
          position: absolute;
          top: 0.4rem;
          right: -0.2rem;
          transform: rotate(45deg);
          border-left: 1px solid $grey-dark;
          border-top: 1px solid $grey-dark;
        }
      }
    }
  }
}
</style>
