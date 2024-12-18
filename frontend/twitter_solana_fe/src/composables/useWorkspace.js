import { computed } from 'vue'
import { useAnchorWallet } from 'solana-wallets-vue'
import { Connection } from '@solana/web3.js'
import { AnchorProvider as Provider, Program } from '@coral-xyz/anchor'
import idl from '@/idl/twitter_solana.json'

const clusterUrl = import.meta.env.VITE_CLUSTER_URL
const preflightCommitment = 'processed'
const commitment = 'processed'
let workspace = null

export const useWorkspace = () => workspace

export const initWorkspace = () => {
  const wallet = useAnchorWallet()
  const connection = new Connection(clusterUrl, commitment)
  const provider = computed(
    () => new Provider(connection, wallet.value, { preflightCommitment, commitment }),
  )
  const program = computed(() => new Program(idl, provider.value))

  workspace = {
    wallet,
    connection,
    provider,
    program,
  }
}
