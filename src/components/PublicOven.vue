<template>
  <div class="box oven public-oven">
    <div class="top">
      <nav class="level is-mobile">
        <div class="level-left">
          <div class="level-item">
            <h1 class="title is-5 is-family-monospace">
              <a
                target="_blank"
                rel="noopener"
                :href="tzktLinkContract(oven.ovenAddress)"
                >
                {{ oven.ovenAddress }}
              </a>
            </h1>
          </div>
        </div>
        <div class="level-right">
          <div class="level-item liquidation-buttons">
            <slot v-if="$store.walletPKH !== null" name="liquidation-button">
              <template v-if="$store.privateLiquidationThreshold">
                <popover v-if="privateLiquidationThreshold.isGreaterThan(collatoralizedRateForOven(oven))">
                  <strong
                    slot="popup-content"
                    class="has-text-primary is-marginless has-text-centered"
                  >
                    You can only liquidate ovens as an individual that are &lt;{{ $store.collateralRate.minus($store.privateLiquidationThreshold).dividedBy(Math.pow(10, 18)) }}% collateralized ({{ privateLiquidationThreshold }}%+ utilization).<br>You can read more about this change <a style="border-bottom: 1px solid #3EBD93;" target="_blank" rel="noopener" href="https://discuss.kolibri.finance/t/kip-006-prioritize-the-liquidation-pool-in-liquidations/58">here</a>
                  </strong>

                  <!-- Note, using v-if in a default scoped slot breaks the underlying popper library :-/ -->
                  <span>
                    <a
                      :disabled="pendingTransaction || ($store.privateLiquidationThreshold && privateLiquidationThreshold.isGreaterThan(collatoralizedRateForOven(oven)))"
                      v-if="
                        $store.wallet !== null &&
                        !oven.isLiquidated &&
                        lpLiquidationThreshold.isLessThan(collatoralizedRateForOven(oven))"
                      :class="{'is-loading': networkLoading}"
                      class="button is-danger is-small">
                      Liquidate
                    </a>
                  </span>
                </popover>

                <button
                  v-else
                  :disabled="pendingTransaction"
                  :class="{'is-loading': networkLoading}"
                  @click="liquidateOven()"
                  class="button is-danger is-small">
                  Liquidate
                </button>
              </template>
              <template v-else>
                <button
                  :disabled="pendingTransaction"
                  v-if="$store.wallet !== null && !oven.isLiquidated && collatoralizedRateForOven(oven) > 100"
                  @click="liquidateOven()"
                  :class="{'is-loading': networkLoading}"
                  class="button is-danger is-small">
                  Liquidate
                </button>
              </template>

              <router-link
                :to="{name: 'LiquidityPool'}"
                tag="button"
                :disabled="pendingTransaction"
                v-if="
                  $store.wallet !== null &&
                  !$store.lpDisabled &&
                  !oven.isLiquidated &&
                  $store.collateralRate
                    .dividedBy(Math.pow(10, 18))
                    .dividedBy(2)
                    .isLessThan(collatoralizedRateForOven(oven))
                "
                class="button is-danger is-small">
                Liquidate via Liquidity Pool
              </router-link>
            </slot>
          </div>
        </div>
      </nav>
    </div>

    <div v-if="pendingTransaction" class="loader-wrapper">
      <h1 class="title is-marginless is-5">
        <a
            :title="pendingTransaction"
            v-if="pendingTransaction !== true"
            target="_blank"
            rel="noopener"
            :href="tzktLinkTx(pendingTransaction)"
        >
          Transaction Pending...
        </a>
        <span v-else>
          Transaction Pending...
        </span>
      </h1>
      <div class="loader left-spaced"></div>
    </div>
    <div v-else class="oven-info">
      <div v-if="oven.isLiquidated" class="liquidated-warning">
        <h1 class="title is-4 has-text-white">
          This Oven Has Been
          <router-link
            rel="noopener"
            target="_blank"
            :to="{
              name: 'Docs',
              params: { folder: 'liquidation', page: 'overview' },
            }"
            >Liquidated</router-link
          >
        </h1>
      </div>
      <div :class="{'is-flex-direction-column': compact}" class="columns is-gapless">
        <div class="column is-flex is-flex-direction-column is-align-items-center is-justify-content-center">
          <div class="is-flex is-flex-direction-column is-justify-content-center left-info">
            <p class="heading">Delegated Baker: <strong><a target="_blank" rel="noopener" :href="`https://${this.$store.network === 'mainnet' ? '' : this.$store.network + '.'}tzkt.io/${oven.baker}/delegators`">{{ oven.baker }}</a></strong></p>
            <div class="is-flex is-justify-content-space-between">
              <p class="heading delegated-baker">Owned By:
                <a
                    target="_blank"
                    rel="noopener"
                    class="has-text-weight-semibold"
                    :href="tzktLinkContract(oven.ovenOwner)"
                >
                  {{ oven.ovenOwner }}
                </a>
              </p>
              <p class="heading">Utilization:
                <strong v-if="collatoralizedRateForOven(oven) < 80">{{ collatoralizedRateForOven(oven) }}%</strong>
                <strong v-else-if="collatoralizedRateForOven(oven) < 100" class="has-text-warning">{{ collatoralizedRateForOven(oven) }}%</strong>
                <strong v-else class="has-text-danger">{{ collatoralizedRateForOven(oven) }}%</strong>
              </p>
            </div>

            <div class="allocation-info is-fullwidth">
              <progress v-if="collatoralizedRateForOven(oven) < 80" class="progress is-primary" :value="collatoralizedRateForOven(oven)" max="100">{{ collatoralizedRateForOven(oven) }}%</progress>
              <progress v-else-if="collatoralizedRateForOven(oven) < 100" class="progress is-warning" :value="collatoralizedRateForOven(oven)" max="100">{{ collatoralizedRateForOven(oven) }}%</progress>
              <progress v-else class="progress is-danger" :value="collatoralizedRateForOven(oven)" max="100">{{ collatoralizedRateForOven(oven) }}%</progress>
            </div>
          </div>
        </div>
        <div class="column">
          <nav :class="{compact}" class="level right-info">
            <div class="level-item has-text-centered">
              <div
                class="is-flex is-flex-direction-column is-align-items-center"
              >
                <p class="heading">Collateral Value</p>
                <popover extra-classes="small-price">
                  <strong
                    slot="popup-content"
                    class="has-text-primary heading is-marginless"
                  >
                    ${{ numberWithCommas(ovenValue(oven.balance)) }} USD
                  </strong>

                  <strong class="price-has-popover">${{
                      numberWithCommas(ovenValue(oven.balance).toFixed(2))
                    }} USD
                  </strong>
                </popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div
                class="is-flex is-flex-direction-column is-align-items-center"
              >
                <p class="heading">Balance</p>
                <p class="title is-6">
                  <popover extra-classes="small-price">
                    <strong
                      slot="popup-content"
                      class="has-text-primary heading is-marginless"
                    >
                      {{
                        numberWithCommas(
                          oven.balance.dividedBy(Math.pow(10, 6))
                        )
                      }}
                      ꜩ
                    </strong>

                    <strong class="price-has-popover">{{
                        numberWithCommas(
                          oven.balance.dividedBy(Math.pow(10, 6)).toFixed(2)
                        )
                      }} ꜩ
                    </strong>
                  </popover>
                </p>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div
                class="is-flex is-flex-direction-column is-align-items-center"
              >
                <p class="heading">
<!--                  <a @click="oven.outstandingTokens = oven.outstandingTokens.minus(1e18)">-</a>-->
                  Loan Amt
<!--                  <a @click="oven.outstandingTokens = oven.outstandingTokens.plus(1e18)">+</a>-->
                </p>
                <popover extra-classes="small-price">
                  <strong
                    slot="popup-content"
                    class="has-text-primary heading is-marginless"
                  >
                    {{
                      numberWithCommas(
                        oven.outstandingTokens.dividedBy(Math.pow(10, 18))
                      )
                    }}
                    kUSD
                  </strong>

                  <strong class="price-has-popover">{{
                      numberWithCommas(
                        oven.outstandingTokens
                          .dividedBy(Math.pow(10, 18))
                          .toFixed(2)
                      )
                    }} kUSD
                  </strong>
                </popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div
                class="is-flex is-flex-direction-column is-align-items-center"
              >
                <p class="heading">Stability Fee</p>
                <popover extra-classes="small-price">
                  <strong
                    slot="popup-content"
                    class="has-text-primary heading is-marginless"
                  >
                    {{
                      numberWithCommas(
                        oven.stabilityFee.dividedBy(Math.pow(10, 18))
                      )
                    }}
                    kUSD
                  </strong>

                  <strong class="price-has-popover">{{
                      numberWithCommas(
                        oven.stabilityFee.dividedBy(Math.pow(10, 18)).toFixed(6)
                      )
                    }} kUSD
                  </strong>
                </popover>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Mixins from "@/mixins";
import Popover from "@/components/Popover";

export default {
  name: "PublicOven",
  props: ["oven", "compact", "liquidateEmitOnly"],
  mixins: [Mixins],
  methods: {
    async liquidateOven(){
      this.networkLoading = true
      try {
        let tx = await this.ovenClient(this.oven.ovenAddress).liquidate()

        this.networkLoading = false

        this.pendingTransaction = tx.opHash

        await tx.confirmation(1)

        this.pendingTransaction = null

        this.$emit("oven-liquidated", this.oven.ovenAddress)
      } catch (e) {
        this.networkLoading = false
        this.handleWalletError(e, "Couldn't liquidate oven", "There was an issue liquidating this oven!")
      }
    },
    ovenValue(ovenBalance) {
      let currentValue = this.$store.priceData.price
        .multipliedBy(ovenBalance)
        .dividedBy(Math.pow(10, 10));
      return currentValue.dividedBy(Math.pow(10, 2));
    },
    maxBorrowAmt(ovenBalance) {
      if (parseInt(ovenBalance) === 0) {
        return 0;
      }

      let currentValue = this.$store.priceData.price
        .multipliedBy(ovenBalance)
        .dividedBy(Math.pow(10, 10));
      let valueHalf = currentValue.dividedBy(2);

      let borrowedTokens = this.oven.outstandingTokens.dividedBy(Math.pow(10, 18));

      return valueHalf.minus(borrowedTokens).dividedBy(100);
    },
    collatoralizedRate(ovenBalance) {
      if (parseInt(ovenBalance) === 0) {
        return 0;
      }

      let currentValue = this.$store.priceData.price
        .multipliedBy(ovenBalance)
        .dividedBy(Math.pow(10, 10));
      let valueHalf = currentValue.dividedBy(2);

      let rate = this.oven.outstandingTokens
        .dividedBy(valueHalf)
        .dividedBy(Math.pow(10, 14));

      return rate.toFixed(2);
    },
  },
  data() {
    return {
      pendingTransaction: null,
      networkLoading: false,
    };
  },
  computed: {
    privateLiquidationThreshold(){
      return this.$store.collateralRate
        .plus(this.$store.privateLiquidationThreshold)
        .dividedBy(Math.pow(10, 18))
        .dividedBy(2)
    },
    lpLiquidationThreshold(){
      return this.$store.collateralRate
        .dividedBy(Math.pow(10, 18))
        .dividedBy(2)
    }
  },
  components: {
    Popover,
  },
};
</script>

<style type="text/scss" lang="scss">
@import "../assets/sass/globals";

.public-oven {
  @include until($desktop) {
    .level-item {
      white-space: nowrap;
      .title {
        text-overflow: ellipsis;
        max-width: 90vw;
        overflow: hidden;
      }
    }
  }
  .liquidation-buttons{
    button:not(first-child){
      margin-left: .5rem;
    }
  }
  .delegated-baker{
    max-width: 60vw;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
}
</style>
