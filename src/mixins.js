import _, { find } from 'lodash'
import {ContractErrors} from '@hover-labs/kolibri-js'
import axios from "axios";
import moment from "moment";

const errorMap = {
    Unknown: "An unknown error has occurred!",
    NotOven: "The Oven you're interacting with isn't registered in the OvenRegistry.",
    NotOvenProxy: "An unknown error has occurred!",
    NotOracle: "An unknown error has occurred!",
    NotGovernor: "An unknown error has occurred!",
    NotMinter: "An unknown error has occurred!",
    NotOwner: "An unknown error has occurred!",
    NotOvenFactory: "An unknown error has occurred!",
    NotAdmin: "An unknown error has occurred!",
    NotPauseGuardian: "An unknown error has occurred!",
    NotUnderCollateralized: "This oven is not below liquidation threshold, and cannot be liquidated.",
    OvenUnderCollateralized: "This transaction failed because it would've left the oven under-collateralized.",
    BadState: "An unknown error has occurred!",
    BadDestination: "An unknown error has occurred!",
    WrongAsset: "An unknown error has occurred!",
    AmountNotAllowed: "An unknown error has occurred!",
    Liquidated: "This oven is already liquidated, so we can't interact with it!",
    StaleData: "The oracle data is older than 30 mins, so the system is paused until the oracle is updated.",
    Paused: "The system is currently paused, either for maintenance or due to some issue.",
    CannotReceiveFunds: "An unknown error has occurred!",
    DebtCeiling: "This transaction would've pushed the system above the global debt ceiling.",
    OvenMaximumExceeded: "Oven debt ceiling thing",
    TokenNoTransferPermission: "An unknown error has occurred!",
    TokenInsufficientBalance: "An unknown error has occurred!",
    TokenUnsafeAllowanceChange: "An unknown error has occurred!",
    TokenNotAdministrator: "An unknown error has occurred!",
}

export default {
    methods: {
        async fetchBakerInfoIfNecessary(){
            if (this.$store.bakers === null){
                const results = await axios.get('https://api.baking-bad.org/v2/bakers')
                this.$store.bakers = results.data.reduce((acc, baker) => {
                    acc[baker.address] = _.omit(baker,'address');
                    return acc
                }, {})
            }
        },
        validBakerAddress(address){
            return address === null || address === '' || address.length === 36;
        },
        truncateChars(fullStr, strLen, separator) {
            if (fullStr.length <= strLen) return fullStr;

            separator = separator || '...';

            let sepLen = separator.length,
                charsToShow = strLen - sepLen,
                frontChars = Math.ceil(charsToShow/2),
                backChars = Math.floor(charsToShow/2);

            return fullStr.substr(0, frontChars) +
                separator +
                fullStr.substr(fullStr.length - backChars);
        },
        handleWalletError(err, title, message) {
            console.error("Error with wallet operation: ", err)

            let errString = message

            const properError = find(err.errors, (error) => {
                return error.with !== undefined
            })

            if (properError !== undefined){
                const errorCode = parseInt(properError.with.int)
                let parsedError = ContractErrors[errorCode]
                errString += `(<b>Error Code: ${errorCode}</b>)<br><br>`
                errString += `<p>${errorMap[parsedError]}</p>`
            } else {
                errString += `<br><pre class="has-text-left">${JSON.stringify(err, null, 2)}</pre>`
                if (err.stack){
                    errString += `<pre class="has-text-left">${err.stack}</pre>`
                }
            }

            this.$swal(title, errString, 'error');
        },
        numberWithCommas(str) {
            let parts = str.toString().split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return parts.join(".");
        },
        borrowedTokens(ovenAddress) {
            if (!ovenAddress) { return 0 }
            if (!this.$store.ownedOvens[ovenAddress]) { return 0 }
            if (!this.$store.ownedOvens[ovenAddress].borrowedTokens) { return 0 }
            return this.$store.ownedOvens[ovenAddress].borrowedTokens
        },
        outstandingTokens(ovenAddress) {
            if (!ovenAddress) { return 0 }
            if (!this.$store.ownedOvens[ovenAddress]) { return 0 }
            if (!this.$store.ownedOvens[ovenAddress].outstandingTokens) { return 0 }
            return this.$store.ownedOvens[ovenAddress].outstandingTokens
        },
        borrowedTokensFormatted(ovenAddress) {
            return this.borrowedTokens(ovenAddress).dividedBy(Math.pow(10, 18))
        },
        outstandingTokensFormatted(ovenAddress) {
            return this.outstandingTokens(ovenAddress).dividedBy(Math.pow(10, 18))
        },
        walletBalance() {
            return this.$store.walletBalance
        },
        walletBalanceFormatted() {
            return this.walletBalance().dividedBy(Math.pow(10, 18))
        },
        walletBalanceXTZ(){
            return this.$store.walletBalanceXTZ
        },
        walletBalanceXTZFormatted() {
            return this.walletBalanceXTZ().dividedBy(Math.pow(10, 6))
        },
        currentPrice() {
            return this.$store.priceData.price
        },
        currentPriceFormatted() {
            return this.currentPrice().dividedBy(Math.pow(10, 6))
        },
        ovenDollarValue(ovenAddress) {
            const currentHoldings = this.ovenBalanceFormatted(ovenAddress)
            const currentPrice = this.currentPriceFormatted()
            return currentPrice.multipliedBy(currentHoldings)
        },
        ovenDollarValuePlusDeposit(ovenAddress, depositAmount) {
            const currentHoldings = this.ovenBalanceFormatted(ovenAddress).plus(depositAmount)
            const currentPrice = this.currentPriceFormatted()
            return currentPrice.multipliedBy(currentHoldings)
        },
        ovenDollarValueMinusWithdraw(ovenAddress, withdrawAmount) {
            const currentHoldings = this.ovenBalanceFormatted(ovenAddress).minus(withdrawAmount)
            const currentPrice = this.currentPriceFormatted()
            return currentPrice.multipliedBy(currentHoldings)
        },
        maxBorrowAmtkUSD(ovenAddress) {
            const borrowedTokens = this.outstandingTokensFormatted(ovenAddress)
            const ovenValue = this.ovenDollarValue(ovenAddress)
            return ovenValue.dividedBy(2).minus(borrowedTokens).decimalPlaces(18)
        },
        collatoralizationWarningClasses(rate) {
            if (rate > 100) {
                return "is-danger"
            } else if (rate > 90) {
                return "is-warning"
            } else {
                return "is-primary"
            }
        },
        currentCollateralRate(ovenAddress) {
            const maxCollateral = this.ovenDollarValue(ovenAddress).dividedBy(2)

            const borrowedTokens = this.outstandingTokensFormatted(ovenAddress)

            // If we have no xtz in the oven, don't try to divide by 0
            if (maxCollateral.isZero()) {
                return 0
            }

            return borrowedTokens.dividedBy(maxCollateral).times(100)
        },
        collatoralizedRateForOven(oven){
            if (parseInt(oven.balance) === 0) { return 0 }

            let currentValue = this.$store.priceData.price.multipliedBy(oven.balance).dividedBy(Math.pow(10, 10))
            let valueHalf = currentValue.dividedBy(2)

            let rate = oven.outstandingTokens.dividedBy(valueHalf).dividedBy(Math.pow(10, 14))

            return rate.toFixed(2)
        },
        ovenBalance(ovenAddress){
            if (!this.$store.ownedOvens[ovenAddress]) { return 0 }
            if (!this.$store.ownedOvens[ovenAddress].balance) { return 0 }
            return this.$store.ownedOvens[ovenAddress].balance
        },
        ovenBalanceFormatted(ovenAddress) {
            return this.ovenBalance(ovenAddress).dividedBy(Math.pow(10, 6))
        },
        ovenClient(ovenAddress) {
            return this.$store.getOvenClient(this.$store.wallet, ovenAddress)
        },
        tzktLinkContract(contract){
            if (this.$store.network === 'hangzhounet'){
                return `https://hangzhou2net.tzkt.io/${contract}`
            } else if (this.$store.isSandbox) {
                return `https://bcd.hover.engineering/sandboxnet/${contract}`
            } else {
                return `https://tzkt.io/${contract}`
            }
        },
        tzktLinkTx(opHash){
            if (this.$store.network === 'hangzhounet'){
                return `https://hangzhou2net.tzkt.io/${opHash}`
            } else if (this.$store.isSandbox) {
                return `https://bcd.hover.engineering/sandboxnet/opg/${opHash}`
            } else {
                return `https://tzkt.io/${opHash}`
            }
        },
        tzktAPILink(){
            if (this.$store.network === 'granadanet'){
                return `https://api.granadanet.tzkt.io`
            } else if (this.$store.isSandbox) {
                return null
            } else {
                return `https://api.tzkt.io`
            }
        },
        bcdLink(contract){
            if (this.$store.network === 'hangzhounet'){
                return `https://better-call.dev/granahangzhou2netdanet/${contract}`
            } else if (this.$store.isSandbox) {
                return `https://bcd.hover.engineering/sandboxnet/${contract}`
            } else {
                return `https://better-call.dev/mainnet/${contract}`
            }
        },
        liquidatablePrice(ovenAddress){
            let rateDelta = 1 - this.currentCollateralRate(ovenAddress).dividedBy(100).toNumber()
            let currentPrice = this.$store.priceData.price.dividedBy(Math.pow(10, 6))

            return currentPrice.minus(currentPrice.times(rateDelta))
        },
        calculateSandboxStabFeeTime(){
            const epochTimeSeconds = new Date('Mon 06 Sep 2021 04:07:58 PM GMT-0400').getTime() / 1000
            const epochBlock = 17397

            const blockDiff = this.$store.currentBlockHeight - epochBlock

            const newFakeTimestamp = epochTimeSeconds - (blockDiff * 4)

            return new Date(newFakeTimestamp * 1000)
        },
        govLink(){
            if (this.$store.isTestnet){
                return 'https://testnet-governance.kolibri.finance'
            } else if (this.$store.isSandbox){
                return 'https://governance-sandbox.kolibri.finance'
            } else {
                return 'https://governance.kolibri.finance'
            }
        },
        // BigNumber doesn't support toLocaleString properly, so wrap it here
        formatNumber(num, places){
            return parseFloat(num).toLocaleString(undefined, {minimumFractionDigits: places === undefined ? 2 : places, maximumFractionDigits: places === undefined ? 2 : places})
        },
        formatMoment(now, time){
            const duration = now.diff(moment(time))
            return moment.duration(duration).humanize()
        },
    },
    computed: {
    }
}
