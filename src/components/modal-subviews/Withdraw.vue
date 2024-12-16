<template>
  <div class="withdraw">
    <div class="field is-horizontal">
      <div class="field-label is-normal">
        <label class="label">Amount:</label>
      </div>
      <div class="field-body">
        <div class="field has-addons">
          <p class="control is-expanded">
            <input
              v-on:keyup.enter="shouldAllowWithdraw && withdraw()"
              v-focus
              type="number"
              min="0"
              step="0.00000000000000001"
              v-model.number="withdrawAmount"
              class="input"
              placeholder="1.2345"
            />
          </p>
          <p class="control">
            <a class="button is-static has-text-weight-bold">ꜩ</a>
          </p>
        </div>
      </div>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>Oven Collateral: </strong>
        <strong class="price-view">
          <popover extra-classes="small-price">
            <strong
              slot="popup-content"
              class="has-text-primary heading is-marginless"
            >
              {{ numberWithCommas(ovenBalanceFormatted(ovenAddress).toFixed(6)) }} ꜩ
            </strong>

            <strong class="price-has-popover">
              {{ numberWithCommas(ovenBalanceFormatted(ovenAddress).toFixed(2)) }} ꜩ
            </strong>
          </popover>

        </strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <strong>Max Withdraw Amount:</strong>
        <strong class="price-view">
          <a @click="withdrawAmount = maxWithdrawAmount">
            {{ numberWithCommas(maxWithdrawAmount.toFixed(2)) }} ꜩ
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
                collatoralizationWarningClasses(collateralizedRateAfterWithdraw)
              "
              :value="collateralizedRateAfterWithdraw.toFixed(2)"
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
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <strong>New Collateral Utilization:</strong>
        <strong
          v-if="withdrawAmount"
          :class="
            collatoralizationWarningClasses(collateralizedRateAfterWithdraw)
          "
          class="price-view"
          >{{ collateralizedRateAfterWithdraw.toFixed(2) }}%</strong
        >
        <strong v-else class="price-view"> - </strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="control">
        <button
          @click="withdraw()"
          :disabled="!shouldAllowWithdraw"
          class="button is-primary has-text-weight-bold"
          :class="{ 'is-loading': networkLoading }"
        >
          Withdraw
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

export default {
  name: "Withdraw",
  components: {Popover},
  mixins: [Mixins],
  props: {
    ovenAddress: {
      type: String,
    },
  },
  data: function () {
    return {
      withdrawAmount: null,
      networkLoading: false,
    };
  },
  methods: {
    async withdraw() {
      try {
        this.networkLoading = true;
        let withdrawResult = await this.ovenClient(this.ovenAddress).withdraw(
          new BigNumber(this.withdrawAmount)
            .decimalPlaces(6)
            .multipliedBy(Math.pow(10, 6))
            .toFixed()
        );
        emitter.emit(
          "oven-tx-submitted",
          withdrawResult,
          this.ovenAddress,
          "withdraw"
        );
        this.$emit("close-requested");
      } catch (e) {
        this.handleWalletError(
          e,
          "Unable to withdraw",
          "There was an issue with the withdraw request."
        );
      } finally {
        this.networkLoading = false;
      }
    },
  },
  computed: {
    maxWithdrawAmount() {
      const borrowedTokens = this.outstandingTokensFormatted(this.ovenAddress); // kUSD
      const ovenValue = this.ovenDollarValue(this.ovenAddress); // USD

      let ovenValueFormatted = ovenValue
        .dividedBy(this.$store.collateralOperand)
        .minus(borrowedTokens)
        .dividedBy(this.currentPriceFormatted())
        .times(2)

      if (borrowedTokens.isGreaterThan(0)){
        ovenValueFormatted = ovenValueFormatted.times(0.999999) // FIXME Dirty hack to prevent from going under collat
      }

      return ovenValueFormatted.decimalPlaces(6);
    },
    shouldAllowWithdraw() {
      if (!this.withdrawAmount || this.withdrawAmount <= 0) {
        return false;
      }

      return this.withdrawAmount <= this.maxWithdrawAmount;
    },

    collateralizedRateAfterWithdraw() {
      let withdrawAmount = this.withdrawAmount;
      if (!withdrawAmount || withdrawAmount <= 0) {
        withdrawAmount = 0;
      }

      if (
        this.ovenBalanceFormatted(this.ovenAddress)
          .minus(withdrawAmount)
          .isNegative()
      ) {
        return new BigNumber(0);
      }

      const maxCollateralDollars = this.ovenDollarValueMinusWithdraw(
        this.ovenAddress,
        withdrawAmount
      ).dividedBy(this.$store.collateralOperand);

      const borrowedTokens = this.outstandingTokensFormatted(this.ovenAddress);

      let collatRate = borrowedTokens.dividedBy(maxCollateralDollars);

      if (!collatRate.isFinite()) {
        collatRate = new BigNumber(0);
      }

      return collatRate.times(100);
    },
  },
};
</script>

<style type="text/scss" lang="scss">
@import "../../assets/sass/globals";

.withdraw {
}
</style>
