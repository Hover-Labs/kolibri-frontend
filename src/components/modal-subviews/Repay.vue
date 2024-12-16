<template>
  <div class="repay">
    <div class="field is-horizontal">
      <div class="field-label is-normal">
        <label class="label">Amount:</label>
      </div>
      <div class="field-body">
        <div class="field has-addons">
          <p class="control is-expanded">
            <input
              v-on:keyup.enter="shouldAllowRepay && repay()"
              v-focus
              type="number"
              min="0"
              v-model.number="repayAmount"
              class="input"
              placeholder="1.2345"
            />
          </p>
          <p class="control">
            <a class="button is-static has-text-weight-bold"> kUSD </a>
          </p>
        </div>
      </div>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>Borrowed kUSD: </strong>
        <strong class="price-view">
          <popover extra-classes="small-price">
            <strong
              slot="popup-content"
              class="has-text-primary heading is-marginless"
            >
              {{numberWithCommas(outstandingTokensFormatted(ovenAddress).toFixed(18)) }} kUSD
            </strong>

            <strong class="price-has-popover">
              {{numberWithCommas(outstandingTokensFormatted(ovenAddress).toFixed(2)) }} kUSD
            </strong>
          </popover>
        </strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>Wallet Holdings: </strong>
        <strong class="price-view"
          >{{
            numberWithCommas(
              $store.walletBalance.dividedBy(Math.pow(10, 18)).toFixed(2)
            )
          }}
          kUSD</strong
        >
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <strong>Max Payback Amount: </strong>
        <strong class="price-view">
          <a @click="repayAmount = maxPaybackAmt.toFixed(18)">
            {{ numberWithCommas(maxPaybackAmt.toFixed(2)) }} kUSD
          </a>
        </strong>
      </p>
    </div>
    <div class="field is-horizontal">
      <div class="field-label"></div>
      <div class="field-body is-align-items-center">
        <div class="field">
          <p class="control">
            <progress
              class="progress"
              :class="
                collatoralizationWarningClasses(collateralizedRateAfterRepaying)
              "
              :value="collateralizedRateAfterRepaying.toFixed(2)"
              max="100"
            ></progress>
          </p>
        </div>
      </div>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>Current Collateral Utilization:</strong>
        <strong class="price-view"
          >{{ currentCollateralRate(ovenAddress).toFixed(2) }}%</strong
        >
      </p>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>New Collateral Utilization:</strong>
        <strong
            v-if="repayAmount === maxPaybackAmt"
            class="price-view"
        >
          -
        </strong>
        <strong
          v-else-if="repayAmount && repayAmount > 0"
          :class="collatoralizationWarningClasses(collateralizedRateAfterRepaying)"
          class="price-view"
        >
          {{ collateralizedRateAfterRepaying.toFixed(2) }}%
        </strong>
        <strong v-else class="price-view">-</strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <strong>Oven Liquidatable when XTZ price is:</strong>
        <strong
            v-if="repayAmount === maxPaybackAmt"
            class="price-view"
        >
          -
        </strong>
        <strong
            v-else-if="repayAmount && repayAmount > 0"
            class="price-view has-text-primary"
        >
          ${{ liquidationPriceAfterRepaying.toFixed(2) }}
        </strong>
        <strong
            v-else-if="borrowedTokens(ovenAddress) > 0"
            class="price-view"
        >
          ${{ liquidatablePrice(ovenAddress).toFixed(2) }}
        </strong>
        <strong v-else class="price-view">-</strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="control">
        <button
          @click="repay()"
          :disabled="!shouldAllowRepay"
          class="button is-primary has-text-weight-bold"
          :class="{ 'is-loading': networkLoading }"
        >
          Repay
        </button>
      </p>
    </div>
  </div>
</template>

<script>
import Mixins from "@/mixins";
import BigNumber from "bignumber.js";
import Popover from "@/components/Popover.vue";
import emitter from "@/bus";

BigNumber.config({ POW_PRECISION: 18 })

export default {
  name: "Repay",
  components: {Popover},
  mixins: [Mixins],
  props: {
    ovenAddress: {
      type: String,
    },
  },
  data: function () {
    return {
      repayAmount: null,
      networkLoading: false,
    };
  },
  methods: {
    async repay() {
      try {
        this.networkLoading = true;
        const repayAmt = new BigNumber(this.repayAmount)
          .decimalPlaces(18)
          .multipliedBy(Math.pow(10, 18));
        let repayResult = await this.ovenClient(this.ovenAddress).repay(
          repayAmt.toFixed()
        );
        emitter.emit(
          "oven-tx-submitted",
          repayResult,
          this.ovenAddress,
          "repay"
        );
        this.$emit("close-requested");
      } catch (e) {
        this.handleWalletError(
          e,
          "Unable to repay",
          "There was an issue with the repay request."
        );
      } finally {
        this.networkLoading = false;
      }
    },
  },
  computed: {
    shouldAllowRepay() {
      if (!this.repayAmount || this.repayAmount <= 0) {
        return false;
      }
      return new BigNumber(this.repayAmount).isLessThanOrEqualTo(
        this.outstandingTokensFormatted(this.ovenAddress)
      );
    },
    maxPaybackAmt() {
      if (
        this.walletBalanceFormatted().isLessThanOrEqualTo(
          this.outstandingTokensFormatted(this.ovenAddress)
        )
      ) {
        return this.walletBalanceFormatted().decimalPlaces(18);
      } else {
        return this.outstandingTokensFormatted(this.ovenAddress).decimalPlaces(18);
      }
    },
    collateralizedRateAfterRepaying() {
      let repayAmount = this.repayAmount;
      if (!repayAmount || repayAmount <= 0) {
        repayAmount = 0;
      }

      const maxCollateral = this.ovenDollarValue(this.ovenAddress).dividedBy(this.$store.collateralOperand);

      const borrowedTokens = this.outstandingTokensFormatted(this.ovenAddress);

      let newTokenCount = borrowedTokens.minus(repayAmount);

      if (newTokenCount.isLessThan(0)) {
        newTokenCount = new BigNumber(0);
      }

      return newTokenCount.dividedBy(maxCollateral).times(100);
    },
    liquidationPriceAfterRepaying(){
      let rateDelta = 1 - this.collateralizedRateAfterRepaying.dividedBy(100).toNumber()
      let currentPrice = this.$store.priceData.price.dividedBy(Math.pow(10, 6))

      return currentPrice.minus(currentPrice.times(rateDelta))
    }
  },
};
</script>

<style type="text/scss" lang="scss">
@import "../../assets/sass/globals";

.repay {
}
</style>
