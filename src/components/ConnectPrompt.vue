<script>
import {WalletStates} from "@/enums";
import emitter from "@/bus"

export default {
  name: 'ConnectPrompt',
  async mounted(){
  },
  data: function () {
    return {
      WalletStates,
      emitter, // Add emitter to data
    }
  },
  components: {

  },
}
</script>

<template>
  <section class="connect-prompt">
    <h1 class="title">Connect Your Wallet To Manage Your Ovens 👩‍🍳</h1>
    <button
        @click="emitter.emit('wallet-connect-request')"
        class="button is-primary has-text-weight-bold is-large"
    >
      Connect To Wallet
    </button>
  </section>
</template>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';
  .connect-prompt {
    background: $light-grey;
    padding: 2rem 2rem 4rem;
    text-align: center;
  }
</style>
