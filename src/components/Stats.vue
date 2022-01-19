<template>
  <div class="stats">
    <nav class="level">
      <div class="level-item has-text-centered">
        <div class="is-flex is-flex-direction-column is-align-items-center">
          <p class="heading">Active Ovens</p>
          <p v-if="$store.ovenCount === null" class="loader"></p>
          <p v-else class="title">{{ $store.ovenCount }}</p>
        </div>
      </div>
      <div class="level-item has-text-centered">
        <div class="is-flex is-flex-direction-column is-align-items-center">
          <p class="heading">Stability Fee (yearly)</p>
          <p v-if="$store.stabilityFee === null" class="loader"></p>
          <p v-else-if="typeof $store.stabilityFee === 'string'" class="title">{{ $store.stabilityFee }}</p>
          <p v-else class="title">{{ formattedStabilityFee() }}</p>
        </div>
      </div>
      <div class="level-item has-text-centered">
        <div class="is-flex is-flex-direction-column is-align-items-center">
          <p class="heading">
            Collateral Ratio
            <popover>
              <span slot="popup-content">
                <span>
                  The collateral ratio determines how much collateral you need to back your minted kUSD with.
                  <br>
                  A ratio of 200% means for every 1 kUSD you mint, you need at *least* $2 worth of XTZ.
                  <span v-if="$store.lpDisabled">
                    <br>
                    <br>
                    <b>The collateral ratio is temporarily {{ formattedCollateralRate() }}%</b> due to a <b><a href="https://kolibri-xtz.medium.com/kolibri-liquidity-pool-exploit-postmortem-f738966c20fb" rel="noopener" target="_blank">vulnerability in the Kolibri Liquidity Pool</a></b>.
                  </span>
                </span>
              </span>
              <span>(<a class="has-text-primary has-text-weight-bold">?</a>)</span>
            </popover>
          </p>
          <p v-if="$store.collateralRate === null" class="loader"></p>
          <p v-else :class="{'has-text-warning': $store.lpDisabled}"  class="title">{{ formattedCollateralRate() }}%</p>
        </div>
      </div>
    </nav>

    <div class="peg-data is-flex is-flex-direction-column is-align-items-center">
      <p class="heading">
        kUSD Price / Peg Depth -
        <span v-if="pegData !== null">
          <strong>${{ pegData.currentkUSDPrice }}</strong> / <strong>{{ formatNumber(pegData.deltaForPeg.pegDepth.dividedBy(1e18), 2) }} kUSD</strong>
        </span>
        <strong v-else><span class="tiny-loader loader"></span></strong>
        <popover>
          <span slot="popup-content">
            <span>
              The kUSD <b>"peg"</b> is tracked against the <b><a target="_blank" rel="noopener" :href="harbingerLink()">Harbinger</a></b> price feed,
              <br>
              which is a <b><a target="_blank" rel="noopener" href="https://www.investopedia.com/terms/v/vwap.asp">VWAP</a></b> of <b><a href="https://pro.coinbase.com/trade/XTZ-USD" rel="noopener" target="_blank">Coinbase Pro</a></b> data for the XTZ/USD pair.
            </span>
            <br><br>
            <span>
              The <b><router-link target="_blank" :to="{ name: 'Docs', params: { folder: 'general', page: 'the-peg' } }">Peg Depth</router-link></b> is a measurement of the amount of <br> kUSD needed to be bought or sold to move the peg by <b>1%</b>.
            </span>
          </span>
          <span>(<a class="has-text-primary has-text-weight-bold">?</a>)</span>
        </popover>
      </p>
      <peg-visualizer @peg-stats="pegData = $event" />
    </div>

    <div v-if="!showAll" class="seperator is-relative">
      <div class="more has-text-centered">
        <a @click="showAll = true" class="more-link heading">
          More <i class="arrow down"></i>
        </a>
      </div>

      <hr />
    </div>
    <div class="animate__animated animate__fadeIn bottom-stats" v-else>
      <nav class="level">
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">All Tez in Kolibri Ovens</p>
            <p v-if="$store.balanceData === null" class="loader"></p>
            <p v-else-if="typeof $store.balanceData === 'string'" class="title"> {{ $store.balanceData }} </p>
            <p v-else class="title">
              {{
                numberWithCommas(
                    ($store.balanceData.totalBalance / Math.pow(10, 6)).toFixed(0)
                )
              }}
              <span class="subtitle">ꜩ</span>
            </p>
          </div>
        </div>
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">Value Of All Ovens</p>
            <p v-if="$store.priceData === null || $store.balanceData === null" class="loader"></p>
            <p v-else-if="typeof $store.balanceData === 'string'" class="title">{{ $store.balanceData }}</p>
            <p v-else class="title">
              ${{
                numberWithCommas(
                    (
                        $store.balanceData.totalBalance
                            .dividedBy(Math.pow(10, 6))
                            .times($store.priceData.price.dividedBy(Math.pow(10,6)))
                    ).toFixed(0)
                )
              }}
            </p>
          </div>
        </div>
      </nav>

      <nav class="level">
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">Total kUSD In Existence</p>
            <p v-if="$store.balanceData === null" class="loader"></p>
            <p v-else-if="typeof $store.balanceData === 'string'" class="title">{{ $store.balanceData }}</p>
            <p v-else class="title">
              {{ numberWithCommas($store.balanceData.totalTokens.toFixed(0)) }}
              <span class="subtitle">kUSD</span>
            </p>
          </div>
        </div>
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">Current Debt Ceiling</p>

            <p v-if="$store.debtCeiling === null" class="loader"></p>
            <p v-else class="title">
              {{ numberWithCommas(this.$store.debtCeiling.dividedBy(Math.pow(10, 18)).toFixed(0)) }}
              <span class="subtitle">kUSD</span>
            </p>
          </div>
        </div>
      </nav>

      <nav class="level">
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">Stability Fund</p>

            <p v-if="$store.stabilityFundHoldings === null" class="loader"></p>
            <p v-else class="title">
              {{
                numberWithCommas(
                    this.$store.stabilityFundHoldings.dividedBy(Math.pow(10, 18)).toFixed(2)
                )
              }}
              <span class="subtitle">kUSD</span>
            </p>
          </div>
        </div>
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">Development Fund</p>

            <p v-if="$store.devFundHoldings === null" class="loader"></p>
            <p v-else class="title">
              {{
                numberWithCommas(
                    this.$store.devFundHoldings.dividedBy(Math.pow(10, 18)).toFixed(2)
                )
              }}
              <span class="subtitle">kUSD</span>
            </p>
          </div>
        </div>
      </nav>

      <div class="seperator is-relative">
        <div class="more has-text-centered">
          <a @click="showAll = false" class="more-link heading">
            Less <i class="arrow up"></i>
          </a>
        </div>

        <hr />
      </div>
    </div>

    <div
      class="container price-container is-flex is-align-items-center is-justify-content-center"
    >
      <h1 class="subtitle is-marginless has-text-weight-normal">
        Latest
        <a :href="harbingerLink()" target="_blank" rel="noopener">
          XTZ/USD Oracle
        </a>
        Price:
      </h1>
      <div class="price-data">
        <p v-if="$store.priceData === null" class="loader is-small"></p>
        <p v-else class="title is-5 is-marginless">
          ${{
            $store.priceData.price
              .dividedBy(Math.pow(10, 6))
              .toFixed(2)
              .toLocaleString()
          }}
        </p>
      </div>
    </div>
    <p class="heading last-update-time">
      Oracle Last Updated
      <span
        v-if="$store.priceData === null"
        class="loader is-small is-inline-block"
      ></span>
      <strong v-else>
        <popover v-if="duration($store.priceData.time) > 30 * 60 * 1000">
          <strong slot="popup-title" class="has-text-danger">⛔ Warning</strong>
          <strong slot="popup-content">
            The price oracle has lagged behind longer than 30 minutes, so most
            functionality has been disabled by the protocol.
          </strong>
          <span class="has-text-danger">
            ⛔️{{ humanTime($store.priceData.time) }} Ago
          </span>
        </popover>

        <popover v-else-if="duration($store.priceData.time) > 25 * 60 * 1000">
          <strong slot="popup-title" class="has-text-danger">⚠️ Warning</strong>
          <strong slot="popup-content">
            The price oracle seems to be lagging behind. If the oracle is more
            than 30 mins off, some functionality within the ovens is disabled
            by the protocol out of an abundance of caution.
          </strong>
          <span>⚠️️{{ humanTime($store.priceData.time) }} Ago</span>
        </popover>

        <span v-else>{{ humanTime($store.priceData.time) }} Ago</span>
      </strong>
    </p>
  </div>
</template>

<script>
import moment from "moment";
import BigNumber from "bignumber.js";
BigNumber.config({ POW_PRECISION: 18 })

import { ConversionUtils } from '@hover-labs/kolibri-js'
import Popover from "@/components/Popover";
import Mixins from "@/mixins";

import axios from "axios";
import PegVisualizer from "@/components/PegVisualizer";

export default {
  name: "Stats",
  mixins: [Mixins],
  created() {
    this.$log("Stats component created");
    setInterval(() => {
      this.now = moment();
    }, 1000);

    this.statsUpdateTimer = setInterval(this.updateStatsData, 30 * 1000);

    this.updateStatsData();
  },
  components: {
    PegVisualizer,
    Popover,
  },
  data() {
    return {
      now: moment(),
      showAll: false,
      statsUpdateTimer: null,
      pegData: null
    };
  },
  methods: {
    harbingerLink(){
      if (this.$store.isTestnet){
        return 'https://testnet.harbinger.live'
      } else if (this.$store.isSandbox){
        return 'https://sandbox.harbinger.live'
      } else {
        return 'https://harbinger.live'
      }
    },
    updateStatsData() {
      this.$store.stableCoinClient.getOvenCount()
        .then((count) => {
          this.$store.ovenCount = count;
        })
        .catch((err) => {
          clearInterval(this.statsUpdateTimer)
          console.error("Error getting oven count ", err)
          this.$store.ovenCount = "?";
        });

      axios
        .get(`https://kolibri-data.s3.amazonaws.com/${this.$store.network}/totals.json`)
        .then((result) => {
          const { totalBalance, totalTokens } = result.data;
          this.$store.balanceData = {
            totalBalance: new BigNumber(totalBalance),
            totalTokens: new BigNumber(totalTokens),
          };
        })
        .catch((err) => {
          clearInterval(this.statsUpdateTimer)
          console.error("Error getting oven count ", err)
          this.$store.balanceData = "?";
        })

      this.$store.tezosToolkit.contract.at(this.$store.NETWORK_CONTRACTS.TOKEN)
        .then(async (token) => {
          const storage = await token.storage()
          this.$store.debtCeiling = storage.debtCeiling
        })

      this.$store.tokenClient.getBalance(this.$store.NETWORK_CONTRACTS.STABILITY_FUND)
        .then((holdings) => {
          this.$store.stabilityFundHoldings = holdings
        })

      this.$store.tokenClient.getBalance(this.$store.NETWORK_CONTRACTS.DEVELOPER_FUND)
          .then((holdings) => {
            this.$store.devFundHoldings = holdings
          })
    },
    formattedStabilityFee() {
      return ConversionUtils.shardToHumanReadablePercentage(
        this.$store.stabilityFee,
        2
      );
    },
    formattedCollateralRate() {
      if (this.$store.lpDisabled){
        return (this.$store.collateralRate - this.$store.privateLiquidationThreshold) / new BigNumber(Math.pow(10, 18));
      } else {
        return this.$store.collateralRate / new BigNumber(Math.pow(10, 18));
      }
    },
    humanTime(time) {
      return this.duration(time).humanize();
    },
    duration(time) {
      return moment.duration(this.now - moment(time));
    },
  },
};
</script>

<style type="text/scss" lang="scss">
@import "../assets/sass/globals";
.stats {
  .more{
    position: absolute;
    top: -0.75rem;
    right: 0;
    left: 0;
    .more-link{
      display: inline-block;
      background: white;
      padding: .25rem .5rem;
      border-radius: 5px;
      border: 1px solid whitesmoke;
      &:hover{
        .arrow{
          border: solid $grey-dark;
          border-width: 0 1px 1px 0;
        }
      }
    }
  }

  .arrow {
    border: solid $primary;
    border-width: 0 1px 1px 0;
    display: inline-block;
    padding: 2px;
    margin-bottom: 0.15rem;
    &.down{
      transform: rotate(45deg);
      -webkit-transform: rotate(45deg);
    }
    &.up{
      transform: rotate(225deg);
      -webkit-transform: rotate(225deg);
    }
  }
  .loader {
    height: 2rem;
    width: 2rem;
    margin-top: 0.25rem;
    &.is-small {
      height: 1rem;
      width: 1rem;
    }
  }
  .last-update-time {
    text-align: center;
    margin: 0.5rem 0 0;
    .loader {
      margin-bottom: -4px;
    }
    .popper {
      max-width: 30rem;
      strong,
      p {
        text-transform: initial;
      }
    }
  }
  .price-container {
    a {
      border-bottom: 1px solid $grey-darker;
      font-weight: bold;
      color: $grey-darker;
      &:hover {
        color: $primary;
        border-bottom: 1px solid $primary;
      }
    }
    .subtitle {
      padding-right: 0.5rem;
    }
    .price-data {
      min-width: 4.625rem;
    }
  }
  .peg-data{
    padding-bottom: 0.75rem;
    .loader.tiny-loader{
      display: inline-block;
      height: 0.5rem;
      width: 0.5rem;
      margin: 0;
    }
    strong{
      &.green{
        color: $primary;
      }
      &.yellow{
        color: $warning;
      }
      &.red{
        color: $danger;
      }
    }
  }
  .bottom-stats{
    margin-top: 1rem;
  }
}
</style>
