<template>
  <div class="index">
    <div
        v-if="$store.walletBalance !== null && $store.walletBalanceXTZ !== null"
        class="holdings animate__animated animate__fadeInRight"
    >
      <div class="tags has-addons is-justify-content-flex-end is-marginless">
        <span class="tag">kUSD Holdings</span>
        <span class="tag is-primary">{{ numberWithCommas(walletBalanceFormatted().toFixed(2)) }} kUSD</span>
      </div>
      <div class="tags has-addons is-justify-content-flex-end is-marginless">
        <span class="tag">Tezos Holdings</span>
        <span class="tag is-primary">{{ numberWithCommas(walletBalanceXTZFormatted().toFixed(2)) }} ꜩ</span>
      </div>
    </div>

    <section class="cta">
      <gov-proposal-notification />
      <div v-if="$store.isTestnet" class="columns is-centered top-piece">
        <div class="column is-half-desktop">
          <div class="notification is-warning">
            <b>Please Note!</b> This is a <b>testnet instance</b>, currently running on the <b style="text-transform: capitalize">{{ $store.network }}</b> network.
          </div>
        </div>
      </div>
      <div v-if="$store.isSandbox" class="columns is-centered top-piece">
        <div class="column is-half-desktop">
          <div class="notification is-warning">
            <b>Please Note!</b> This is a <b>sandbox instance</b>, do not expect changes to persist and data may be reverted at any time!
          </div>
        </div>
      </div>
      <div class="columns is-marginless">
        <div class="column cta-column is-6 is-offset-3">
          <div class="columns">
            <div class="column left-column is-6-desktop is-flex is-justify-content-flex-end is-align-items-center is-flex-svg">
              <transition
                  enter-active-class="animate__animated animate__fadeIn animate__faster"
                  leave-active-class="animate__animated animate__fadeOut animate__faster"
                  mode="out-in"
              >
                <img @click="clickCount += 1" v-if='clickCount < 5' class="hummingbird" src="../assets/hummingbird.svg" />
                <div v-else class="hummingbird-pixel-wrapper">
                  <img class="hummingbird hummingbird-pixel" src="../assets/hummingbird-2.png" />
                </div>
              </transition>

            </div>
            <div class="column is-6 is-12-mobile is-flex is-justify-content-center is-flex-direction-column animate__animated animate__fadeIn animate">
              <h1 class="title has-text-weight-bold is-huge notranslate">Kolibri</h1>
              <h2 class="subtitle has-text-weight-light is-huge">Stablecoin</h2>
              <div>
                <router-link :to="{name: 'DocsRoot'}" class="button is-primary is-outlined has-text-weight-bold">Learn More</router-link>
                <a target="_blank" rel="noopener" class="button is-primary is-outlined has-text-weight-bold stats-link" :href="`https://metrics.kolibri.finance/?network=${this.$store.network}`">
                  Metrics
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="info-section animate__animated animate__fadeIn">
      <div class="container">
        <div class="columns is-marginless is-centered">
          <div class="column is-half-widescreen is-three-quarters-desktop">
            <div class="box">

              <stats />

            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="animate__animated animate__fadeIn ovens-wrapper">
      <ovens v-if="$store.wallet !== null" />
      <connect-prompt v-else />
    </div>
  </div>
</template>

<script>
import Mixins from "@/mixins";
import Stats from "@/components/Stats.vue";
import Ovens from "@/components/Ovens.vue";
import ConnectPrompt from "@/components/ConnectPrompt.vue";
import GovProposalNotification from "@/components/GovProposalNotification.vue";

export default {
  name: 'Index',
  mixins: [Mixins],
  async created(){

  },
  data(){
    return {
      clickCount: 0,
      showWarning: true
    }
  },
  components: {
    GovProposalNotification,
    ConnectPrompt,
    Ovens,
    Stats
  },
  methods: {

  }
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';
  .index{
    min-height: calc(100vh - 4rem - 5px);
    background: $light-grey;
    position: relative;
    z-index: 39;
    .top-notification{
      padding-top: 1rem;
    }
    .stats-link{
      margin-left: .5rem;
    }
    .holdings{
      position: absolute;
      right: 0;
      padding: 0 1rem;
      .tags.has-addons{
        margin-bottom: .5rem;
      }
    }
    .prerelease-warning{
      background: white;
      padding: 1rem;
      margin: 0;
      .notification{
        max-width: 65vw;
      }
    }
    .ovens-wrapper{
      position: relative;
      z-index: 1;
      padding-bottom: 1.5rem;
    }
    .navbar{
      border-top: 5px solid $primary;
      padding: 0 .5rem;
      .navbar-start{
        font-weight: bold;
      }
    }
    .navbar-brand{
      padding-right: 4.75rem; // Margin to center the navbar-start/middle stuff
    }
    .hummingbird-pixel-wrapper{
      width: 190px;
      height: 192px;
      transition: all 250ms ease-out;
      text-align: center;
      &:hover{
        filter: drop-shadow(0px 5px 5px rgba(0,0,0,0.1));
      }
    }
    .hummingbird{
      max-height: 12rem;
      transition: all 250ms ease-out;
      &:hover{
        transform: scale(1.1);
        filter: drop-shadow(0px 5px 5px rgba(0,0,0,0.1));
      }
      &.hummingbird-pixel{
        transform: rotate(11deg) scale(1.1);
        &:hover{
          transform: rotate(11deg) scale(1.2);
        }
      }
    }
    h1.is-huge{
      font-size: 4.25rem;
      margin-bottom: .5rem;
    }
    h2.is-huge{
      font-size: 3rem;
      margin-bottom: .5rem;
    }
    .cta{
      padding-top: 2rem;
      background: white;
      .cta-column{
        .is-flex-svg{
          flex: 1 1 auto;
        }
        @include until($desktop){
          width: 80vw;
          margin: auto;
        }
        @include until($tablet){
          width: 100vw;
          margin: auto;
          & > .columns{
            display: flex;
            flex-direction: column;
            align-items: center;
            .column{
              text-align: center;
            }
          }
        }
      }
    }
    .info-section{
      position: relative;
      z-index: 2;
      padding-top: 2rem;
      padding-bottom: 2rem;
      background: linear-gradient(0deg, $light-grey 50%, #FFFFFF 50%);
    }
  }
</style>
