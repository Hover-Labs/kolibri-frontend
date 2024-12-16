<template>
  <transition
      enter-active-class="animate__animated animate__fadeIn fast"
      leave-active-class="animate__animated animate__fadeOut fast"
  >
    <div class="box farm mb-5">

      <div v-if="farmContractData !== null">
        <nav class="level is-marginless">
          <div class="level-left">
            <div class="level-item">

              <h1 class="title">
                  <a class="has-text-white">{{ pairName }} Farm <template v-if="['kUSD', 'QLkUSD', 'kUSD/uUSD Flat Curve LP', 'kUSD/XTZ Quipuswap LP'].includes(pairName)">(inactive)</template> </a>
              </h1>
              <popover>
                <p slot="popup-content" v-html="decimalsMap[pairName].description"></p>
              </popover>

              <a target="_blank" rel="noopener"
                 :href="bcdLink(contract)"
                 class="contract-src"><img src="../assets/contract.svg"></a>
            </div>
          </div>

          <div class="level-right"></div>
        </nav>

        <div v-if="$store.walletPKH !== null" class="field is-grouped is-grouped-multiline">
          <div class="control">
            <div class="tags has-addons">
              <span class="tag is-info">{{ pairName }} Holdings</span>
              <span v-if="holdingsData" class="tag is-light">{{ holdingsData.balance.dividedBy(decimalsMap[pairName].mantissa).toFixed(2) }} {{ pairName }}</span>
              <span v-else class="tag is-light"><div class="loader"></div></span>
            </div>
          </div>
        </div>

        <nav class="level is-marginless">
          <div class="level-left">
            <div class="level-item">
              <p class="has-text-white has-text-weight-bold">Total Deposited</p>
            </div>
          </div>

          <div class="level-right">
            <p class="has-text-white has-text-weight-bold">{{ numberWithCommas(farmContractData.farmLpTokenBalance.dividedBy(decimalsMap[pairName].mantissa).toFixed(2)) }} {{ pairName }}</p>
          </div>
        </nav>
        <nav class="level is-marginless">
          <div class="level-left">
            <div class="level-item">
              <p class="has-text-white has-text-weight-bold">Pool Rate</p>
            </div>
          </div>

          <div class="level-right">
            <p class="has-text-white has-text-weight-bold">0 kDAO / Week</p>
<!--            <p class="has-text-white has-text-weight-bold">{{ numberWithCommas(poolRatePerWeek.toFixed(2)) }} kDAO / Week</p>-->
          </div>
        </nav>

        <nav class="level is-marginless">
          <div class="level-left">
            <div class="level-item">
              <p class="has-text-white has-text-weight-bold">Current Reward</p>
            </div>
          </div>

          <div v-if="!currentRewardPerWeek.isZero() && false" class="level-right">
            <span>
              <strong class="has-text-white">
                1 kDAO / Week Per
              </strong>
            </span>
            <popover class="padded-left" extra-classes="small-price">
              <strong
                slot="popup-content"
                class="is-marginless"
              >
                {{ numberWithCommas(currentRatePerTokenPerWeek.toFixed(10)) }} {{ pairName }}
              </strong>
                <a>
                  <strong class="has-text-white is-underlined">{{ numberWithCommas(currentRatePerTokenPerWeek.toFixed(2)) }}</strong>
                </a>
            </popover>

            <p class="has-text-white has-text-weight-bold padded-left">{{ pairName }}</p>
          </div>
          <div v-else class="level-right">
            <span>
              <strong class="has-text-white">
                0 kDAO / Week ({{ pairName }} farm is inactive)
              </strong>
            </span>
          </div>
        </nav>

        <div v-if="$store.walletPKH !== null">
          <hr>

          <div v-if="depositedTokens !== null">
            <nav class="level is-marginless">
              <div class="level-left">
                <div class="level-item">
                  <p class="has-text-white has-text-weight-bold">Your Deposits</p>
                </div>
              </div>

              <div class="level-right">
                <p v-if="depositedTokens !== undefined && !this.depositedTokens.lpTokenBalance.isZero()" class="has-text-white has-text-weight-bold">{{ numberWithCommas(depositedTokens.lpTokenBalance.dividedBy(decimalsMap[pairName].mantissa).toFixed(2)) }} {{ pairName }}</p>
                <p v-else class="has-text-white has-text-weight-bold">0.00 {{ pairName }}</p>
              </div>
            </nav>
            <nav class="level is-marginless">
              <div class="level-left">
                <div class="level-item">
                  <p class="has-text-white has-text-weight-bold">Pool %</p>
                </div>
              </div>

              <div class="level-right">
                <p v-if="depositedTokens !== undefined && !this.depositedTokens.lpTokenBalance.isZero()" class="has-text-white has-text-weight-bold">{{ currentPoolPercentage.times(100).toFixed(2) }}%</p>
                <p v-else class="has-text-white has-text-weight-bold">0%</p>
              </div>
            </nav>
            <nav class="level is-marginless">
              <div class="level-left">
                <div class="level-item">
                  <p class="has-text-white has-text-weight-bold">Your Reward Rate</p>
                </div>
              </div>

              <div class="level-right">
                <div class="is-flex" v-if="depositedTokens !== undefined && !this.depositedTokens.lpTokenBalance.isZero()">
                  <popover extra-classes="small-price">
                    <strong
                      slot="popup-content"
                      class="is-marginless"
                    >
                      {{ numberWithCommas(currentDripRate.toFixed(10)) }} kDAO / Week
                    </strong>
                    <a>
                      <strong class="has-text-white is-underlined">{{ numberWithCommas(currentDripRate.toFixed(2)) }}</strong>
                    </a>
                  </popover>

                  <p class="has-text-white has-text-weight-bold padded-left">kDAO / Week</p>
                </div>
                <p v-else class="has-text-white has-text-weight-bold">0.00 kDAO / Week</p>
              </div>
            </nav>
            <nav class="level is-marginless">
              <div class="level-left">
                <div class="level-item">
                  <p class="has-text-white has-text-weight-bold">
                    Claimable Rewards
                    <popover extra-classes="small-price">
                      <strong
                        slot="popup-content"
                        class="is-marginless"
                      >
                        Due to the way reward calculations are determined,<br>
                        your claimed amount might be included in a different <br>
                        block than was expected/displayed here, so you may <br>
                        receive a *slightly* different amount than this.
                      </strong>
                      <span>(<a>
                        <strong class="has-text-white is-underlined">est</strong>
                      </a>)</span>
                    </popover>
                  </p>
                </div>
              </div>

              <div class="level-right">
                <p class="has-text-white has-text-weight-bold">
                  <popover extra-classes="small-price">
                    <strong
                      slot="popup-content"
                      class="is-marginless"
                    >
                      {{ numberWithCommas(estimatedRewards.dividedBy(this.decimalsMap.kDAO.mantissa).toFixed(10)) }} kDAO
                    </strong>
                    <a>
                      <strong class="has-text-white is-underlined">{{ numberWithCommas(estimatedRewards.dividedBy(this.decimalsMap.kDAO.mantissa).toFixed(2)) }}</strong>
                    </a>
                  </popover>
                </p>
                <p class="has-text-white has-text-weight-bold padded-left">kDAO</p>
              </div>
            </nav>
<br>

            <div v-if="!['kUSD', 'QLkUSD', 'kUSD/uUSD Flat Curve LP', 'kUSD/XTZ Quipuswap LP'].includes(pairName)" class="columns is-centered">
              <div class="column">
                <div class="field has-addons has-addons-centered">
                  <div class="control">
                    <input v-model="depositInput" class="input" type="number" placeholder="1.234">
                    <div
                      @click="depositInput = holdingsData.balance.dividedBy(decimalsMap[pairName].mantissa).toFixed(36)"
                      class="max-button heading"
                    >
                      Max
                    </div>
                  </div>
                  <div class="control">
                    <button
                      @click="depositTokens"
                      :class="{'is-loading': networkSending || globalSending}"
                      :disabled="this.networkSending || globalSending || Math.sign(depositInput) < 1"
                      class="button is-info"
                    >
                      Deposit {{ pairName }}
                    </button>
                  </div>
                </div>
              </div>
              <div class="column">
                <div class="field has-addons has-addons-centered">
                  <div class="control">
                    <input v-model="withdrawInput" class="input" type="number" placeholder="1.234">
                    <div
                      @click="withdrawInput = depositedTokens ? depositedTokens.lpTokenBalance.dividedBy(decimalsMap[pairName].mantissa) : 0"
                      class="max-button heading"
                    >
                      Max
                    </div>
                  </div>
                  <div class="control">
                    <button
                      @click="withdrawTokens"
                      :class="{'is-loading': networkSending || globalSending}"
                      :disabled="withdrawShouldBeDisabled"
                      class="button is-info"
                    >
                      Withdraw {{ pairName }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="is-flex is-flex-direction-column has-text-centered" v-else>
              <hr class="mt-2">
              <p v-if="pairName !== 'kUSD/XTZ Quipuswap LP'" class="has-text-weight-bold">The {{ pairName }} farm has ended as part of <a class="has-text-white is-underlined	" style="border-bottom: 1px solid white;"  rel="noopener" target="_blank" href="https://governance.kolibri.finance/proposals/31">Kolibri Proposal #31</a>. Please remove your liquidity using the button below.</p>
              <p v-else>LP farms have moved to Quipuswap!</p>
              <div class="pt-4">
                <button
                  @click="withdrawLiquidity"
                  :class="{'is-loading': networkSending || globalSending}"
                  :disabled="this.networkSending || globalSending || depositedTokens === undefined || this.depositedTokens.lpTokenBalance.isZero()"
                  class="button is-info is-medium"
                >
                  Withdraw all {{ pairName }} liquidity
                </button>
              </div>
            </div>

            <div v-if="!['kUSD', 'QLkUSD', 'kUSD/uUSD Flat Curve LP', 'kUSD/XTZ Quipuswap LP'].includes(pairName)" class="buttons is-right">
              <button
                :disabled="networkSending || globalSending || estimatedRewards.isZero()"
                :class="{'is-loading': networkSending || globalSending}"
                @click="claim"
                class="button is-info"
              >
                Claim {{ numberWithCommas(estimatedRewards.dividedBy(this.decimalsMap.kDAO.mantissa).toFixed(2)) }} kDAO
              </button>
            </div>

          </div>
          <div v-else class="loader-wrapper">
            <div class="loader is-large is-white"></div>
          </div>
        </div>
      </div>
      <div v-else class="loader-wrapper">
        <div class="loader is-large is-white"></div>
      </div>
    </div>
  </transition>
</template>

<script>
import Mixins from "@/mixins";
import BigNumber from "bignumber.js";
import Popover from "@/components/Popover.vue";
import {Network} from "@hover-labs/kolibri-js";
import emitter from "@/bus";

BigNumber.set({ DECIMAL_PLACES: 36 })

export default {
  name: 'Farm',
  props: ['pairName', 'contract', 'globalSending'],
  mixins: [Mixins],
  async mounted(){
    this.$nextTick(this.initialize)

    // Refresh farms on request
    emitter.on('refresh-farms', () => {
      this.$log("Refreshing farms!")
      Object.assign(this.$data, this.$options.data.apply(this))
      this.$log("Done refreshing farms")
      this.$nextTick(this.initialize)
    })
  },
  methods: {
    async initialize(){
      this.$log("Farm.initialize called!")
      const farmContract = await this.$store.tezosToolkit.wallet.at(this.contract)
      this.farmContractData = await farmContract.storage()

      const tokenContract = await this.$store.tezosToolkit.wallet.at(this.farmContractData.addresses.lpTokenContract)
      this.tokenContractData = await tokenContract.storage()

      if (this.$store.walletPKH !== null){
        await this.updateTokenBalance()
      } else {
        emitter.on('wallet-connected', this.updateTokenBalance)
      }

      this.$emit('initialized', {contractAddress: this.contract, contract: farmContract, claimable: this.estimatedRewards})
    },
    async updateTokenBalance(){
      const balanceMap = this.decimalsMap[this.pairName].balances()

      const holdingsData = await balanceMap.get(this.$store.walletPKH)

      if (holdingsData === undefined){
        this.holdingsData = {balance: new BigNumber(0)}
      // kUSD, QLkUSD and the Quipuswap LP return an object, where `balances` is set.
      // Youves does not return an object and only returns a balance.
      // TODO(keefertaylor): Generalize this code to make it less brittle.
      } else if (holdingsData.balance !== undefined) {
        // Assign holdings data directly. This code path executes for kUSD, QLkUSD and the Quipuswap LP
        this.holdingsData = holdingsData
      } else {
        // Assign holdingsData as an object. This code path executes for Youves LP
        this.holdingsData = { balance: holdingsData}
      }
      this.depositedTokens = await this.farmContractData.delegators.get(this.$store.walletPKH)
    },
    async claim(){
      this.networkSending = true
      try {
        const farmContract = await this.$store.tezosToolkit.wallet.at(this.contract)

        const sendResult = await farmContract.methods.claim(null).send()

        emitter.emit('tx-submitted', sendResult)

        await sendResult.confirmation(1)

        this.holdingsData = null

        emitter.emit('refresh-kdao-holdings')
        await this.initialize()
      } catch (e) {
        console.error(e)
      } finally {
        this.networkSending = false
        emitter.emit('tx-finished')
      }
    },
    async withdrawLiquidity(){
      this.networkSending = true
      try {
        const farmContract = await this.$store.tezosToolkit.wallet.at(this.contract)

        const sendResult = await farmContract.methods.escape().send()

        emitter.emit('tx-submitted', sendResult)

        await sendResult.confirmation(1)

        this.holdingsData = null
        await this.initialize()
      } catch (e) {
        console.error(e)
      } finally {
        this.networkSending = false
        emitter.emit('tx-finished')
      }
    },
    async depositTokens(){
      this.networkSending = true
      try {
        const farmContract = await this.$store.tezosToolkit.wallet.at(this.contract)
        const tokenContract = await this.$store.tezosToolkit.wallet.at(this.farmContractData.addresses.lpTokenContract)
        const sendAmt = new BigNumber(this.depositInput).times(this.decimalsMap[this.pairName].mantissa)

        const sendResult = await this.$store.tezosToolkit.wallet.batch([])
          .withContractCall(tokenContract.methods.approve(this.contract, sendAmt))
          .withContractCall(farmContract.methods.deposit(sendAmt))
          .send()

        emitter.emit('tx-submitted', sendResult)

        await sendResult.confirmation(1)

        this.holdingsData = null
        await this.initialize()
      } catch (e) {
        console.error(e)
      } finally {
        this.networkSending = false
        emitter.emit('tx-finished')
        this.depositInput = null
      }
    },
    async withdrawTokens(){
      this.networkSending = true
      try {
        const farmContract = await this.$store.tezosToolkit.wallet.at(this.contract)
        const sendAmt = new BigNumber(this.withdrawInput).times(this.decimalsMap[this.pairName].mantissa)

        const sendResult = await farmContract.methods.withdraw(sendAmt).send()

        emitter.emit('tx-submitted', sendResult)

        await sendResult.confirmation(1)

        this.holdingsData = null
        await this.initialize()
      } catch (e) {
        console.error(e)
      } finally {
        this.networkSending = false
        emitter.emit('tx-finished')
        this.withdrawInput = null
      }
    }
  },
  computed: {
    withdrawShouldBeDisabled(){
      if (this.networkSending || this.globalSending) { return true }
      if (Math.sign(this.withdrawInput) < 1) { return true }
      return new BigNumber(this.withdrawInput).isGreaterThan(
        this.depositedTokens.lpTokenBalance.dividedBy(this.decimalsMap[this.pairName].mantissa)
      )
    },
    poolRatePerWeek(){
      const minutesPerWeek = 10080;
      const secondsPerWeek = minutesPerWeek * 60
      const blocksPerWeek = this.$store.network === Network.Sandbox ? (secondsPerWeek / 4) : minutesPerWeek * 2
      if (this.farmContractData.farmLpTokenBalance.isZero()){
        return this.farmContractData.farmLpTokenBalance
      } else {
        return this.farmContractData.farm.plannedRewards.rewardPerBlock.times(blocksPerWeek).dividedBy(this.decimalsMap.kDAO.mantissa)
      }
    },
    currentRatePerTokenPerWeek(){
      return new BigNumber(1).dividedBy(this.currentRewardPerWeek)
    },
    currentRewardPerWeek(){
      if (this.farmContractData.farmLpTokenBalance.isZero()){
        return this.farmContractData.farmLpTokenBalance
      } else {
        return this.poolRatePerWeek.dividedBy(this.farmContractData.farmLpTokenBalance.dividedBy(this.decimalsMap[this.pairName].mantissa))
      }
    },
    currentPoolPercentage(){
      if (this.depositedTokens.lpTokenBalance.isZero()){
        return new BigNumber(0)
      } else {
        return this.depositedTokens.lpTokenBalance.dividedBy(this.farmContractData.farmLpTokenBalance)
      }
    },
    currentDripRate(){
      return this.currentPoolPercentage.times(this.poolRatePerWeek)
    },
    estimatedRewards(){
      if (this.depositedTokens === undefined || this.depositedTokens === null || this.depositedTokens.lpTokenBalance.isZero()){
        return new BigNumber(0)
      }
      const accRewardPerShareStart = this.depositedTokens.accumulatedRewardPerShareStart

      const nextBlock = new BigNumber(this.$store.currentBlockHeight + 1)
      const multiplier = nextBlock.minus(this.farmContractData.farm.lastBlockUpdate)
      const outstandingReward = multiplier.times(this.farmContractData.farm.plannedRewards.rewardPerBlock)
      const claimedRewards = this.farmContractData.farm.claimedRewards.paid.plus(this.farmContractData.farm.claimedRewards.unpaid)
      const totalRewards = outstandingReward.plus(claimedRewards);
      const plannedRewards = this.farmContractData.farm.plannedRewards.rewardPerBlock.times(this.farmContractData.farm.plannedRewards.totalBlocks)
      const totalRewardsExhausted = totalRewards.isGreaterThan(plannedRewards);
      const reward = totalRewardsExhausted
        ? plannedRewards.minus(claimedRewards)
        : outstandingReward;

      const lpMantissa = new BigNumber(10).pow(36)

      const rewardRatio = reward.times(lpMantissa).div(this.farmContractData.farmLpTokenBalance)
      const accRewardPerShareEnd = this.farmContractData.farm.accumulatedRewardPerShare.plus(rewardRatio)

      const accumulatedRewardPerShare = BigNumber.max(
        accRewardPerShareEnd.minus(accRewardPerShareStart),
        new BigNumber(0)
      )

      const estimatedRewards = accumulatedRewardPerShare.times(this.depositedTokens.lpTokenBalance).dividedBy(lpMantissa)

      this.$emit('new-estimated-rewards', {
        contract: this.contract,
        estimatedRewards,
      })

      return estimatedRewards
    },
  },
  data(){
    return {
      farmContract: null,
      farmContractData: null,
      tokenContractData: null,
      holdingsData: null,
      depositedTokens: null,
      networkSending: false,
      withdrawInput: null,
      depositInput: null,
      decimalsMap: {
        'kDAO': {
          mantissa: new BigNumber(10).pow(18),
        },
        'kUSD': {
          mantissa: new BigNumber(10).pow(18),
          balances: () => this.tokenContractData.balances,
          description: "The kUSD farm allows you to deposit <a class='has-text-weight-bold' target='_blank' rel='noopener' href='https://kolibri.finance/'>kUSD</a> and farm <a class='has-text-weight-bold' target='_blank' rel='noopener' href='https://governance.kolibri.finance/'>Kolibri Governance Tokens (kDAO)</a>.",
        },
        'kUSD/uUSD Flat Curve LP': {
          mantissa: new BigNumber(10).pow(18),
          balances: () => this.tokenContractData.tokens,
          description: "The kUSD/uUSD Flat Curve LP farm allows you to deposit <a class='has-text-weight-bold' target='_blank' rel='noopener' href='https://app.youves.com/swap'>Youves kUSD/uUSD Flat Curve LP Tokens</a> and farm <a class='has-text-weight-bold' target='_blank' rel='noopener' href='https://governance.kolibri.finance/'>Kolibri Governance Tokens (kDAO)</a>.",
        },
        'kUSD/XTZ Quipuswap LP': {
          mantissa: new BigNumber(10).pow(6),
          balances: () => this.tokenContractData.storage.ledger,
          description: "The kUSD/XTZ Quipuswap LP farm allows you to deposit <a class='has-text-weight-bold' target='_blank' rel='noopener' href='https://analytics.quipuswap.com/pairs/KT1K4EwTpbvYN9agJdjpyJm4ZZdhpUNKB3F6'>Quipuswap kUSD/XTZ LP Tokens</a> and farm <a class='has-text-weight-bold' target='_blank' rel='noopener' href='https://governance.kolibri.finance/'>Kolibri Governance Tokens (kDAO)</a>.<br><br><strong>Please note!</strong> Baking rewards are usually paid to the LP holder (see <a rel='noopener' target='_blank' href='https://madfish.crunch.help/quipu-swap/how-to-get-trading-fees-and-baking-rewards-on-quipu-swap'><b>this article</b></a>), but by depositing them in the farm the baking rewards for the XTZ portion of the pair go to the DAO instead.",
        },
        'QLkUSD': {
          mantissa: new BigNumber(10).pow(36),
          balances: () => this.tokenContractData.balances,
          description: "The QLkUSD farm allows you to deposit <a class='has-text-weight-bold' target='_blank' rel='noopener' href='https://kolibri.finance/liquidity-pool'>Kolibri Liquidity Pool Tokens</a> and farm <a class='has-text-weight-bold' target='_blank' rel='noopener' href='https://governance.kolibri.finance/'>Kolibri Governance Tokens (kDAO)</a>.",
        },
      }
    }
  },
  components: {
    Popover
  },
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';

  .farm{
    .popper{
      max-width: 35rem;
    }
    .padded-left{
      margin-left: .25rem;
    }
    .contract-src{
      margin-left: .5rem;
      margin-bottom: 0.3rem;
      img{
        max-height: 2rem;
        &:hover{
          filter: contrast(0.8);
        }
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
    strong.is-underlined{
      border-bottom: 1px solid white;
    }
    hr.bottomless{
      margin-bottom: 0;
    }
    .title{
      margin-bottom: .5rem;
    }
    .button.is-white{
      &:hover{
        color: $primary;
        &[disabled]{
          color: white;
        }
      }
      &:focus{
        border-color: $primary;
        color: $primary;
        &[disabled]{
          color: white;
          border-color: white;
        }
        &.is-loading::after{
          border-color: transparent transparent $primary $primary !important
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
