import { useWorkspace } from '@/composables'
import { PublicKey } from '@solana/web3.js'

export const deleteTweet = async (tweet) => {
  const { wallet, program } = useWorkspace()

  // Get user profile PDA
  const [userProfilePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('user-profile'), wallet.value.publicKey.toBuffer()],
    program.value.programId,
  )

  await program.value.methods
    .deleteTweet(tweet.topic)
    .accounts({
      tweet: tweet.publicKey,
      userProfile: userProfilePDA,
      author: wallet.value.publicKey,
    })
    .rpc()
}
