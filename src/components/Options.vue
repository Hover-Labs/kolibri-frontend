<template>
  <div class="options">
    <transition
      enter-active-class="animate__animated animate__fadeInUp animate__faster"
      leave-active-class="animate__animated animate__fadeOutDown animate__faster"
    >
      <div :key="'menu'" v-show="popupOpen" class="menu">
        <button @click="popupOpen = false" class="delete"></button>
        <div class="contents">
          <div class="contracts">
            <h1 class="title is-6 has-text-white is-marginless">Contracts</h1>
            <div class="content">
              <ul class="has-text-white">
                <li
                  :key="contractKey"
                  v-for="(contractName, contractKey) in contracts"
                >
                  <b>
                    <a
                      class="has-text-white"
                      target="_blank"
                      rel="noopener"
                      :href="bcdLink($store.NETWORK_CONTRACTS[contractKey])"
                      >{{ contractName }}</a
                    >
                  </b>
                </li>
              </ul>
            </div>
          </div>

          <nav class="level node-selector">
            <div class="level-item form-label">
              <div class="is-flex is-align-items-center">
                <div v-show="networkLoading" class="loader is-white"></div>
                <p class="has-text-weight-bold has-text-white">RPC Node</p>
              </div>
            </div>
            <div class="level-item">
              <div class="select is-small">
                <select v-model="selectedNode">
                  <option
                    :key="nodeName"
                    :value="nodeAddresses[$store.network]"
                    v-for="(nodeAddresses, nodeName) in nodes"
                  >
                    {{ nodeName }}
                  </option>
                  <option
                    v-if="
                      getItem($store.nodeOverrideKey) &&
                      !nodesContainsNode(getItem($store.nodeOverrideKey))
                    "
                    :value="getItem($store.nodeOverrideKey)"
                  >
                    {{ getItem($store.nodeOverrideKey) }}
                  </option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
            </div>
          </nav>

          <div class="ipfs-links">
            <p class="has-text-white">
              This site is continuously deployed to
              <a
                target="_blank"
                rel="noopener"
                href="https://docs.ipfs.io/concepts/what-is-ipfs/"
                class="has-text-white has-text-weight-bold"
                >IPFS</a
              >
              with the url:
            </p>
            <pre>
ipns://k51qzi5uqu5dlgtiu5vs75r2cfim0qn9rezu804nrw6x38h85kh8q8c4ake3vn</pre
            >
            <p class="help has-text-white has-text-centered">
              * Make sure to bookmark it!
            </p>
            <div class="buttons is-centered">
              <a
                target="_blank"
                rel="noopener"
                href="https://k51qzi5uqu5dlgtiu5vs75r2cfim0qn9rezu804nrw6x38h85kh8q8c4ake3vn.ipns.dweb.link"
                class="button is-outlined is-white"
              >
                <b>dWeb IPNS Site</b>
              </a>
              <a
                target="_blank"
                rel="noopener"
                href="https://kusd.tez.page/"
                class="button is-outlined is-white"
              >
                <b>Tezos Domains</b>
              </a>
            </div>
          </div>

          <div class="translate-wrapper">
            <h1 class="title is-6 has-text-white is-marginless">Translation</h1>

            <div class="load-google-translate">
              <button
                v-if="!hasLoadedGTranslate"
                :class="{ 'is-loading': loadingGTranslate }"
                @click="loadGTranslate"
                class="button is-white is-outlined has-text-weight-semibold"
              >
                Load Google Translate
              </button>
            </div>

            <div id="google_translate_element"></div>
            <p v-show="hasLoadedGTranslate" class="heading has-text-white">
              Powered by
              <a
                rel="noopener"
                target="_blank"
                class="has-text-white has-text-weight-semibold"
                href="https://translate.google.com/"
                >Google Translate</a
              >
            </p>
          </div>
        </div>
      </div>
    </transition>
    <transition
      enter-active-class="animate__animated animate__fadeInUp animate__faster"
      leave-active-class="animate__animated animate__fadeOutDown animate__faster"
    >
      <div
        :key="'cog'"
        @click="popupOpen = true"
        v-show="!popupOpen"
        class="options-button"
      >
        <img src="../assets/cog.svg" />
      </div>
    </transition>
  </div>
</template>

<script>
import axios from "axios";
import Mixins from "../mixins";

export default {
  name: "Options",
  props: [],
  mixins: [Mixins],
  async mounted() {
    if (
      document.cookie.includes("googtrans=") &&
      !document.cookie.includes("googtrans=/en/en")
    ) {
      await this.loadGTranslate();
    }
  },
  computed: {},
  methods: {
    async loadGTranslate() {
      this.loadingGTranslate = true;
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            // includedLanguages: 'en,ja,ru',
            layout:
              window.google.translate.TranslateElement.InlineLayout.VERTICAL,
          },
          "google_translate_element"
        );
      };

      let translateScript = document.createElement("script");
      translateScript.setAttribute(
        "src",
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
      );

      document.head.appendChild(translateScript);

      await this.waitForElmById(":0.targetLanguage");

      this.loadingGTranslate = false;
      this.hasLoadedGTranslate = true;

      const targetLanguage = document.getElementById(":0.targetLanguage");
      targetLanguage.addEventListener("change", (e) => {
        this.$store.isTranslated = e.target.value !== "en";
      });
    },
    getItem(itemKey) {
      return localStorage.getItem(itemKey);
    },
    nodesContainsNode(nodeURL) {
      const result = Object.values(this.nodes).find((addresses) => {
        return nodeURL === addresses[this.$store.network];
      });

      return result !== undefined;
    },
    waitForElmById(id) {
      return new Promise((resolve) => {
        if (document.getElementById(id)) {
          return resolve(document.getElementById(id));
        }

        const observer = new MutationObserver(() => {
          if (document.getElementById(id)) {
            resolve(document.getElementById(id));
            observer.disconnect();
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      });
    },
  },
  components: {},
  data() {
    let nodes;
    if (this.$store.isSandbox) {
      nodes = {
        "Hover Labs' Sandbox": {
          sandboxnet: "https://sandbox.hover.engineering",
        },
        "127.0.0.1:8732": {
          sandboxnet: "http://127.0.0.1:8732",
        },
      };
    } else {
      nodes = {
        ECADLabs: {
          hangzhounet: "https://hangzhounet.api.tez.ie",
          mainnet: "https://mainnet.api.tez.ie",
        },
        Giganode: {
          hangzhounet: "https://testnet-tezos.giganode.io",
          mainnet: "https://mainnet-tezos.giganode.io",
        },
        SmartPy: {
          hangzhounet: "https://hangzhounet.smartpy.io",
          mainnet: "https://mainnet.smartpy.io",
        },
        TZBeta: {
          hangzhounet: "https://rpctest.tzbeta.net",
          mainnet: "https://rpc.tzbeta.net",
        },
      };
    }

    return {
      contracts: {
        MINTER: "Minter",
        TOKEN: "kUSD Token",
        OVEN_PROXY: "Oven Proxy",
        OVEN_FACTORY: "Oven Factory",
        OVEN_REGISTRY: "Oven Registry",
        DEVELOPER_FUND: "Developer Fund",
        STABILITY_FUND: "Stability Fund",
        ORACLE: "Oracle",
        LIQUIDITY_POOL: "Liquidity Pool",
      },
      popupOpen: false,
      selectedNode: this.$store.nodeURL,
      networkLoading: false,
      hasLoadedGTranslate: false,
      loadingGTranslate: false,
      nodes,
    };
  },
  watch: {
    async selectedNode(newValue, oldValue) {
      if (newValue === "CUSTOM") {
        const result = await this.$swal({
          title: "Please Specify A Node URL",
          input: "text",
          inputAttributes: {
            autocapitalize: "off",
            placeholder: "https://some.tezos.node",
          },
          showCancelButton: true,
          confirmButtonText: "Set Node",
          showLoaderOnConfirm: true,
          preConfirm: async (nodeURL) => {
            nodeURL = nodeURL.replace(/\/+$/, "");

            try {
              new URL(nodeURL);
            } catch (e) {
              await this.$swal.showValidationMessage(e);
              return false;
            }

            try {
              await axios.get(nodeURL + "/chains/main/blocks/head/header");
              return nodeURL;
            } catch (e) {
              await this.$swal.showValidationMessage(`Request failed: ${e}`);
              return false;
            }
          },
          allowOutsideClick: false,
        });

        if (result.isDismissed) {
          this.selectedNode = oldValue;
        }

        if (result.isConfirmed) {
          localStorage.setItem(this.$store.nodeOverrideKey, result.value);
          location.reload();
        }
      } else {
        this.networkLoading = true;
        try {
          await axios.get(newValue + "/chains/main/blocks/head/header");
          localStorage.setItem(this.$store.nodeOverrideKey, newValue);
          location.reload();
        } catch (e) {
          console.error(e);
          this.$swal(
            "Could Not Connect",
            `There was an error in the selected node!<br><pre class="has-text-left">${JSON.stringify(
              e,
              null,
              2
            )}</pre>`,
            "error"
          );
        } finally {
          this.networkLoading = false;
        }
      }
    },
  },
};
</script>

<style type="text/scss" lang="scss">
@import "../assets/sass/globals";

@keyframes rotateForever {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.options {
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 99;
  max-width: 30rem;
  .translate-wrapper {
    display: flex;
    align-items: center;
    flex-direction: column;
    position: relative;
    min-height: 45px;
    border-top: 1px solid white;
    padding-top: 0.5rem;
    & > h1 {
      align-self: flex-start;
    }
    .goog-logo-link {
      display: none;
    }
    .goog-te-gadget {
      font-size: 0;
    }
    .translate-loader {
      width: 100%;
      position: absolute;
      bottom: 0;
      height: 3.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      .loader {
        height: 2rem;
        width: 2rem;
        border: 2px solid white;
        border-right-color: transparent;
        border-top-color: transparent;
      }
    }
  }
  .translate-tools {
    padding: 0.5rem;
  }
  .contents {
    max-height: 90vh;
    overflow-y: scroll;
    padding: 1rem;
  }
  @media screen and (max-width: 30rem) {
    max-width: 97%;
  }
  .node-selector {
    border-top: 1px solid white;
    margin-bottom: 0 !important;
    padding: 0.5rem;
  }
  .options-button {
    cursor: pointer;
    border-radius: 50%;
    padding: 0.45rem;
    margin: 1rem 1.5rem;
    border: 2px solid white;
    background: $primary;
    box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1),
      0 0px 0 1px rgba(10, 10, 10, 0.02);
    display: flex;

    position: absolute;
    height: 3rem;
    width: 3rem;
    right: 0;
    bottom: 0;

    &:hover {
      img {
        animation: rotateForever 1.5s linear infinite;
      }
    }
  }
  .contracts {
    margin-bottom: 0.5rem;
    ul {
      column-count: 2;
    }
  }
  .menu {
    background: $primary;
    position: relative;
    border-top-left-radius: 5px;
    border-left: 2px solid white;
    border-top: 2px solid white;
    .form-label {
      margin-right: 1rem;
      .loader {
        margin-right: 0.5rem;
      }
    }
    .delete {
      position: absolute;
      left: -0.55rem;
      top: -0.55rem;
      background: white;
      border: 2px solid $primary;
      &::before,
      &::after {
        background-color: $primary;
      }
    }
  }
  .ipfs-links {
    border-top: 1px solid white;
    padding: 0.5rem 0;
    pre {
      padding: 0.25rem 0.5rem;
    }
    .buttons {
      margin-top: 0.5rem;
      margin-bottom: 0.25rem;
    }
  }
}

// Google translate stuff
body > .skiptranslate {
  display: none;
}
#goog-gt-tt {
  display: none !important;
}
.goog-text-highlight {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
body {
  top: 0 !important;
}
</style>
