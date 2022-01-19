<template>
  <div class="savings-rate animate__animated animate__fadeIn">

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
              <h4 class="title">The Kolibri Savings Rate contract has <span class="has-text-danger">not</span> undergone a security review yet.</h4>
              <p>It has <span class="has-text-danger has-text-weight-bold">not</span> been audited by a 3rd party firm for security issues or correctness of operation, and while we've made efforts to review and test the pool, software bugs may still occur which could result in loss of funds.</p>
              <p>You can find the source code for this savings rate contract at <a target="_blank" rel="noopener" href="https://github.com/Hover-Labs/kolibri-contracts/blob/master/smart_contracts/savings-pool.py"><b>hover-labs/kolibri-contracts</b></a></p>
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
            <img class="savings-rate-logo" src="../assets/savings-rate.svg">
            <div class="words">
              <h1 class="title has-text-white is-1">Kolibri</h1>
              <h3 class="subtitle has-text-white is-3">Savings Rate</h3>
              <router-link :to="{ name: 'Docs', params: { folder: 'components', page: 'savings-rate' } }" class="button is-outlined is-white">Learn More</router-link>
            </div>
          </div>

          <div v-if="balancesUpdated === true">
            <nav class="level sr-stats">
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">Total Pool Size</p>
                  <p class="title">{{ formatNumber(lockedkUSD, 2) }} <span class="heading is-inline-block">kUSD</span></p>
                </div>
              </div>
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">Interest Rate</p>
                  <p class="title">{{ currentInterestRate }}<span class="heading is-inline-block">%</span></p>
                </div>
              </div>
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">KSR Supply</p>
                  <p class="title">{{ formatNumber(ksrTokenTotal) }} <span class="heading is-inline-block">KSR</span></p>
                </div>
              </div>
            </nav>
<!--            <nav class="level sr-stats">-->
<!--              <div class="level-item has-text-centered">-->
<!--                <div>-->
<!--                  <p class="heading">Interest Last Compounded</p>-->
<!--                  <p class="title is-4">~{{ formatMoment(savingsRateStorage.lastInterestCompoundTime) }} ago</p>-->
<!--                </div>-->
<!--              </div>-->
<!--            </nav>-->
          </div>
          <div v-else class="loader-wrapper stats-loader">
            <div class="loader is-large is-primary"></div>
          </div>

          <div v-if="$store.wallet !== null" class="manage-liquidity-pool">
            <hr>
            <div class="container holdings is-justify-content-space-around is-flex">

              <div class="tags has-addons is-justify-content-flex-end is-marginless">
                <span class="tag is-medium is-marginless">kUSD Holdings</span>
                <span v-if="$store.walletBalance !== null" class="tag is-marginless is-medium is-primary">
                  <a @click="depositInput = $store.walletBalance.dividedBy(Math.pow(10, 18)).toFixed(18)" class="has-text-white">{{ numberWithCommas(walletBalanceFormatted().toFixed(2)) }} kUSD</a>
                </span>
                <span v-else class="tag is-marginless is-medium is-primary">
                  <div class="loader is-white"></div>
                </span>
              </div>

              <div class="tags has-addons is-justify-content-flex-end is-marginless">
                <span class="tag is-marginless is-medium">KSR Holdings</span>
                <span v-if="ksrBalance !== null" class="tag is-marginless is-medium is-primary">
                  <a @click="redeemInput = ksrBalance.dividedBy($store.lpMantissa).toFixed(36)" class="has-text-white">{{ numberWithCommas(ksrBalance.dividedBy($store.lpMantissa).toFixed(2)) }} KSR</a>
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
                  <div class="field has-addons input-50">
                    <div class="control is-expanded">
                      <input v-model="depositInput" class="input" type="number" placeholder="10">
                      <div
                        v-if="$store.walletBalance !== null"
                        @click="depositInput = $store.walletBalance.dividedBy(Math.pow(10, 18)).toFixed(18)"
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
                      <button :class="{'is-loading': txPending}" @click="depositkUSD" :disabled="!depositInput || txPending" class="button action-button is-primary has-text-weight-bold">Deposit kUSD</button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="field is-horizontal">
                <div class="field-label is-normal">
                  <label class="label">Redeem</label>
                </div>
                <div class="field-body">
                  <div class="field has-addons input-50">
                    <div class="control is-expanded">
                      <input v-model="redeemInput" class="input" type="number" placeholder="10">
                      <div
                        v-if="ksrBalance !== null"
                        @click="redeemInput = ksrBalance.dividedBy($store.lpMantissa).toFixed(36)"
                        class="max-button heading"
                      >
                        Max
                      </div>
                    </div>
                    <p class="control">
                      <a class="button is-static has-text-weight-bold">
                        KSR
                      </a>
                    </p>
                  </div>
                  <div class="field">
                    <div class="control">
                      <button :class="{'is-loading': txPending}" @click="redeemKSR" :disabled="!redeemInput || txPending" class="button action-button is-primary has-text-weight-bold">Redeem KSR</button>
                    </div>
                  </div>
                </div>
              </div>

              <hr class="is-marginless">

              <p class="has-text-centered ksr-value" v-if="ksrBalance !== null">
                Your <b>{{ numberWithCommas(ksrBalance.dividedBy($store.lpMantissa).toFixed(2)) }} KSR</b> is <b>~{{ ksrBalance.dividedBy(ksrTokenTotal).dividedBy(1e36).times(100).toFixed(2) }}%</b> of the total KSR supply, entitling you to <b>{{ formatNumber( ksrBalance.times(lockedkUSD.dividedBy(ksrTokenTotal)).dividedBy(1e36), 2) }} kUSD</b> if you redeem it right now.
              </p>
              <div v-else class="loader-wrapper words-loader">
                <div class="loader is-large is-primary"></div>
              </div>

              <hr class="is-marginless">

              <div class="recent-transactions" v-if="recentTransactions !== null">

                <div class="has-text-centered large-padding" v-if="recentTransactions === false">
                  <p>Sandbox doesn't have a tzkt.io indexer to use!</p>
                </div>
                <div v-else>
                  <recent-activity-entry :now="now" :tx="tx" :key="tx.id" v-for="tx in recentTransactions" />
                  <div class="has-text-centered large-padding" v-if="recentTransactions.length === 0">
                    <p>No recent transactions...yet!</p>
                  </div>
                </div>

              </div>
              <div v-else class="loader-wrapper large-padding">
                <div class="loader is-large is-primary"></div>
              </div>

            </div>
          </div>
          <div class="content wallet-connect" v-else>
            <hr>
            <h2 class="has-text-centered">Connect your wallet</h2>
            <p class="has-text-centered">Please connect your wallet to get started!</p>
            <div class="buttons is-centered">
              <button @click="$eventBus.$emit('wallet-connect-request')" class="button is-primary has-text-weight-bold">Connect Wallet</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Mixins from "@/mixins"
  import BigNumber from "bignumber.js"
  import moment from 'moment'
  import axios from "axios";
  import RecentActivityEntry from "@/components/RecentActivityEntry";

  BigNumber.set({ DECIMAL_PLACES: 36 })

  export default {
    name: "SavingsRate",
    components: {RecentActivityEntry},
    mixins: [Mixins],
    data() {
      return {
        savingsRateStorage: null,
        savingsRateContract: null,
        ksrBalance: null,
        depositInput: '',
        redeemInput: '',
        now: moment(),
        txPending: false,
        spClient: null,
        lockedkUSD: null,
        currentInterestRate: null,
        ksrTokenTotal: null,
        recentTransactions: null,

        warningModalOpen: false,
        learnMoreModalOpen: false,

        balancesUpdated: false,
      }
    },
    async mounted(){
      if (!this.$store.isTestnet && !this.$store.isSandbox){
        this.warningModalOpen = true
      }

      // TODO: get from kolibri-js
      this.savingsRateContract = await this.$store.tezosToolkit.wallet.at(this.$store.NETWORK_CONTRACTS.SAVINGS_POOL)
      this.savingsRateStorage = await this.savingsRateContract.storage()

      // TODO: get address from kolibri-js
      this.spClient = this.$store.getSavingsPoolClient(this.$store.wallet, this.$store.NETWORK_CONTRACTS.SAVINGS_POOL)
      await this.updateTotals()

      setInterval(() => {
        this.now = moment()
      }, 1000)

      if (this.$store.walletPKH === null){
        this.$eventBus.$on('wallet-connected', this.updateTotals)
      }

      setInterval(async () => {
        this.lockedkUSD = (await this.spClient.getPoolSize(this.savingsRateStorage)).dividedBy(new BigNumber(10).pow(18))
      }, 5000)

    },
    methods: {
      async updateTotals(){
        this.balancesUpdated = false

        this.savingsRateStorage = await this.savingsRateContract.storage()

        this.currentInterestRate = null
        this.ksrTokenTotal = null
        this.ksrBalance = null
        this.recentTransactions = null

        this.currentInterestRate = (await this.spClient.getInterestRateAPY(this.savingsRateStorage)).toFixed(2)
        this.ksrTokenTotal = (await this.spClient.getLPTokenTotal(this.savingsRateStorage)).dividedBy(new BigNumber(10).pow(36))
        this.lockedkUSD = (await this.spClient.getPoolSize(this.savingsRateStorage)).dividedBy(new BigNumber(10).pow(18))
        await this.updateKSRBalance()

        if (this.tzktAPILink() !== null){
          // https://api.granadanet.tzkt.io/#operation/Operations_GetTransactions
          this.recentTransactions = (await axios.get(`${this.tzktAPILink()}/v1/operations/transactions`, {params: {
              sender: this.$store.walletPKH,
              target: this.$store.NETWORK_CONTRACTS.SAVINGS_POOL,
              status: 'applied',
              limit: 10,
              'sort.desc': 'id',
              'entrypoint.in': 'deposit,redeem',
            }}
          )).data
        } else {
          this.recentTransactions = false
        }

        this.balancesUpdated = true
      },
      async updateKSRBalance(){
        if (this.$store.walletPKH === null){
          return
        }
        let balance = await this.savingsRateStorage.balances.get(this.$store.walletPKH)

        if (balance === undefined){
          balance = new BigNumber(0)
        } else {
          balance = balance.balance
        }

        this.ksrBalance = balance
      },
      async depositkUSD(){
        this.txPending = true

        try {
          const kUSDContract = await this.$store.tezosToolkit.wallet.at(this.$store.NETWORK_CONTRACTS.TOKEN)

          const sendAmt = new BigNumber(this.depositInput).multipliedBy(Math.pow(10, 18))

          const sendResult = await this.$store.tezosToolkit.wallet.batch([])
            .withContractCall(kUSDContract.methods.approve(this.spClient.savingsPoolAddress, sendAmt))
            .withContractCall(await this.spClient.makeDepositTransaction(sendAmt, this.savingsRateContract))
            .send()

          this.$eventBus.$emit('tx-submitted', sendResult)

          this.$log(sendResult)

          await sendResult.confirmation(1)

          this.$eventBus.$emit('refresh-holdings')
          await this.updateTotals()
        } catch(e){
          this.handleWalletError(e, 'Unable To Deposit Liquidity', 'We were unable to deposit kUSD into the LP.')
        } finally {
          this.txPending = false
          this.$eventBus.$emit('tx-finished')
          this.depositInput = null
        }
      },
      async redeemKSR(){
        this.txPending = true

        try {
          const redeemAmt = new BigNumber(this.redeemInput).multipliedBy(this.$store.lpMantissa)

          const sendResult = await this.spClient.redeem(redeemAmt, this.savingsRateContract)

          this.$eventBus.$emit('tx-submitted', sendResult)

          this.$log(sendResult)

          await sendResult.confirmation(1)

          this.$eventBus.$emit('refresh-holdings')
          await this.updateTotals()
        } catch(e){
          this.handleWalletError(e, 'Unable To Redeem KSR', 'We were unable to redeem KSR for kUSD.')
        } finally {
          this.txPending = false
          this.$eventBus.$emit('tx-finished')
          this.redeemInput = null
        }
      },
    },
    computed: {

    }
  }
</script>

<style lang="scss" type="text/scss">
  @import '../assets/sass/globals';
  .savings-rate{
    padding-top: 2rem;
    padding-bottom: 2rem;
    background: $light-grey;
    min-height: 100vh;
    z-index: 31;
    position: relative;
    .timestamp-title{
      display: flex;
      align-items: center;
    }
    .recent-transactions{
      padding: 1rem;
    }
    .loader-wrapper.large-padding, .has-text-centered.large-padding{
      padding: 5rem 1rem;
    }
    .button.is-static{
      min-width: 5rem;
    }
    .action-button{
      min-width: 9rem;
    }
    .input-50{
      width: 50%;
    }
    .sr-stats{
      padding: 1rem 1rem 0;
      margin-top: .5rem;
    }
    .wallet-connect{
      padding-bottom: 2.5rem;
    }
    .topper{
      display: flex;
      align-items: center;
      justify-content: space-evenly;
      background: $primary;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      .savings-rate-logo{
        width: 50%;
        padding: 2rem;
        //max-width: 25vw;
        max-height: 24rem;
      }
      .words {
        width: 35%;
        padding-left: 1rem;
        color: white;
      }
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

    .ksr-value{
      padding: 1.5rem;
    }
    .words-loader{
      padding: 1.65rem 1rem;
    }
    .stats-loader{
      padding: 4.5rem;
    }

    .management-buttons{
      @include until($tablet){
        > div > div.field{
          padding: 1rem 2rem;
          .input-50{
            width: 100%;
          }
        }
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
  }
</style>
