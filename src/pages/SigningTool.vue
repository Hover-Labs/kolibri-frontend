<template>
  <div class="signing-tool animate__animated animate__fadeIn">
    <div class="container is-max-desktop">
      <div class="box">
        <div class="header">
          <h1 class="title is-4 is-marginless">Multi-Sig Signing Tool</h1>
        </div>
        <div class="columns is-marginless">
          <div class="column is-paddingless">
            <div class="signer-content content">
              <div class="field">
                <label class="label">Message</label>
                <div class="control">
                  <textarea class="textarea" placeholder="0x..." v-model="message"></textarea>
                </div>
              </div>
              <div class="field">
                <label class="label">Decoded Message</label>
                <div class="control">
                  <textarea v-text="decodedMessage" readonly class="textarea" placeholder="Your Decoded Payload Will Appear Here"></textarea>
                </div>
              </div>
              <div v-if="false" class="field">
                <label class="label">Human Readable</label>
                <div class="control">
                  <template v-if="message !== null">
                    <p class="is-family-monospace"><b>Send Amt:</b> {{ humanReadableMessage.mutezToSend }} mutez</p>
                    <p class="is-family-monospace"><b>ChainID:</b> {{ humanReadableMessage.chainID }}</p>
                    <p class="is-family-monospace"><b>OperationID:</b> {{ humanReadableMessage.operationID }}</p>
                    <p class="is-family-monospace"><b>Function:</b></p>
                    <p class="function">
                      Contract: <a>{{ humanReadableMessage.functionAddress }}</a>
                      <br>
                      Call: <a>{{ humanReadableMessage.functionCall }}</a>(<a>{{ humanReadableMessage.toAddress }}</a>)
                    </p>
                  </template>
                </div>
              </div>
              <div class="field">
                <label class="label">Signature</label>
                <div class="control">
                  <input v-if="signatureResult === null" :disabled="signatureResult === null" class="input" placeholder="Signature Will Appear Here" />
                  <input v-else class="input" readonly placeholder="Signature Will Appear Here" v-model="signatureResult.signature" />
                </div>
              </div>
              <div class="field is-grouped is-grouped-right">
                <div class="control">
                  <button @click="signPayload" v-if="$store.wallet !== null" :disabled="signatureResult !== null" class="button is-primary">Sign Message</button>
                  <button class="button is-primary" @click="$eventBus.$emit('wallet-connect-request')" v-else>Connect Wallet</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { TezosLanguageUtil } from 'conseiljs'

  export default {
    name: "SigningTool",
    data() {
      return {
        message: null,
        signatureResult: null,
      }
    },
    methods: {
      async signPayload(){
        this.signatureResult = await this.$store.wallet.client.requestSignPayload({payload: this.message})
        this.$log(this.signatureResult)
      }
    },
    computed: {
      decodedMessage(){
        if (this.message === null || !this.message.startsWith('0x')){
          return null
        } else {
          return TezosLanguageUtil.normalizeMichelsonWhiteSpace(
            TezosLanguageUtil.hexToMichelson(this.message.substr(4)).code
          )
        }
      }
    }
  }
</script>

<style lang="scss" type="text/scss">
  @import '../assets/sass/globals';
  .signing-tool{
    background: $light-grey;
    min-height: calc(100vh - 4rem - 5px);
    .function{
      margin-left: 1rem;
    }
    .container{
      padding: 3rem 0;
    }
    .is-height-full{
      height: 100%;
    }
    .box{
      padding: 0;
      .header{
        padding: 1rem 2rem;
        border-bottom: 2px solid $light-grey;
      }
      .signer-content{
        padding: 1rem 2rem;
      }
    }
  }
</style>
