import Vue from 'vue'

import { WalletStates } from './enums'

import {
    CONTRACTS,
    HarbingerClient,
    OvenClient,
    StableCoinClient,
    TokenClient,
    Network,
    SavingsPoolClient
} from "@hover-labs/kolibri-js";
import { TezosToolkit } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import _ from 'lodash'

const FORCE_MAINNET = true
// const FORCE_MAINNET = false

function dontIndexTestnets() {
    // If we're in testnet tell google not to index
    const link = document.createElement('meta');
    link.setAttribute('name', 'robots');
    link.content = 'noindex';
    document.getElementsByTagName('head')[0].appendChild(link);
}

let NETWORK, NODE_URL, NETWORK_CONTRACTS, isTestnet, farmContracts, isSandbox
if ((
    // window.location.hostname === 'localhost' ||  window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'testnet.kolibri.finance') && !FORCE_MAINNET) {
    NODE_URL = 'https://hangzhounet.api.tez.ie'
    NETWORK = Network.Hangzhou

    NETWORK_CONTRACTS = CONTRACTS.TEST

    isTestnet = true
    isSandbox = false

    farmContracts = {
        'kUSD': NETWORK_CONTRACTS.FARMS.KUSD.farm,
        'QLkUSD': NETWORK_CONTRACTS.FARMS.QLKUSD.farm,
        'kUSD Quipu LP': NETWORK_CONTRACTS.FARMS.KUSD_LP.farm,
    }

    dontIndexTestnets()
} else if ((
    window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' ||
    window.location.hostname === 'sandbox.kolibri.finance') && !FORCE_MAINNET) {

    NODE_URL = 'https://sandbox.hover.engineering'
    NETWORK = Network.Sandbox

    NETWORK_CONTRACTS = CONTRACTS.SANDBOX

    isTestnet = false
    isSandbox = true

    farmContracts = {
        'kUSD': CONTRACTS.SANDBOX.FARMS.KUSD.farm,
        'QLkUSD': CONTRACTS.SANDBOX.FARMS.QLKUSD.farm,
        'kUSD Quipu LP': CONTRACTS.SANDBOX.FARMS.KUSD_LP.farm
    }

    dontIndexTestnets()
} else if (window.location.hostname === 'zeronet.kolibri.finance') {
    NODE_URL = 'https://rpczero.tzbeta.net'
    NETWORK = Network.Hangzhou
    NETWORK_CONTRACTS = CONTRACTS.ZERO
    isTestnet = true
    isSandbox = false

    farmContracts = {}

    dontIndexTestnets()
} else {
    // NODE_URL = 'https://mainnet-tezos.giganode.io'
    NODE_URL = 'https://mainnet.api.tez.ie'

    NETWORK = Network.Mainnet
    NETWORK_CONTRACTS = CONTRACTS.MAIN

    isTestnet = false
    isSandbox = false

    farmContracts = {
        'kUSD Quipu LP': NETWORK_CONTRACTS.FARMS.KUSD_LP.farm,
        'kUSD': NETWORK_CONTRACTS.FARMS.KUSD.farm,
        'QLkUSD': NETWORK_CONTRACTS.FARMS.QLKUSD.farm,
    }
}

// Custom oven names
const ovenNameMapping = window.localStorage.getItem('oven-names')
let ovenNames
if (ovenNameMapping !== null) {
    try {
        ovenNames = JSON.parse(ovenNameMapping)
    } catch (e) {
        // There's a problem loading oven names
        localStorage.setItem('oven-names', null)
        ovenNames = {}
    }
} else {
    ovenNames = {}
}

const nodeOverrideKey = `${NETWORK}-nodeOverride`
NODE_URL = localStorage.getItem(nodeOverrideKey) ? localStorage.getItem(nodeOverrideKey) : NODE_URL

let state = Vue.observable({
    currentBlockHeight: null,
    allOvensData: null,
    priceData: null,
    ovenCount: null,
    stabilityFee: null,
    privateLiquidationThreshold: null,
    collateralRate: null,
    ownedOvens: null,
    balanceData: null,
    wallet: null,
    walletStates: WalletStates,
    walletState: WalletStates.DISCONNECTED,
    walletPKH: null,
    walletBalance: null,
    walletBalanceXTZ: null,
    simpleStabilityFee: null,
    stabilityFundHoldings: null,
    devFundHoldings: null,
    kdaoHoldings: null,
    debtCeiling: null,
    bakers: null,
    defaultOvenBaker: null,
    lpData: null,
    lpBalance: null,
    lpTokenAddress: null,
    lpMantissa: new BigNumber(10).pow(36),
    daoStorage: null,
    lpDisabled: true,
    ovenNames: ovenNames,
    network: NETWORK,
    nodeURL: NODE_URL,
    nodeOverrideKey,
    daoToken: NETWORK_CONTRACTS.DAO_TOKEN,
    isTestnet,
    isSandbox,
    NETWORK_CONTRACTS,
    farmContracts,
})

if (NETWORK === Network.Sandbox) {
    const sandboxOverrides = localStorage.getItem('sandbox-overrides')
    if (sandboxOverrides !== null) {
        const newState = JSON.parse(sandboxOverrides)
        state = _.merge(state, newState)
    }
}

state = _.merge(state, {
    tezosToolkit: new TezosToolkit(state.nodeURL),
    tokenClient: new TokenClient(state.nodeURL, state.NETWORK_CONTRACTS.TOKEN),
    harbingerClient: new HarbingerClient(state.nodeURL,
        state.NETWORK_CONTRACTS.HARBINGER_NORMALIZER
    ),
    stableCoinClient: new StableCoinClient(state.nodeURL,
        state.network,
        state.NETWORK_CONTRACTS.OVEN_REGISTRY,
        state.NETWORK_CONTRACTS.MINTER,
        state.NETWORK_CONTRACTS.OVEN_FACTORY,
        // If on our sandbox, load from
        NETWORK === Network.Sandbox ? 'https://bcd.hover.engineering' : undefined
    ),
    getSavingsPoolClient(wallet, poolAddress) {
        return new SavingsPoolClient(state.nodeURL, wallet, poolAddress)
    },
    getOvenClient(wallet, ovenAddress) {
        return new OvenClient(state.nodeURL, wallet, ovenAddress, this.stableCoinClient, this.harbingerClient)
    },
})

// Update polling interval to 2s in sandbox mode
if (isSandbox){
    state.tezosToolkit.setProvider({config: {confirmationPollingIntervalSecond: 2}})
}

export default state
