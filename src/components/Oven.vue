<template>
  <div class="box oven mb-5">
    <div class="top">
      <nav class="level is-mobile">
        <!-- Left side -->
        <div class="level-left">
          <div class="level-item">
            <h1
                @mouseover="showTooltip = true"
                @mouseleave="showTooltip = false"
                class="title is-5 oven-name"
                v-if="!editingName"
            >
              <a
                target="_blank"
                rel="noopener"
                :href="tzktLinkContract(ovenAddress)"
              >
                {{ ovenName }}
              </a>
              <span v-if="showTooltip" class="edit-button animate__fadeIn animate__animated">
                <a
                    @mouseover="toggleIcon = true"
                    @mouseleave="toggleIcon = false"
                    @click="editingName = true">
                  <img v-if="toggleIcon" src="../assets/icon-edit-green.svg" />
                  <img v-else src="../assets/icon-edit-grey.svg" />
                </a>
              </span>

            </h1>
            <div v-else class="field is-grouped oven-name-edit">
              <p class="control is-expanded">
                <input autofocus class="input" type="text" placeholder="Your Awesome Oven 🙌" v-model="editInput">
              </p>
              <div class="control">
                <div class="buttons">
                  <button @click="saveOvenName" class="button is-primary">
                    <span v-if="editInput">
                      Save
                    </span>
                    <span v-else>
                      Clear
                    </span>
                  </button>
                  <a @click="editingName = false" class="button">
                    Cancel
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Right side -->
        <div class="level-right">
          <p class="level-item">
            <button
              :disabled="
                isLiquidated ||
                pendingTransaction ||
                updatingData ||
                !(ovenData && parseInt(ovenData.balance) !== 0)
              "
              @click="$emit('modal-open-requested', 'Borrow', ovenAddress)"
              class="button is-small is-primary has-text-weight-bold"
            >
              Borrow kUSD
            </button>
          </p>
          <p class="level-item">
            <button
              :disabled="
                isLiquidated ||
                pendingTransaction ||
                updatingData ||
                !(ovenData && parseInt(ovenData.outstandingTokens) !== 0)
              "
              @click="$emit('modal-open-requested', 'Repay', ovenAddress)"
              class="button is-small is-primary has-text-weight-bold"
            >
              Pay Back kUSD
            </button>
          </p>
          <p class="level-item">
            <button
              :disabled="
                isLiquidated ||
                pendingTransaction ||
                updatingData ||
                !(ovenData && parseInt(ovenData.balance) !== 0)
              "
              @click="$emit('modal-open-requested', 'Withdraw', ovenAddress)"
              class="button is-small is-primary has-text-weight-bold"
            >
              Withdraw ꜩ
            </button>
          </p>
          <p class="level-item">
            <button
              :disabled="
                isLiquidated || pendingTransaction || updatingData || !ovenData
              "
              @click="$emit('modal-open-requested', 'Deposit', ovenAddress)"
              class="button is-small is-primary has-text-weight-bold"
            >
              Deposit ꜩ
            </button>
          </p>
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
          >Transaction Pending...</a
        >
        <span v-else>Transaction Pending...</span>
      </h1>
      <div class="loader left-spaced"></div>
    </div>
    <div v-else-if="ovenData !== null && !updatingData" class="oven-info">
      <div v-if="isLiquidated" class="liquidated-warning">
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
      <div class="columns is-gapless">
        <div
          class="column is-flex is-flex-direction-column is-align-items-center is-justify-content-center"
        >
          <div
            class="is-flex is-flex-direction-column is-justify-content-center left-info"
          >
            <p class="heading">
              Delegated Baker:
              <strong v-if="ovenData.baker">
                <a
                  class="address"
                  @click="$emit('show-delegate-modal', ovenAddress)"
                  >
                    {{ ovenData.baker }}
                </a>
              </strong>

              <popover v-else>
                <strong slot="popup-title" class="has-text-danger">⚠️ Warning</strong>

                <strong slot="popup-content">
                  This oven is currently <i>not</i> delegated to any baker,
                  and is not
                  <br />
                  receiving staking rewards. Please
                  <a @click="$emit('show-delegate-modal', ovenAddress)"
                    >click here</a
                  >
                  to delegate to a baker.
                </strong>

                <strong class="has-text-danger">
                  <a @click="$emit('show-delegate-modal', ovenAddress)"
                    >⚠️ Set a baker</a
                  >
                </strong>
              </popover>
            </p>
            <p class="heading">
              Collateral Utilization:
              <strong v-if="collatoralizedRate(ovenData) < 80"
                >{{ collatoralizedRate(ovenData) }}%</strong
              >
              <strong
                v-else-if="collatoralizedRate(ovenData) < 100"
                class="has-text-warning"
                >{{ collatoralizedRate(ovenData) }}%</strong
              >
              <strong v-else class="has-text-danger"
                >{{ collatoralizedRate(ovenData) }}%</strong
              >

              <span v-if="!outstandingTokens(ovenAddress).isZero()">
                | Liquidatable when XTZ =

                <popover extra-classes="small-price">
                  <strong
                      slot="popup-content"
                      class="has-text-primary heading is-marginless"
                  >
                    ${{ liquidatablePrice(ovenAddress).toFixed(6) }}
                  </strong>
                  <strong class="price-has-popover">${{ liquidatablePrice(ovenAddress).toFixed(2) }}</strong>
                </popover>
              </span>
            </p>

            <div class="allocation-info is-fullwidth">
              <progress
                v-if="collatoralizedRate(ovenData) < 80"
                class="progress is-primary"
                :value="collatoralizedRate(ovenData)"
                max="100"
              >
                {{ collatoralizedRate(ovenData) }}%
              </progress>
              <progress
                v-else-if="collatoralizedRate(ovenData) < 100"
                class="progress is-warning"
                :value="collatoralizedRate(ovenData)"
                max="100"
              >
                {{ collatoralizedRate(ovenData) }}%
              </progress>
              <progress
                v-else
                class="progress is-danger"
                :value="collatoralizedRate(ovenData)"
                max="100"
              >
                {{ collatoralizedRate(ovenData) }}%
              </progress>
            </div>
          </div>
        </div>
        <div class="column">
          <nav class="level right-info is-mobile">
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
                    ${{ numberWithCommas(ovenValue(ovenData.balance)) }} USD
                  </strong>

                  <strong class="price-has-popover"
                    >${{
                      numberWithCommas(ovenValue(ovenData.balance).toFixed(2))
                    }}
                    USD</strong
                  >
                </popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div
                class="is-flex is-flex-direction-column is-align-items-center"
              >
                <p class="heading">Balance</p>
                <popover extra-classes="small-price">
                  <strong
                    slot="popup-content"
                    class="has-text-primary heading is-marginless"
                  >
                    {{numberWithCommas(ovenData.balance.dividedBy(Math.pow(10, 6)).toFixed(6)) }} ꜩ
                  </strong>

                  <strong class="price-has-popover">
                    {{ numberWithCommas(ovenData.balance.dividedBy(Math.pow(10, 6)).toFixed(2)) }} ꜩ
                  </strong>
                </popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div
                class="is-flex is-flex-direction-column is-align-items-center"
              >
                <p class="heading">Loan Amt</p>
                <popover extra-classes="small-price">
                  <strong
                    slot="popup-content"
                    class="has-text-primary heading is-marginless"
                  >
                    {{
                      numberWithCommas(
                        ovenData.outstandingTokens.dividedBy(Math.pow(10, 18)).toFixed(12)
                      )
                    }}
                    kUSD
                  </strong>

                  <strong class="price-has-popover"
                    >{{
                      numberWithCommas(
                        ovenData.outstandingTokens
                          .dividedBy(Math.pow(10, 18))
                          .toFixed(2)
                      )
                    }}
                    kUSD</strong
                  >
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
                        ovenData.stabilityFee
                          .dividedBy(Math.pow(10, 18))
                          .toFixed(12)
                      )
                    }}
                    kUSD
                  </strong>

                  <strong class="price-has-popover"
                    >{{
                      numberWithCommas(
                        ovenData.stabilityFee
                          .dividedBy(Math.pow(10, 18))
                          .toFixed(6)
                      )
                    }}
                    kUSD</strong
                  >
                </popover>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
    <div v-else class="loader-wrapper">
      <h1 class="title is-marginless is-5">Loading Oven Data...</h1>
      <div class="loader left-spaced"></div>
    </div>
  </div>
</template>

<script>
import { reactive } from 'vue';
import _ from "lodash";
import Mixins from "@/mixins";
import Popover from "@/components/Popover.vue";
import emitter from "@/bus";

export default {
  name: "Oven",
  props: ["ovenAddress"],
  mixins: [Mixins],
  destroyed() {
    clearInterval(this.interval)
  },
  async created() {
    await this.updateOvenData();

    this.interval = setInterval(async () => {
      await this.updateOvenData()
    }, 60 * 1000)

    emitter.on("oven-tx-submitted", (txResult, ovenAddress, verb) => {
      if (this.ovenAddress === ovenAddress) {
        this.waitForTxAndRefresh(txResult, verb);
      }
    });
  },
  methods: {
    saveOvenName(){
      this.$set(this.$store.ovenNames, this.ovenAddress, this.editInput)
      window.localStorage.setItem('oven-names', JSON.stringify(this.$store.ovenNames))
      this.editingName = false
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
        .dividedBy(Math.pow(10, 6))
        .multipliedBy(ovenBalance.dividedBy(Math.pow(10, 6)));

      let valueHalf = currentValue.dividedBy(this.$store.collateralOperand);

      let borrowedTokens = this.ovenData.outstandingTokens.dividedBy(
        Math.pow(10, 18)
      );

      return valueHalf.minus(borrowedTokens).decimalPlaces(18);
    },
    collatoralizedRate(oven) {
      return this.collatoralizedRateForOven(oven)
    },
    async updateOvenData() {
      const keys = [
        "baker",
        "balance",
        "borrowedTokens",
        "stabilityFee",
        "isLiquidated",
      ];

      let stabFeeDate;
      if (this.$store.isSandbox){
        stabFeeDate = this.calculateSandboxStabFeeTime()
      } else {
        stabFeeDate = new Date()
      }

      const values = await Promise.all([
        this.ovenClient(this.ovenAddress).getBaker(),
        this.ovenClient(this.ovenAddress).getBalance(),
        this.ovenClient(this.ovenAddress).getBorrowedTokens(),
        this.ovenClient(this.ovenAddress).getStabilityFees(stabFeeDate),
        this.ovenClient(this.ovenAddress).isLiquidated(),
      ]);

      let ovenData = _.zipObject(keys, values)

      // Just calculate this ourselves and save a few requests
      ovenData.outstandingTokens = ovenData.borrowedTokens.plus(ovenData.stabilityFee)

      this.$store.ownedOvens[this.ovenAddress] = ovenData;
    },
    async waitForTxAndRefresh(txResult, verb) {
      try {
        this.pendingTransaction = txResult.opHash;
        await txResult.confirmation(1);
        this.updatingData = true;
        this.pendingTransaction = false;
        this.$log("Deposit Finished! Refreshing data", txResult);
        await this.updateOvenData();

        this.$store.walletBalance = await this.$store.tokenClient.getBalance(this.$store.walletPKH);

        this.updatingData = false;
      } catch (err) {
        this.handleWalletError(
          err,
          `Unable to ${verb}`,
          `We were unable to fulfil your ${verb} request.`
        );
      } finally {
        this.pendingTransaction = false;
      }
    },
  },
  data() {
    return {
      pendingTransaction: false,
      updatingData: false,
      interval: null,
      showTooltip: false,
      editingName: false,
      toggleIcon: false,
      editInput: this.$store.ovenNames[this.ovenAddress],
    };
  },
  computed: {
    ovenData() {
      return this.$store.ownedOvens[this.ovenAddress];
    },
    isLiquidated() {
      return this.ovenData && this.ovenData.isLiquidated;
    },
    ovenName(){
      const ovenName = this.$store.ovenNames[this.ovenAddress]
      if (ovenName){
        return ovenName + ` (${this.truncateChars(this.ovenAddress, 18)})`
      } else {
        return this.ovenAddress
      }
    },
  },
  components: {
    Popover,
  },
};
</script>

<style type="text/scss" lang="scss">
@import "../assets/sass/globals";

.oven {
  padding: 0;
  width: 100%;
  .oven-name-edit{
    max-height: 1rem;
    margin-top: -1.5rem;
    .input{
      width: 18rem;
    }
  }
  .oven-name{
    cursor: pointer;
    .edit-button{
      img{
        max-width: 1rem;
        margin: 0.2rem;
        transition: transform 500ms ease;
        &:hover{
          transform: scale(1.125);
        }
      }
    }
  }
  .address {
    text-transform: initial;
  }
  .oven-info {
    position: relative;
    &> .buttons{
      margin-bottom: 2rem;
    }
    .columns {
      @include until($widescreen) {
        flex-direction: column;
      }
    }
    .liquidated-warning {
      display: flex;
      position: absolute;
      width: 100%;
      height: 100%;
      align-items: center;
      justify-content: center;
      background: #000000cf;
      color: white;
      a:hover {
        color: lighten($primary, 20%);
      }
    }
  }
  .loader-wrapper {
    padding: 1.75rem;
  }
  .popper.small-price {
    padding: 0.5rem;
    font-weight: bold;
  }
  .price-has-popover {
    cursor: pointer;
    border-bottom: 1px solid $primary;
  }
  .pending-tx {
    .heading {
      margin-right: 0.5rem;
      margin-bottom: 0;
    }
  }
  .top {
    padding: 1rem;
    border-bottom: 2px solid $light-grey;

    .popper {
      padding: 0.5rem;
    }
    .level {
      @include until($widescreen) {
        flex-direction: column;
        .level-left {
          margin-bottom: 0.75rem;
        }
      }
    }
  }
  .right-info {
    margin: 1rem 0;
    @include until($desktop) {
      padding-bottom: 1rem;
    }
    &.compact{
      margin-top: 0;
    }
  }
  .left-info {
    width: 100%;
    padding: 0.75rem 1.5rem;
    progress {
      height: 0.75rem;
    }
  }
  .tx-hash {
    font-size: 0.5rem;
  }
}
</style>
