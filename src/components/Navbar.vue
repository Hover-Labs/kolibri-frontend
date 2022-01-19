<template>
  <nav class="navbar animate__animated animate__fadeIn">
    <wallet-manager />
    <div class="navbar-brand">
      <router-link
        :to="{name: 'Index'}"
        exact
        class="navbar-item"
      >
        <img src="../assets/kolibri-brand.png">
      </router-link>

      <a @click="menuOpen=!menuOpen" role="button" v-on:clickout="menuOpen=false" class="navbar-burger" :class="{'is-active': menuOpen}">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>

    <div class="navbar-menu" :class="{'is-active': menuOpen}">
      <div class="navbar-start is-justify-content-center is-flex-grow-1">

        <router-link
            :to="{name: 'Index'}"
            exact
            class="navbar-item"
        >
          Home
        </router-link>

        <router-link
            :to="{name: 'AllOvens'}"
            class="navbar-item"
        >
          All Ovens
        </router-link>

        <router-link
            :to="{name: 'DocsRoot'}"
            class="navbar-item"
        >
          Docs
        </router-link>

        <router-link
          :to="{name: 'LiquidityPool'}"
          class="navbar-item"
        >
          Liquidity Pool
        </router-link>

        <router-link
          :to="{name: 'SavingsRate'}"
          class="navbar-item"
        >
          Savings Rate
        </router-link>

        <router-link
          :to="{name: 'Farming'}"
          class="navbar-item"
        >
          Farming
        </router-link>

        <a :href="govLink()"
           target="_blank"
           rel="noopener"
           class="navbar-item"
        >
          Governance
          <transition
            enter-active-class="animate__animated animate__fadeIn"
            leave-active-class="animate__animated animate__fadeOut"
          >
            <div v-if="$store.daoStorage && $store.daoStorage.poll !== null" class="new-badge">New Proposal!</div>
          </transition>
        </a>

      </div>

      <div class="navbar-end">
        <div class="navbar-item wallet-connector">
          <div v-if="$store.wallet === null || $store.wallet.connected === false" class="buttons">
            <button
              @click="$eventBus.$emit('wallet-connect-request')"
              class="button connect-button is-primary is-small"
            >
              <strong>Connect Wallet</strong>
            </button>
          </div>
          <div class="is-flex is-align-items-center" v-else>
            <div class="avatar"><div class="image is-48x48" v-html="avatarSvg()"></div></div>
            <div class="wallet-info">
              <p class="has-text-weight-bold has-text-right">
                <a @click="$eventBus.$emit('wallet-reconnect-request')">
                  {{ truncateChars(this.$store.walletPKH, 18) }}
                </a>
              </p>
              <p class="heading has-text-right">Network: <strong>{{ $store.network }}</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import Mixins from '@/mixins'
import WalletManager from "@/components/WalletManager";
import {WalletStates} from "@/enums";

import Avatars from '@dicebear/avatars';
import sprites from '@dicebear/avatars-bottts-sprites';

let options = {};
let avatars = new Avatars(sprites, options);

export default {
  name: 'Navbar',
  mixins: [Mixins],
  async mounted(){
  },
  data: function () {
    return {
      menuOpen: false,
      WalletStates,
    }
  },
  methods: {
    avatarSvg(){
      return avatars.create(this.$store.walletPKH.toString(), {
        width: 48,
        height: 48,
        margin: 4,
      })
    }
  },
  components: {
    WalletManager,
  },
}
</script>

<style type="text/scss" lang="scss">
@import '../assets/sass/globals';

.navbar{
  border-top: 5px solid $primary;
  padding: 0 .5rem;
  position: relative;
  z-index: 1;
  .new-badge{
    background: $primary;
    position: absolute;
    bottom: 0.2rem;
    padding: 0.1rem 0.25rem;
    font-size: 0.6rem;
    border-radius: 0.5rem;
    color: white;
    right: 0.6rem;
  }
  .wallet-info{
    margin-left: .5rem;
  }
  .navbar-start{
    font-weight: bold;
  }
  .navbar-brand{
    @include from($widescreen){
      min-width: 14.5rem;
    }
  }
  .navbar-item.wallet-connector{
    min-width: 14.5rem;
    justify-content: flex-end;
  }
  .popper.address-full-width{
    padding: 0.5rem 1rem;
  }
}

</style>
