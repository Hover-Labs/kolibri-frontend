<template>
  <div class="liquidity-pool animate__animated animate__fadeIn">
    <transition
      name="custom-classes-transition"
      enter-active-class="animate__fadeIn"
      leave-active-class="animate__fadeOut"
    >
      <div v-if="warningModalOpen" :class="{'is-active': warningModalOpen}" class="modal animate__animated animate__fast">
        <div class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Safety Warning</p>
          </header>
          <section class="modal-card-body">
            <div class="content">
              <h4 class="title">The Kolibri Liquidity Pool has <span class="has-text-danger">not</span> undergone a security review.</h4>
              <p>It has <span class="has-text-danger has-text-weight-bold">not</span> been audited by a 3rd party firm for security issues or correctness of operation, and while we've made efforts to review and test the pool, software bugs may still occur which could result in loss of funds.</p>
              <p>You can find the source code for this liquidity pool at <a target="_blank" rel="noopener" href="https://github.com/Hover-Labs/liquidation-pool"><b>Hover-Labs/Liquidation-Pool</b></a></p>
              <p><b>Use this pool at your own risk!</b></p>
            </div>
          </section>
          <footer class="modal-card-foot is-justify-content-flex-end">
            <button @click="warningModalOpen = !warningModalOpen" class="button is-primary has-text-weight-bold">Acknowledge</button>
          </footer>
        </div>
      </div>
    </transition>

    <div class="columns is-centered">
      <div class="column is-two-thirds-tablet">
        <div class="box is-paddingless">
          <div class="topper">
            <img class="pool" src="../assets/pool.svg">
            <div class="words">
              <h1 class="title has-text-white is-1">Kolibri</h1>
              <h3 class="subtitle has-text-white is-3">Liquidity Pool</h3>
              <router-link :to="{ name: 'Docs', params: { folder: 'components', page: 'liquidity-pool' } }" class="button is-outlined is-white">Learn More</router-link>
            </div>
          </div>

          <div v-if="$store.lpDisabled">
            <div class="notification is-warning warning-banner">
              <div class="block">
                <p>
                  The liquidity pool is <b>currently disabled</b> and unable to act as a primary protocol liquidator. It was disabled in <a href="https://governance.kolibri.finance/proposals/12" target="_blank" rel="noopener"><b>DAO Proposal #12</b></a> in response to a security vulnerability.
                  <br>
                  <br>
                  Liquidations through the pool won't work until the pool is reactivated via the DAO. Deposits and farming are still enabled. <a href="https://kolibri-xtz.medium.com/kolibri-liquidity-pool-exploit-postmortem-f738966c20fb" target="_blank" rel="noopener"><b>Learn More</b></a>
                </p>
              </div>
            </div>
          </div>

          <div v-if="$store.lpData !== null && poolBalance !== null">
            <nav class="level lp-stats">
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">Pool Size</p>
                  <p class="title">{{ formatNumber(poolBalance.dividedBy(Math.pow(10, 18)).toFixed(2)) }} <span class="heading is-inline-block">kUSD</span></p>
                </div>
              </div>
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">Liquidation Reward</p>
                  <p class="title">{{ $store.lpData.rewardPercent }}%</p>
                </div>
              </div>
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">LP Tokens Total</p>
                  <p class="title">{{ formatNumber($store.lpData.totalSupply.dividedBy($store.lpMantissa).toFixed(2)) }}</p>
                </div>
              </div>
            </nav>
            <div class="container has-text-centered">
              <p><strong>1 QLkUSD</strong> is currently redeemable for <strong>{{ poolBalance.dividedBy(Math.pow(10, 18)).dividedBy($store.lpData.totalSupply.dividedBy($store.lpMantissa)).toFixed(2) }} kUSD</strong> </p>
            </div>
          </div>
          <div v-else class="loader-wrapper">
            <div class="loader is-large is-primary"></div>
          </div>

          <div v-if="$store.wallet !== null" class="manage-liquidity-pool">
            <hr>
            <div class="container holdings is-justify-content-space-around is-flex">

              <div class="tags has-addons is-justify-content-flex-end is-marginless">
                <span class="tag is-medium is-marginless">kUSD Holdings</span>
                <span v-if="$store.walletBalance !== null" class="tag is-marginless is-medium is-primary">
                  <a @click="depositInput = $store.walletBalance.dividedBy(Math.pow(10, 18))" class="has-text-white">{{ numberWithCommas(walletBalanceFormatted().toFixed(2)) }} kUSD</a>
                </span>
                <span v-else class="tag is-marginless is-medium is-primary">
                  <div class="loader is-white"></div>
                </span>
              </div>

              <div class="tags has-addons is-justify-content-flex-end is-marginless">
                <span class="tag is-marginless is-medium">LP Holdings</span>
                <span v-if="$store.lpBalance !== null" class="tag is-marginless is-medium is-primary">
                  <a @click="redeemInput = $store.lpBalance.dividedBy($store.lpMantissa)" class="has-text-white">{{ numberWithCommas($store.lpBalance.dividedBy($store.lpMantissa).toFixed(2)) }} QLkUSD</a>
                </span>
                <span v-else class="tag is-marginless is-medium is-primary">
                  <div class="loader is-white"></div>
                </span>
              </div>

            </div>
          </div>

          <div v-if="$store.wallet !== null" class="management-buttons">
            <hr>
            <div>
              <div class="field is-horizontal">
                <div class="field-label is-normal">
                  <label class="label">Deposit</label>
                </div>
                <div class="field-body">
                  <div class="field has-addons">
                    <div class="control is-expanded">
                      <input v-model="depositInput" class="input" type="number" placeholder="10">
                      <div
                        @click="depositInput = $store.walletBalance.dividedBy(Math.pow(10, 18))"
                        class="max-button heading"
                      >
                        Max
                      </div>
                    </div>
                    <p class="control">
                      <a class="button is-static has-text-weight-bold">
                        kUSD
                      </a>
                    </p>
                  </div>
                  <div class="field">
                    <div class="control">
                      <button :class="{'is-loading': txPending}" @click="depositkUSD" :disabled="!depositInput || txPending" class="button is-primary has-text-weight-bold action-button">Deposit kUSD</button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="field is-horizontal">
                <div class="field-label is-normal">
                  <label class="label">Redeem</label>
                </div>
                <div class="field-body">
                  <div class="field has-addons">
                    <div class="control is-expanded">
                      <input v-model="redeemInput" class="input" type="number" placeholder="10">
                      <div
                        @click="redeemInput = $store.lpBalance.dividedBy($store.lpMantissa).decimalPlaces(36)"
                        class="max-button heading"
                      >
                        Max
                      </div>
                    </div>
                    <p class="control">
                      <a class="button is-static has-text-weight-bold">
                        QLkUSD
                      </a>
                    </p>
                  </div>
                  <div class="field">
                    <div class="control">
                      <button :class="{'is-loading': txPending}" @click="redeemLPTokens" :disabled="!redeemInput || txPending" class="button is-primary action-button has-text-weight-bold">Redeem LP Tokens</button>
                    </div>
                  </div>
                </div>
              </div>

              <p class="has-text-centered lp-value" v-if="$store.lpBalance !== null && $store.lpData !== null">
                Your <b>{{ numberWithCommas($store.lpBalance.dividedBy($store.lpMantissa).toFixed(2)) }} QLkUSD</b> is <b>~{{ $store.lpBalance.dividedBy($store.lpData.totalSupply).times(100).toFixed(2) }}%</b> of the total supply, entitling you to <b>{{ formatNumber($store.lpBalance.dividedBy($store.lpData.totalSupply).times(poolBalance).dividedBy(Math.pow(10, 18)).toFixed(2)) }} kUSD</b> if you redeem it right now.
              </p>
            </div>
          </div>
          <div class="content" v-else>
            <hr>
            <h2 class="has-text-centered">Connect your wallet</h2>
            <p class="has-text-centered">Please connect your wallet to get started!</p>
            <div class="buttons is-centered">
              <button @click="$eventBus.$emit('wallet-connect-request')" class="button is-primary has-text-weight-bold">Connect Wallet</button>
            </div>
          </div>

          <hr>

          <div class="liquidatable-ovens content">
            <h2 class="title has-text-centered">Liquidatable Ovens</h2>
            <template v-if="liquidatableOvens === null">
              <div class="loader-wrapper">
                <div class="loader is-large is-primary"></div>
              </div>
            </template>
            <template v-else>
              <div v-if="!liquidatableOvens.length">
                <div class="has-text-centered loader-wrapper">
                  <p>There are no liquidatable ovens currently!</p>
                </div>
              </div>
              <public-oven
                v-else-if="!$store.lpDisabled"
                :compact="true"
                :oven="oven"
                :key="oven.ovenAddress"
                v-for="oven in liquidatableOvens">

                <template v-slot:liquidation-button>
                  <button
                    :disabled="txPending"
                    @click="liquidateOven(oven)"
                    :class="{'is-loading': txPending}"
                    class="button is-danger is-small">
                    Liquidate
                  </button>
                </template>
              </public-oven>
              <div v-else>
                <div class="has-text-centered loader-wrapper">
                  <b>Liquidations via the pool are currently disabled.</b>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Mixins from "@/mixins";
  import BigNumber from "bignumber.js";
  import _ from "lodash";
  import PublicOven from "@/components/PublicOven";

  BigNumber.set({ DECIMAL_PLACES: 36 })

  export default {
    name: "LiquidityPool",
    components: {PublicOven},
    mixins: [Mixins],
    data() {
      return {
        warningModalOpen: false,
        depositInput: '',
        redeemInput: '',
        poolBalance: null,
        txPending: false,
        currentPage: 0,
      }
    },
    async mounted(){
      if (!this.$store.isTestnet && !this.$store.isSandbox){
        this.warningModalOpen = true
      }

      if (this.$store.lpData === null){
        const lpContract = await this.$store.tezosToolkit.wallet.at(this.$store.NETWORK_CONTRACTS.LIQUIDITY_POOL)
        this.$store.lpData = await lpContract.storage()
        this.$store.lpTokenAddress = this.$store.lpData.tokenAddress
      }

      await this.updatePoolBalance()

    },
    methods: {
      async liquidateOven(oven){
        this.txPending = true

        try {
          const lpContract = await this.$store.tezosToolkit.wallet.at(this.$store.NETWORK_CONTRACTS.LIQUIDITY_POOL)

          const sendResult = await lpContract.methods.liquidate(oven.ovenAddress).send()

          await sendResult.confirmation(1)

          this.poolBalance = null
          await this.updatePoolBalance()

          this.markOvenLiquidated(oven.ovenAddress)
        } catch(e){
          this.handleWalletError(e, 'Unable To Liquidate Oven', 'We were unable to liquidate the selected oven.')
        } finally {
          this.txPending = false
        }
      },
      markOvenLiquidated(ovenAddress){
        const ovenIndex = _.findIndex(this.$store.allOvensData, oven => oven.ovenAddress === ovenAddress)
        this.$set(this.$store.allOvensData[ovenIndex], 'isLiquidated', true)
      },
      async updatePoolBalance(){
        const kUSDContract = await this.$store.tezosToolkit.wallet.at(this.$store.lpTokenAddress)
        const kUSDStorage = await kUSDContract.storage()
        const poolBalance = await kUSDStorage.balances.get(this.$store.NETWORK_CONTRACTS.LIQUIDITY_POOL)
        if (poolBalance === undefined){
          this.poolBalance = new BigNumber(0)
        } else {
          this.poolBalance = poolBalance.balance
        }
      },
      async depositkUSD(){
        this.txPending = true

        try {
          const lpContract = await this.$store.tezosToolkit.wallet.at(this.$store.NETWORK_CONTRACTS.LIQUIDITY_POOL)
          const kUSDContract = await this.$store.tezosToolkit.wallet.at(this.$store.lpTokenAddress)

          const sendAmt = new BigNumber(this.depositInput).multipliedBy(Math.pow(10, 18))

          const sendResult = await this.$store.tezosToolkit.wallet.batch([])
            .withContractCall(kUSDContract.methods.approve(this.$store.NETWORK_CONTRACTS.LIQUIDITY_POOL, sendAmt))
            .withContractCall(lpContract.methods.deposit(sendAmt))
            .send()

          this.$eventBus.$emit('tx-submitted', sendResult)

          this.$log(sendResult)

          await sendResult.confirmation(1)

          this.$eventBus.$emit('refresh-holdings')

          this.poolBalance = null
          await this.updatePoolBalance()
        } catch(e){
          this.handleWalletError(e, 'Unable To Deposit Liquidity', 'We were unable to deposit kUSD into the LP.')
        } finally {
          this.txPending = false
          this.$eventBus.$emit('tx-finished')
          this.depositInput = null
        }
      },
      async redeemLPTokens(){
        this.txPending = true

        try {
          const lpContract = await this.$store.tezosToolkit.wallet.at(this.$store.NETWORK_CONTRACTS.LIQUIDITY_POOL)

          const redeemAmt = new BigNumber(this.redeemInput).multipliedBy(this.$store.lpMantissa)

          const sendResult = await this.$store.tezosToolkit.wallet.batch([])
            .withContractCall(lpContract.methods.redeem(redeemAmt.toFixed(0)))
            .send()

          this.$log(sendResult)

          await sendResult.confirmation(1)

          this.redeemInput = ''

          this.$eventBus.$emit('refresh-holdings')

          this.poolBalance = null
          await this.updatePoolBalance()
        } catch(e){
          this.handleWalletError(e, 'Unable To Deposit Liquidity', 'We were unable to deposit kUSD into the LP.')
        } finally {
          this.txPending = false
        }
      },
      collateralRate(oven) {
        const currentHoldings = oven.balance.dividedBy(Math.pow(10, 6))

        const currentPrice = this.currentPriceFormatted()

        const maxCollateral = currentPrice.multipliedBy(currentHoldings).dividedBy(2)

        const borrowedTokens = oven.outstandingTokens.dividedBy(Math.pow(10, 18))

        // If we have no xtz in the oven, don't try to divide by 0
        if (maxCollateral.isZero()) {
          return new BigNumber(0)
        }

        return borrowedTokens.dividedBy(maxCollateral)
      },
    },
    computed: {
      liquidatableOvens(){
        if (this.$store.allOvensData === null || this.$store.priceData === null) return null

        return _(this.$store.allOvensData)
          .filter((oven) => {
            return this.collateralRate(oven).isGreaterThanOrEqualTo(1)
          })
          .value()
      }
    }
  }
</script>

<style lang="scss" type="text/scss">
  @import '../assets/sass/globals';
  .liquidity-pool{
    padding-top: 2rem;
    padding-bottom: 2rem;
    background: $light-grey;
    min-height: 100vh;
    z-index: 31;
    position: relative;
    .button.is-static{
      min-width: 7rem;
    }
    .action-button{
      min-width: 12rem;
    }
    .liquidatable-ovens{
      padding: 0 1rem 1rem;
      .loader-wrapper{
        padding: 1rem;
      }
    }
    .management-buttons{
      padding: 0;
      @include until($desktop){
        background: blue;
      }
    }
    .manage-liquidity-pool{
      .holdings{
        & > .title{
          padding: 1rem 2rem;
        }
      }
    }
    .topper{
      display: flex;
      align-items: center;
      justify-content: center;
      background: $primary;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      .pool{
        width: 50%;
        padding: 2rem;
      }
      .words {
        width: 35%;
        padding-left: 1rem;
        color: white;
      }
    }
    .level.lp-stats{
      padding: 1rem 1rem 0;
      margin-top: .5rem;
    }
    .loader-wrapper{
      padding: 1.3rem 1.3rem 0.3rem;
      margin-top: .5rem;
    }
    .lp-value{
      padding: 1rem 3rem 0;
    }

    .control{
      &:hover{
        .max-button{
          opacity: 1;
        }
      }
      input:focus + .max-button{
        opacity: 1;
      }
    }
    .max-button{
      position: absolute;
      top: 0.75rem;
      color: $primary;
      right: .5rem;
      font-weight: bold;
      cursor: pointer;
      border-bottom: 1px solid transparent;
      z-index: 9;
      opacity: 0;
      transition: opacity 250ms linear;
      &:hover{
        border-bottom: 1px solid $primary;
      }
    }

    /* Chrome, Safari, Edge, Opera */
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    /* Firefox */
    input[type=number] {
      -moz-appearance: textfield;
    }

    .warning-banner{
      border-radius: 0;
    }

  }
</style>
