<template>
  <transition
    enter-active-class="animate__animated animate__fadeIn"
    leave-active-class="animate__animated animate__fadeOut"
  >
    <div
      v-if="opened"
      :class="{ 'is-active': opened }"
      class="modal modal-component"
    >
      <div @click="close()" class="modal-background"></div>
      <div class="modal-content">
        <div class="box">
          <div
            v-if="ovenBalance(ovenAddress) > 0"
            class="tabs is-centered is-toggle"
          >
            <ul>
              <li
                v-if="ovenBalance(ovenAddress) > 0"
                @click="$emit('change-page', 'Borrow')"
                :class="{ 'is-active': currentPage === 'Borrow' }"
              >
                <a class="has-text-weight-bold is-disabled">Borrow kUSD</a>
              </li>
              <li
                v-if="borrowedTokens(ovenAddress) > 0"
                @click="$emit('change-page', 'Repay')"
                :class="{ 'is-active': currentPage === 'Repay' }"
              >
                <a class="has-text-weight-bold">Pay Back kUSD</a>
              </li>
              <li
                v-if="ovenBalance(ovenAddress) > 0"
                @click="$emit('change-page', 'Withdraw')"
                :class="{ 'is-active': currentPage === 'Withdraw' }"
              >
                <a class="has-text-weight-bold">Withdraw ꜩ</a>
              </li>
              <li
                @click="$emit('change-page', 'Deposit')"
                :class="{ 'is-active': currentPage === 'Deposit' }"
              >
                <a class="has-text-weight-bold">Deposit ꜩ</a>
              </li>
            </ul>
          </div>
          <h1 v-else class="title is-4">Deposit ꜩ</h1>
          <component
            @close-requested="close()"
            :ovenAddress="ovenAddress"
            :is="currentPage"
          />
        </div>
      </div>
      <button
        @click="close()"
        class="modal-close is-large"
        aria-label="close"
      ></button>
    </div>
  </transition>
</template>

<script>
import Mixins from "@/mixins";

import Borrow from "@/components/modal-subviews/Borrow.vue";
import Repay from "@/components/modal-subviews/Repay.vue";
import Deposit from "@/components/modal-subviews/Deposit.vue";
import Withdraw from "@/components/modal-subviews/Withdraw.vue";

export default {
  name: "OvenManageModal",
  mixins: [Mixins],
  props: {
    opened: {
      type: Boolean,
    },
    currentPage: {
      type: String,
    },
    ovenAddress: {
      type: String,
    },
  },
  async mounted() {},
  data: function () {
    return {
      depositAmount: null,
      withdrawAmount: null,
      borrowAmount: null,
      repayAmount: null,
      networkLoading: false,
    };
  },
  watch: {
    opened(val) {
      if (val) {
        document.documentElement.classList.add("disable-scroll");
      } else {
        document.documentElement.classList.remove("disable-scroll");
      }
    },
  },
  methods: {
    close() {
      this.$emit("close-requested");
      Object.assign(this.$data, this.$options.data());
    },
  },
  computed: {},
  components: {
    Borrow,
    Repay,
    Withdraw,
    Deposit,
  },
};
</script>

<style type="text/scss" lang="scss">
@import "../assets/sass/globals";

.modal-component {
  animation-duration: 250ms;
  animation-timing-function: ease;

  // Remove counter arrowsshouldAllowBorrow
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  // Remove counter arrows on firefox
  input[type="number"] {
    -moz-appearance: textfield;
  }

  .price-view {
    min-width: 4rem;
    display: inline-block;
    text-align: center;
    &.is-warning {
      color: #dcb000;
    }
    &.is-danger {
      color: $danger;
    }
  }

  .progress {
    height: 0.5rem;
    transition: all 1s linear;
    &::-webkit-progress-value {
      transition: width 0.5s ease;
    }
  }
}
</style>
