<template>
  <div class="borrow">
    <div class="field is-horizontal">
      <div class="field-label is-normal">
        <label class="label">Amount:</label>
      </div>
      <div class="field-body">
        <div class="field has-addons">
          <p class="control is-expanded">
            <input
              v-on:keyup.enter="shouldAllowBorrow && borrow()"
              v-focus
              type="number"
              min="0"
              v-model.number="borrowAmount"
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
        <strong>Borrowed kUSD:</strong>
        <strong class="price-view"
          >{{
            numberWithCommas(borrowedTokensFormatted(ovenAddress).toFixed(2))
          }}
          kUSD</strong
        >
      </p>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>Max Borrow Amount:</strong>
        <strong class="price-view">
          {{ numberWithCommas(maxBorrowAmtkUSD(ovenAddress).toFixed(2)) }} kUSD
        </strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <a
          v-if="borrowAmtNumber.isLessThanOrEqualTo(maxSafeAmt.times(1.01))"
          @click="borrowAmount = maxSafeAmt.toFixed(2)"
          class="has-text-weight-bold"
          >Max Safe (80%)</a
        >
        <span class="has-text-weight-bold" v-else
          >⚠️ You are >80% collateralized, which is not recommended!</span
        >
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
                collatoralizationWarningClasses(
                  collateralizedRateAfterBorrowing
                )
              "
              :value="collateralizedRateAfterBorrowing.toFixed(2)"
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
          v-if="borrowAmount && borrowAmount > 0"
          :class="
            collatoralizationWarningClasses(collateralizedRateAfterBorrowing)
          "
          class="price-view"
          >{{ collateralizedRateAfterBorrowing.toFixed(2) }}%</strong
        >
        <strong v-else class="price-view">-</strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <strong>Oven Liquidatable when XTZ price is:</strong>
        <strong
          v-if="borrowAmount && borrowAmount > 0"
          class="price-view has-text-danger"
        >
          ${{ liquidationPriceAfterBorrowing.toFixed(2) }}
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
          @click="borrow()"
          :disabled="!shouldAllowBorrow"
          class="button is-primary has-text-weight-bold"
          :class="{ 'is-loading': networkLoading }"
        >
          Borrow
        </button>
      </p>
    </div>
  </div>
</template>

<script>
import Mixins from "@/mixins";
import BigNumber from "bignumber.js";
import emitter from "@/bus";

export default {
  name: "Borrow",
  mixins: [Mixins],
  props: {
    ovenAddress: {
      type: String,
    },
  },
  data: function () {
    return {
      borrowAmount: null,
      networkLoading: false,
    };
  },
  methods: {
    async borrow() {
      try {
        this.networkLoading = true;
        const borrowAmt = new BigNumber(this.borrowAmount)
          .decimalPlaces(18)
          .multipliedBy(Math.pow(10, 18));
        let borrowResult = await this.ovenClient(this.ovenAddress).borrow(
          borrowAmt.toFixed()
        );
        emitter.emit(
          "oven-tx-submitted",
          borrowResult,
          this.ovenAddress,
          "borrow"
        );
        this.$emit("close-requested");
      } catch (e) {
        this.handleWalletError(
          e,
          "Unable to borrow",
          "There was an issue with the borrow request."
        );
      } finally {
        this.networkLoading = false;
      }
    },
  },
  computed: {
    maxSafeAmt() {
      return this.ovenDollarValue(this.ovenAddress)
      .dividedBy(this.$store.collateralOperand)
      .multipliedBy(0.8)
      .minus(this.outstandingTokensFormatted(this.ovenAddress))
      .decimalPlaces(18);
    },
    shouldAllowBorrow() {
      if (!this.borrowAmount || this.borrowAmount <= 0) {
        return false;
      }
      return (
        this.borrowAmount <=
        this.maxBorrowAmtkUSD(this.ovenAddress).decimalPlaces(18).toNumber()
      );
    },
    borrowAmtNumber() {
      return this.borrowAmount
        ? new BigNumber(this.borrowAmount)
        : new BigNumber(0);
    },
    collateralizedRateAfterBorrowing() {
      let borrowAmount = this.borrowAmount;
      if (!borrowAmount || borrowAmount <= 0) {
        borrowAmount = 0;
      }

      const maxCollateral = this.ovenDollarValue(this.ovenAddress).dividedBy(this.$store.collateralOperand);

      const borrowedTokens = this.outstandingTokensFormatted(this.ovenAddress);

      return borrowedTokens
        .plus(borrowAmount)
        .dividedBy(maxCollateral)
        .times(100);
    },
    liquidationPriceAfterBorrowing(){
      let rateDelta = 1 - this.collateralizedRateAfterBorrowing.dividedBy(100).toNumber()
      let currentPrice = this.$store.priceData.price.dividedBy(Math.pow(10, 6))

      return currentPrice.minus(currentPrice.times(rateDelta))
    }
  },
};
</script>

<style type="text/scss" lang="scss">
@import "../../assets/sass/globals";

.borrow {
}
</style>
